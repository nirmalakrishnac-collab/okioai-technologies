import crypto from 'crypto';
import type {NextFunction, Request, Response} from 'express';
import {db} from './db.ts';

// Ephemeral in-memory fallback signing key if SESSION_SECRET is unset (never hardcoded, never written to .env.example)
const SIGNING_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface AdminSessionPayload {
  role: 'super_admin';
  exp: number;
  nonce: string;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminSessionPayload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function verifyEnvPasscode(candidate: string): boolean {
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (!envPass) return false;
  const candidateDigest = crypto.createHash('sha256').update(candidate).digest();
  const envDigest = crypto.createHash('sha256').update(envPass).digest();
  return crypto.timingSafeEqual(candidateDigest, envDigest);
}

export function getAuthStatus(): {needsSetup: boolean; usingEnvPasscode: boolean} {
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (envPass) {
    return {needsSetup: false, usingEnvPasscode: true};
  }
  const existing = db.prepare('SELECT id FROM admin_credentials WHERE id = 1').get();
  return {needsSetup: !existing, usingEnvPasscode: false};
}

export function issueSessionToken(role: 'super_admin' = 'super_admin'): string {
  const payload: AdminSessionPayload = {
    role,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: crypto.randomBytes(12).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SIGNING_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): AdminSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SIGNING_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    if (parsed.role !== 'super_admin') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({error: 'Administrator authentication required.'});
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({error: 'Session expired or invalid. Please sign in again.'});
    return;
  }
  req.admin = payload;
  next();
}
