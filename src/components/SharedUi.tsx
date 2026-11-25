import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronRight, Layers} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';

export const OFFICIAL_LOGO_URL = '/assets/okioai-logo-transparent.png';

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0F17] via-[#101622] to-[#05070B] border border-white/[0.08] text-slate-400 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Layers className="w-7 h-7 text-[#1D6FFF]/80 mb-2" strokeWidth={1.5} />
        {fallbackLabel && (
          <span className="text-xs font-medium tracking-wide text-slate-400 px-3 text-center">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({items}: {items: Crumb[]}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />}
              {isLast || !item.to ? (
                <span className="text-slate-200 font-medium" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split('\n');
  const headings: TocHeading[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      const text = line.slice(3).trim();
      headings.push({id: headingSlug(text), text, level: 2});
    } else if (line.startsWith('### ')) {
      const text = line.slice(4).trim();
      headings.push({id: headingSlug(text), text, level: 3});
    }
  }
  return headings;
}

function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function MarkdownContent({content}: {content: string}) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim().length > 0);

  return (
    <div className="space-y-5 text-[15px] sm:text-base leading-relaxed text-slate-300">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ')) {
          const text = trimmed.slice(3).trim();
          return (
            <h2
              key={idx}
              id={headingSlug(text)}
              className="text-xl sm:text-2xl font-semibold text-white pt-4 tracking-tight scroll-mt-24"
            >
              {text}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          const text = trimmed.slice(4).trim();
          return (
            <h3
              key={idx}
              id={headingSlug(text)}
              className="text-lg font-semibold text-slate-100 pt-2 tracking-tight scroll-mt-24"
            >
              {text}
            </h3>
          );
        }

        const lines = trimmed.split('\n').map((l) => l.trim());
        if (lines.every((l) => l.startsWith('- ') || l.startsWith('* '))) {
          return (
            <ul key={idx} className="space-y-2 pl-5 list-disc marker:text-[#06B6D4]">
              {lines.map((li, i) => (
                <li key={i} className="text-slate-300">
                  {li.slice(2).trim()}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-slate-300 leading-7">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function EcosystemVisual() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative w-full h-full min-h-[320px] lg:min-h-[460px] rounded-xl overflow-hidden border border-white/[0.08] bg-[#070A10]">
      <SafeImage
        src="/src/assets/images/hero_ecosystem_visual_1795629420757.jpg"
        alt="OKIOAI Technologies interconnected digital application ecosystem architecture"
        className="w-full h-full object-cover"
        priority
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070B]/85 via-[#05070B]/15 to-transparent"
        aria-hidden="true"
      />
      {!prefersReduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          animate={{rotate: 360}}
          transition={{duration: 48, repeat: Infinity, ease: 'linear'}}
        >
          <div className="w-[72%] aspect-square rounded-full border border-[#1D6FFF]/20" />
        </motion.div>
      )}
      <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <span>Phase 1 Focus · Mobile App Ecosystem</span>
        <span className="font-mono tabular-nums text-[#06B6D4]">Target: 100+ Practical Apps</span>
      </div>
    </div>
  );
}
