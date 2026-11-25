import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {createServer as createViteServer} from 'vite';
import {
  getAuthStatus,
  hashPassword,
  issueSessionToken,
  requireAdmin,
  verifyEnvPasscode,
  verifyPasswordHash,
} from './src/server/auth.ts';
import {
  db,
  getSettings,
  initDatabase,
  mapAppRow,
  mapContactRow,
  mapLegalRow,
  mapPostRow,
} from './src/server/db.ts';
import {
  buildRobotsTxt,
  buildSitemapXml,
  buildSsrSeoHead,
  resolveBaseUrl,
} from './src/server/seo.ts';
import {APP_CATEGORIES, BLOG_CATEGORIES} from './src/types/cms.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(express.json({limit: '2mb'}));

// Security headers suitable for AI Studio iframe preview and production
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Safe uploads directory
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, {recursive: true});
}

const allowedMimeToExt: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = allowedMimeToExt[file.mimetype];
      if (!ext) {
        cb(new Error('Unsupported image format. Use PNG, JPG, or WEBP.'), '');
        return;
      }
      const name = `${crypto.randomUUID()}${ext}`;
      const resolved = path.resolve(UPLOADS_DIR, name);
      if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
        cb(new Error('Invalid upload destination.'), '');
        return;
      }
      cb(null, name);
    },
  }),
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeToExt[file.mimetype]) {
      cb(new Error('Only PNG, JPG, and WEBP images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

app.use('/uploads', express.static(UPLOADS_DIR, {maxAge: '7d'}));

// Simple sliding-window rate limiter in memory
const rateBuckets = new Map<string, {count: number; resetAt: number}>();
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, {count: 1, resetAt: now + windowMs});
    return true;
  }
  if (bucket.count >= maxRequests) return false;
  bucket.count += 1;
  return true;
}

function sanitizeUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/src/assets/')
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function isSafeWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function publishDueScheduledPosts(): void {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE blog_posts
     SET status = 'published', published_at = COALESCE(scheduled_at, ?), updated_at = ?
     WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?`,
  ).run(now, now, now);
}

// ==========================================
// SEO INFRASTRUCTURE ROUTES
// ==========================================
app.get('/robots.txt', (req, res) => {
  const baseUrl = resolveBaseUrl(req);
  res.type('text/plain').send(buildRobotsTxt(baseUrl));
});

app.get('/sitemap.xml', (req, res) => {
  publishDueScheduledPosts();
  const baseUrl = resolveBaseUrl(req);
  res.type('application/xml').send(buildSitemapXml(baseUrl));
});

// ==========================================
// PUBLIC API ROUTES
// ==========================================
app.get('/api/public/bootstrap', (_req, res) => {
  publishDueScheduledPosts();
  const fullSettings = getSettings();
  const {
    lead_forward_email: _privateLeadEmail,
    web3forms_access_key: _privateWeb3Key,
    ...settings
  } = fullSettings;

  const publishedApps = (
    db
      .prepare("SELECT * FROM apps WHERE status = 'published' ORDER BY is_featured DESC, updated_at DESC")
      .all() as Record<string, unknown>[]
  ).map(mapAppRow);

  const comingSoonApps = (
    db
      .prepare("SELECT * FROM apps WHERE status = 'coming_soon' ORDER BY is_featured DESC, created_at ASC")
      .all() as Record<string, unknown>[]
  ).map(mapAppRow);

  const latestPosts = (
    db
      .prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 3")
      .all() as Record<string, unknown>[]
  ).map(mapPostRow);

  const legalPages = (
    db.prepare('SELECT slug, title, updated_at FROM legal_pages ORDER BY slug ASC').all() as Record<
      string,
      unknown
    >[]
  ).map((r) => ({slug: String(r.slug), title: String(r.title), updated_at: String(r.updated_at)}));

  res.json({
    settings,
    publishedApps,
    comingSoonApps,
    latestPosts,
    legalPages,
  });
});

app.get('/api/public/apps', (_req, res) => {
  const rows = db
    .prepare(
      "SELECT * FROM apps WHERE status IN ('published', 'coming_soon') ORDER BY CASE WHEN status = 'published' THEN 0 ELSE 1 END, is_featured DESC, updated_at DESC",
    )
    .all() as Record<string, unknown>[];
  res.json({apps: rows.map(mapAppRow)});
});

app.get('/api/public/apps/:slug', (req, res) => {
  const slug = String(req.params.slug || '').trim();
  const row = db
    .prepare("SELECT * FROM apps WHERE slug = ? AND status IN ('published', 'coming_soon')")
    .get(slug) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({error: 'Application not found.'});
    return;
  }
  res.json({app: mapAppRow(row)});
});

app.get('/api/public/posts', (_req, res) => {
  publishDueScheduledPosts();
  const rows = db
    .prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC")
    .all() as Record<string, unknown>[];
  res.json({posts: rows.map(mapPostRow)});
});

app.get('/api/public/posts/:slug', (req, res) => {
  publishDueScheduledPosts();
  const slug = String(req.params.slug || '').trim();
  const row = db
    .prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'")
    .get(slug) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({error: 'Article not found.'});
    return;
  }
  const post = mapPostRow(row);
  const relatedRows = db
    .prepare(
      "SELECT * FROM blog_posts WHERE status = 'published' AND slug != ? ORDER BY CASE WHEN category = ? THEN 0 ELSE 1 END, published_at DESC LIMIT 3",
    )
    .all(slug, post.category) as Record<string, unknown>[];
  res.json({post, related: relatedRows.map(mapPostRow)});
});

app.get('/api/public/legal/:slug', (req, res) => {
  const slug = String(req.params.slug || '').trim();
  const row = db.prepare('SELECT * FROM legal_pages WHERE slug = ?').get(slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    res.status(404).json({error: 'Legal document not found.'});
    return;
  }
  res.json({page: mapLegalRow(row)});
});

app.post('/api/contact', async (req, res) => {
  const ipKey = `contact:${req.ip || 'unknown'}`;
  if (!checkRateLimit(ipKey, 10, 15 * 60 * 1000)) {
    res.status(429).json({error: 'Too many enquiries submitted recently. Please try again in a few minutes.'});
    return;
  }

  const body = req.body as Record<string, unknown>;
  // Honeypot anti-spam trap
  if (typeof body.website_url === 'string' && body.website_url.trim().length > 0) {
    res.status(400).json({error: 'Spam protection triggered.'});
    return;
  }

  const inquiryType = String(body.inquiry_type || 'general').trim();
  const allowedTypes = new Set(['general', 'business', 'app', 'partnership']);
  if (!allowedTypes.has(inquiryType)) {
    res.status(400).json({error: 'Invalid enquiry category.'});
    return;
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (name.length < 2 || name.length > 120) {
    res.status(400).json({error: 'Please enter your name (2 to 120 characters).'});
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    res.status(400).json({error: 'Please enter a valid email address.'});
    return;
  }
  if (subject.length < 3 || subject.length > 200) {
    res.status(400).json({error: 'Please provide a clear subject (3 to 200 characters).'});
    return;
  }
  if (message.length < 15 || message.length > 5000) {
    res.status(400).json({error: 'Please provide a message between 15 and 5,000 characters.'});
    return;
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      'INSERT INTO contact_messages (inquiry_type, name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(inquiryType, name, email, subject, message, 'new', now);

  let forwarded = false;
  const settings = getSettings();
  const leadRecipient = (settings.lead_forward_email || 'nirmalavamsi1431@gmail.com').trim();

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL?.trim();
  if (webhookUrl && isSafeWebhookUrl(webhookUrl)) {
    // Non-blocking webhook dispatch with timeout
    void fetch(webhookUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: result.lastInsertRowid,
        inquiry_type: inquiryType,
        name,
        email,
        subject,
        message,
        created_at: now,
      }),
      signal: AbortSignal.timeout(6000),
    }).catch(() => {});
    forwarded = true;
  }

  const web3formsKey = (settings.web3forms_access_key || '').trim();

  res.status(201).json({
    ok: true,
    id: Number(result.lastInsertRowid),
    forwarded,
    formsubmitEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadRecipient) ? leadRecipient : undefined,
    web3formsAccessKey: web3formsKey || undefined,
    message: 'Your enquiry has been recorded and routed to the OKIOAI team.',
  });
});

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================
app.get('/api/admin/auth/status', (_req, res) => {
  res.json(getAuthStatus());
});

app.post('/api/admin/auth/setup', (req, res) => {
  const status = getAuthStatus();
  if (status.usingEnvPasscode) {
    res.status(403).json({error: 'Admin passcode is managed via environment configuration.'});
    return;
  }
  if (!status.needsSetup) {
    res.status(409).json({error: 'Admin account has already been configured.'});
    return;
  }

  const password = String((req.body as Record<string, unknown>)?.password || '');
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({error: 'Choose a strong password between 8 and 128 characters.'});
    return;
  }

  const hashed = hashPassword(password);
  const now = new Date().toISOString();
  try {
    db.prepare('INSERT INTO admin_credentials (id, password_hash, role, created_at) VALUES (1, ?, ?, ?)').run(
      hashed,
      'super_admin',
      now,
    );
  } catch {
    res.status(409).json({error: 'Admin account has already been configured.'});
    return;
  }

  const token = issueSessionToken('super_admin');
  res.status(201).json({token, role: 'super_admin'});
});

app.post('/api/admin/auth/login', (req, res) => {
  const ipKey = `login:${req.ip || 'unknown'}`;
  if (!checkRateLimit(ipKey, 15, 15 * 60 * 1000)) {
    res.status(429).json({error: 'Too many sign-in attempts. Please wait 15 minutes.'});
    return;
  }

  const password = String((req.body as Record<string, unknown>)?.password || '');
  if (!password) {
    res.status(400).json({error: 'Password is required.'});
    return;
  }

  const status = getAuthStatus();
  if (status.usingEnvPasscode) {
    if (!verifyEnvPasscode(password)) {
      res.status(401).json({error: 'Invalid administrator credentials.'});
      return;
    }
    res.json({token: issueSessionToken('super_admin'), role: 'super_admin'});
    return;
  }

  if (status.needsSetup) {
    res.status(400).json({error: 'Admin password has not been claimed yet.'});
    return;
  }

  const cred = db.prepare('SELECT password_hash, role FROM admin_credentials WHERE id = 1').get() as
    | {password_hash: string; role: 'super_admin'}
    | undefined;
  if (!cred || !verifyPasswordHash(password, cred.password_hash)) {
    res.status(401).json({error: 'Invalid administrator credentials.'});
    return;
  }

  res.json({token: issueSessionToken(cred.role), role: cred.role});
});

app.get('/api/admin/auth/me', requireAdmin, (req, res) => {
  res.json({authenticated: true, role: (req as unknown as {admin: {role: string}}).admin.role});
});

// ==========================================
// PROTECTED ADMIN CMS ROUTES
// ==========================================
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({error: err instanceof Error ? err.message : 'Upload failed.'});
      return;
    }
    if (!req.file) {
      res.status(400).json({error: 'No image file provided.'});
      return;
    }
    res.status(201).json({url: `/uploads/${req.file.filename}`});
  });
});

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json({settings: getSettings()});
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const b = req.body as Record<string, unknown>;
  const current = getSettings();
  const now = new Date().toISOString();

  const futureServices = Array.isArray(b.future_services)
    ? b.future_services
        .slice(0, 12)
        .map((item: unknown, idx: number) => {
          const obj = (item || {}) as Record<string, unknown>;
          return {
            id: slugify(String(obj.id || obj.title || `service-${idx}`)) || `service-${idx}`,
            title: String(obj.title || '').trim().slice(0, 120),
            description: String(obj.description || '').trim().slice(0, 500),
            status: obj.status === 'available' ? 'available' : 'coming_soon',
          };
        })
        .filter((s) => s.title.length > 0)
    : current.future_services;

  const leadEmailCandidate = String(
    b.lead_forward_email ?? current.lead_forward_email ?? 'nirmalavamsi1431@gmail.com',
  )
    .trim()
    .slice(0, 160);

  const web3formsKeyCandidate = String(
    b.web3forms_access_key ?? current.web3forms_access_key ?? '',
  )
    .trim()
    .slice(0, 120);

  db.prepare(`
    UPDATE site_settings SET
      company_name = ?, tagline = ?, alt_statement = ?,
      hero_headline = ?, hero_subheadline = ?,
      intro_title = ?, intro_body = ?,
      mission_text = ?, vision_text = ?, future_solutions_notice = ?,
      contact_email = ?, contact_phone = ?, office_address = ?, lead_forward_email = ?, web3forms_access_key = ?,
      social_github = ?, social_x = ?, social_linkedin = ?, social_playstore_dev = ?,
      future_services_json = ?, analytics_measurement_id = ?, admob_publisher_note = ?,
      updated_at = ?
    WHERE id = 1
  `).run(
    String(b.company_name ?? current.company_name).trim().slice(0, 120),
    String(b.tagline ?? current.tagline).trim().slice(0, 120),
    String(b.alt_statement ?? current.alt_statement).trim().slice(0, 200),
    String(b.hero_headline ?? current.hero_headline).trim().slice(0, 200),
    String(b.hero_subheadline ?? current.hero_subheadline).trim().slice(0, 500),
    String(b.intro_title ?? current.intro_title).trim().slice(0, 200),
    String(b.intro_body ?? current.intro_body).trim().slice(0, 2000),
    String(b.mission_text ?? current.mission_text).trim().slice(0, 500),
    String(b.vision_text ?? current.vision_text).trim().slice(0, 500),
    String(b.future_solutions_notice ?? current.future_solutions_notice).trim().slice(0, 500),
    String(b.contact_email ?? current.contact_email).trim().slice(0, 160),
    String(b.contact_phone ?? current.contact_phone).trim().slice(0, 80),
    String(b.office_address ?? current.office_address).trim().slice(0, 300),
    leadEmailCandidate,
    web3formsKeyCandidate,
    sanitizeUrl(b.social_github ?? current.social_github),
    sanitizeUrl(b.social_x ?? current.social_x),
    sanitizeUrl(b.social_linkedin ?? current.social_linkedin),
    sanitizeUrl(b.social_playstore_dev ?? current.social_playstore_dev),
    JSON.stringify(futureServices),
    String(b.analytics_measurement_id ?? current.analytics_measurement_id).trim().slice(0, 60),
    String(b.admob_publisher_note ?? current.admob_publisher_note).trim().slice(0, 1000),
    now,
  );

  res.json({settings: getSettings()});
});

app.get('/api/admin/apps', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM apps ORDER BY updated_at DESC').all() as Record<string, unknown>[];
  res.json({apps: rows.map(mapAppRow)});
});

app.post('/api/admin/apps', requireAdmin, (req, res) => {
  const b = req.body as Record<string, unknown>;
  const name = String(b.name || '').trim();
  if (name.length < 2 || name.length > 120) {
    res.status(400).json({error: 'Application name must be between 2 and 120 characters.'});
    return;
  }
  const slug = slugify(String(b.slug || name));
  if (!slug) {
    res.status(400).json({error: 'A valid URL slug is required.'});
    return;
  }

  const category = String(b.category || APP_CATEGORIES[0]).trim();
  const status = ['published', 'coming_soon', 'draft'].includes(String(b.status))
    ? String(b.status)
    : 'draft';
  const playStoreUrl = sanitizeUrl(b.play_store_url);
  if (status === 'published' && playStoreUrl && !playStoreUrl.startsWith('https://')) {
    res.status(400).json({error: 'Google Play Store link must use https://.'});
    return;
  }

  const now = new Date().toISOString();
  const screenshots = Array.isArray(b.screenshots)
    ? b.screenshots.map(sanitizeUrl).filter(Boolean).slice(0, 12)
    : [];
  const features = Array.isArray(b.features)
    ? b.features.map((f) => String(f || '').trim()).filter(Boolean).slice(0, 20)
    : [];
  const platforms = Array.isArray(b.supported_platforms)
    ? b.supported_platforms.map((p) => String(p || '').trim()).filter(Boolean).slice(0, 8)
    : ['Android'];
  const faqs = Array.isArray(b.faqs)
    ? b.faqs
        .map((f: unknown) => {
          const item = (f || {}) as Record<string, unknown>;
          return {
            question: String(item.question || '').trim(),
            answer: String(item.answer || '').trim(),
          };
        })
        .filter((f) => f.question && f.answer)
        .slice(0, 15)
    : [];

  try {
    const result = db
      .prepare(`
        INSERT INTO apps (
          slug, name, short_description, full_description, category, status, is_featured,
          icon_url, screenshots_json, features_json, supported_platforms_json, version,
          play_store_url, privacy_policy_content, faqs_json, admob_configured, analytics_configured,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        slug,
        name,
        String(b.short_description || '').trim().slice(0, 320),
        String(b.full_description || '').trim().slice(0, 6000),
        category,
        status,
        b.is_featured ? 1 : 0,
        sanitizeUrl(b.icon_url),
        JSON.stringify(screenshots),
        JSON.stringify(features),
        JSON.stringify(platforms),
        String(b.version || '1.0.0').trim().slice(0, 40),
        playStoreUrl,
        String(b.privacy_policy_content || '').trim().slice(0, 10000),
        JSON.stringify(faqs),
        b.admob_configured ? 1 : 0,
        b.analytics_configured ? 1 : 0,
        now,
        now,
      );
    const created = db.prepare('SELECT * FROM apps WHERE id = ?').get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    res.status(201).json({app: mapAppRow(created)});
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE')) {
      res.status(409).json({error: 'An application with this URL slug already exists.'});
      return;
    }
    res.status(500).json({error: 'Failed to create application.'});
  }
});

app.put('/api/admin/apps/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({error: 'Application not found.'});
    return;
  }

  const b = req.body as Record<string, unknown>;
  const name = String(b.name ?? existing.name).trim();
  const slug = slugify(String(b.slug ?? existing.slug));
  if (!name || !slug) {
    res.status(400).json({error: 'Name and valid slug are required.'});
    return;
  }

  const status = ['published', 'coming_soon', 'draft'].includes(String(b.status))
    ? String(b.status)
    : String(existing.status);
  const playStoreUrl = sanitizeUrl(b.play_store_url ?? existing.play_store_url);
  const now = new Date().toISOString();

  const screenshots = Array.isArray(b.screenshots)
    ? b.screenshots.map(sanitizeUrl).filter(Boolean).slice(0, 12)
    : JSON.parse(String(existing.screenshots_json || '[]'));
  const features = Array.isArray(b.features)
    ? b.features.map((f) => String(f || '').trim()).filter(Boolean).slice(0, 20)
    : JSON.parse(String(existing.features_json || '[]'));
  const platforms = Array.isArray(b.supported_platforms)
    ? b.supported_platforms.map((p) => String(p || '').trim()).filter(Boolean).slice(0, 8)
    : JSON.parse(String(existing.supported_platforms_json || '["Android"]'));
  const faqs = Array.isArray(b.faqs)
    ? b.faqs
        .map((f: unknown) => {
          const item = (f || {}) as Record<string, unknown>;
          return {
            question: String(item.question || '').trim(),
            answer: String(item.answer || '').trim(),
          };
        })
        .filter((f) => f.question && f.answer)
        .slice(0, 15)
    : JSON.parse(String(existing.faqs_json || '[]'));

  try {
    db.prepare(`
      UPDATE apps SET
        slug = ?, name = ?, short_description = ?, full_description = ?, category = ?,
        status = ?, is_featured = ?, icon_url = ?, screenshots_json = ?, features_json = ?,
        supported_platforms_json = ?, version = ?, play_store_url = ?, privacy_policy_content = ?,
        faqs_json = ?, admob_configured = ?, analytics_configured = ?, updated_at = ?
      WHERE id = ?
    `).run(
      slug,
      name.slice(0, 120),
      String(b.short_description ?? existing.short_description).trim().slice(0, 320),
      String(b.full_description ?? existing.full_description).trim().slice(0, 6000),
      String(b.category ?? existing.category).trim(),
      status,
      b.is_featured !== undefined ? (b.is_featured ? 1 : 0) : Number(existing.is_featured),
      b.icon_url !== undefined ? sanitizeUrl(b.icon_url) : String(existing.icon_url),
      JSON.stringify(screenshots),
      JSON.stringify(features),
      JSON.stringify(platforms),
      String(b.version ?? existing.version).trim().slice(0, 40),
      playStoreUrl,
      String(b.privacy_policy_content ?? existing.privacy_policy_content).trim().slice(0, 10000),
      JSON.stringify(faqs),
      b.admob_configured !== undefined ? (b.admob_configured ? 1 : 0) : Number(existing.admob_configured),
      b.analytics_configured !== undefined
        ? b.analytics_configured
          ? 1
          : 0
        : Number(existing.analytics_configured),
      now,
      id,
    );
    const updated = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({app: mapAppRow(updated)});
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE')) {
      res.status(409).json({error: 'Another application already uses this URL slug.'});
      return;
    }
    res.status(500).json({error: 'Failed to update application.'});
  }
});

app.delete('/api/admin/apps/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM apps WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({error: 'Application not found.'});
    return;
  }
  res.json({ok: true});
});

app.get('/api/admin/posts', requireAdmin, (_req, res) => {
  publishDueScheduledPosts();
  const rows = db.prepare('SELECT * FROM blog_posts ORDER BY updated_at DESC').all() as Record<
    string,
    unknown
  >[];
  res.json({posts: rows.map(mapPostRow)});
});

app.post('/api/admin/posts', requireAdmin, (req, res) => {
  const b = req.body as Record<string, unknown>;
  const title = String(b.title || '').trim();
  if (title.length < 3 || title.length > 180) {
    res.status(400).json({error: 'Article title must be between 3 and 180 characters.'});
    return;
  }
  const slug = slugify(String(b.slug || title));
  if (!slug) {
    res.status(400).json({error: 'Valid URL slug is required.'});
    return;
  }
  const status = ['published', 'draft', 'scheduled'].includes(String(b.status))
    ? String(b.status)
    : 'draft';
  const scheduledAt =
    status === 'scheduled' && typeof b.scheduled_at === 'string' && b.scheduled_at.trim()
      ? new Date(b.scheduled_at).toISOString()
      : null;

  const now = new Date().toISOString();
  const faqs = Array.isArray(b.faqs)
    ? b.faqs
        .map((f: unknown) => {
          const item = (f || {}) as Record<string, unknown>;
          return {
            question: String(item.question || '').trim(),
            answer: String(item.answer || '').trim(),
          };
        })
        .filter((f) => f.question && f.answer)
        .slice(0, 12)
    : [];

  try {
    const result = db
      .prepare(`
        INSERT INTO blog_posts (
          slug, title, seo_title, seo_description, excerpt, content, category,
          featured_image, author, status, scheduled_at, published_at, updated_at, is_demo, faqs_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        slug,
        title,
        String(b.seo_title || title).trim().slice(0, 160),
        String(b.seo_description || b.excerpt || '').trim().slice(0, 260),
        String(b.excerpt || '').trim().slice(0, 400),
        String(b.content || '').trim().slice(0, 30000),
        String(b.category || BLOG_CATEGORIES[0]).trim(),
        sanitizeUrl(b.featured_image),
        String(b.author || 'OKIOAI Editorial Team').trim().slice(0, 80),
        status,
        scheduledAt,
        now,
        now,
        b.is_demo ? 1 : 0,
        JSON.stringify(faqs),
      );
    const created = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(result.lastInsertRowid) as Record<
      string,
      unknown
    >;
    res.status(201).json({post: mapPostRow(created)});
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE')) {
      res.status(409).json({error: 'An article with this URL slug already exists.'});
      return;
    }
    res.status(500).json({error: 'Failed to create article.'});
  }
});

app.put('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({error: 'Article not found.'});
    return;
  }

  const b = req.body as Record<string, unknown>;
  const title = String(b.title ?? existing.title).trim();
  const slug = slugify(String(b.slug ?? existing.slug));
  if (!title || !slug) {
    res.status(400).json({error: 'Title and valid slug are required.'});
    return;
  }
  const status = ['published', 'draft', 'scheduled'].includes(String(b.status))
    ? String(b.status)
    : String(existing.status);
  const scheduledAt =
    status === 'scheduled' && typeof b.scheduled_at === 'string' && b.scheduled_at.trim()
      ? new Date(b.scheduled_at).toISOString()
      : null;

  const now = new Date().toISOString();
  const publishedAt =
    existing.status !== 'published' && status === 'published' ? now : String(existing.published_at);

  const faqs = Array.isArray(b.faqs)
    ? b.faqs
        .map((f: unknown) => {
          const item = (f || {}) as Record<string, unknown>;
          return {
            question: String(item.question || '').trim(),
            answer: String(item.answer || '').trim(),
          };
        })
        .filter((f) => f.question && f.answer)
        .slice(0, 12)
    : JSON.parse(String(existing.faqs_json || '[]'));

  try {
    db.prepare(`
      UPDATE blog_posts SET
        slug = ?, title = ?, seo_title = ?, seo_description = ?, excerpt = ?, content = ?,
        category = ?, featured_image = ?, author = ?, status = ?, scheduled_at = ?,
        published_at = ?, updated_at = ?, is_demo = ?, faqs_json = ?
      WHERE id = ?
    `).run(
      slug,
      title.slice(0, 180),
      String(b.seo_title ?? existing.seo_title).trim().slice(0, 160),
      String(b.seo_description ?? existing.seo_description).trim().slice(0, 260),
      String(b.excerpt ?? existing.excerpt).trim().slice(0, 400),
      String(b.content ?? existing.content).trim().slice(0, 30000),
      String(b.category ?? existing.category).trim(),
      b.featured_image !== undefined ? sanitizeUrl(b.featured_image) : String(existing.featured_image),
      String(b.author ?? existing.author).trim().slice(0, 80),
      status,
      scheduledAt,
      publishedAt,
      now,
      b.is_demo !== undefined ? (b.is_demo ? 1 : 0) : Number(existing.is_demo),
      JSON.stringify(faqs),
      id,
    );
    const updated = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({post: mapPostRow(updated)});
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE')) {
      res.status(409).json({error: 'Another article already uses this URL slug.'});
      return;
    }
    res.status(500).json({error: 'Failed to update article.'});
  }
});

app.delete('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({error: 'Article not found.'});
    return;
  }
  res.json({ok: true});
});

app.get('/api/admin/legal', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM legal_pages ORDER BY slug ASC').all() as Record<string, unknown>[];
  res.json({pages: rows.map(mapLegalRow)});
});

app.put('/api/admin/legal/:slug', requireAdmin, (req, res) => {
  const slug = String(req.params.slug || '').trim();
  const existing = db.prepare('SELECT * FROM legal_pages WHERE slug = ?').get(slug) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({error: 'Legal document not found.'});
    return;
  }
  const b = req.body as Record<string, unknown>;
  const now = new Date().toISOString();
  db.prepare(
    'UPDATE legal_pages SET title = ?, seo_title = ?, seo_description = ?, content = ?, updated_at = ? WHERE slug = ?',
  ).run(
    String(b.title ?? existing.title).trim().slice(0, 140),
    String(b.seo_title ?? existing.seo_title).trim().slice(0, 160),
    String(b.seo_description ?? existing.seo_description).trim().slice(0, 260),
    String(b.content ?? existing.content).trim().slice(0, 30000),
    now,
    slug,
  );
  const updated = db.prepare('SELECT * FROM legal_pages WHERE slug = ?').get(slug) as Record<
    string,
    unknown
  >;
  res.json({page: mapLegalRow(updated)});
});

app.get('/api/admin/contacts', requireAdmin, (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
    .all() as Record<string, unknown>[];
  res.json({messages: rows.map(mapContactRow)});
});

app.patch('/api/admin/contacts/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String((req.body as Record<string, unknown>)?.status || '');
  if (!['new', 'reviewed', 'archived'].includes(status)) {
    res.status(400).json({error: 'Invalid status.'});
    return;
  }
  const info = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
  if (info.changes === 0) {
    res.status(404).json({error: 'Enquiry not found.'});
    return;
  }
  res.json({ok: true});
});

app.delete('/api/admin/contacts/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({error: 'Enquiry not found.'});
    return;
  }
  res.json({ok: true});
});

// ==========================================
// SSR SEO INJECTION & STATIC/VITE SERVING
// ==========================================
function injectSeoIntoHtml(html: string, pathname: string, baseUrl: string): string {
  const seoHead = buildSsrSeoHead(pathname, baseUrl);
  const titleMatch = seoHead.match(/<meta name="okioai:ssr-title" content="([^"]*)" \/>/);
  const descMatch = seoHead.match(/<meta name="okioai:ssr-description" content="([^"]*)" \/>/);

  let out = html;
  if (titleMatch) {
    const titleVal = titleMatch[1];
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${titleVal}</title>`);
    out = out.replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${titleVal}" />`,
    );
    out = out.replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${titleVal}" />`,
    );
  }
  if (descMatch) {
    const descVal = descMatch[1];
    out = out.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${descVal}" />`,
    );
    out = out.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${descVal}" />`,
    );
    out = out.replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${descVal}" />`,
    );
  }

  const cleanedHead = seoHead
    .replace(/<meta name="okioai:ssr-title"[^>]*\/>\n?/g, '')
    .replace(/<meta name="okioai:ssr-description"[^>]*\/>\n?/g, '');

  return out.replace('<!--SSR_SEO_HEAD-->', cleanedHead);
}

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      try {
        const templatePath = path.resolve(process.cwd(), 'index.html');
        let html = fs.readFileSync(templatePath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        const baseUrl = resolveBaseUrl(req);
        html = injectSeoIntoHtml(html, req.path, baseUrl);
        res.status(200).set({'Content-Type': 'text/html'}).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, {index: false}));

    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      const indexFile = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexFile)) {
        res.status(500).send('Build output missing. Run npm run build first.');
        return;
      }
      const rawHtml = fs.readFileSync(indexFile, 'utf-8');
      const baseUrl = resolveBaseUrl(req);
      const html = injectSeoIntoHtml(rawHtml, req.path, baseUrl);
      res.status(200).set({'Content-Type': 'text/html'}).end(html);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OKIOAI Technologies server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
