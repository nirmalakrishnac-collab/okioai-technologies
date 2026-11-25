import type {Request} from 'express';
import {db, getSettings, mapAppRow, mapLegalRow, mapPostRow} from './db.ts';

export function resolveBaseUrl(req: Request): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && envUrl !== 'MY_APP_URL' && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  return `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildRobotsTxt(baseUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildSitemapXml(baseUrl: string): string {
  const nowIso = new Date().toISOString().split('T')[0];
  const staticRoutes = [
    {path: '/', priority: '1.0', changefreq: 'weekly', lastmod: nowIso},
    {path: '/about', priority: '0.8', changefreq: 'monthly', lastmod: nowIso},
    {path: '/apps', priority: '0.9', changefreq: 'weekly', lastmod: nowIso},
    {path: '/technology', priority: '0.8', changefreq: 'monthly', lastmod: nowIso},
    {path: '/future-solutions', priority: '0.7', changefreq: 'monthly', lastmod: nowIso},
    {path: '/blog', priority: '0.9', changefreq: 'weekly', lastmod: nowIso},
    {path: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: nowIso},
    {path: '/legal/privacy-policy', priority: '0.4', changefreq: 'yearly', lastmod: nowIso},
    {path: '/legal/terms-and-conditions', priority: '0.4', changefreq: 'yearly', lastmod: nowIso},
    {path: '/legal/cookie-policy', priority: '0.4', changefreq: 'yearly', lastmod: nowIso},
    {path: '/legal/disclaimer', priority: '0.4', changefreq: 'yearly', lastmod: nowIso},
  ];

  const appRows = db
    .prepare("SELECT * FROM apps WHERE status IN ('published', 'coming_soon') ORDER BY updated_at DESC")
    .all() as Record<string, unknown>[];
  const apps = appRows.map(mapAppRow);

  const postRows = db
    .prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC")
    .all() as Record<string, unknown>[];
  const posts = postRows.map(mapPostRow);

  const urls = [
    ...staticRoutes.map(
      (r) => `  <url>
    <loc>${escapeHtml(baseUrl + r.path)}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    ),
    ...apps.flatMap((app) => {
      const mod = (app.updated_at || nowIso).split('T')[0];
      return [
        `  <url>
    <loc>${escapeHtml(`${baseUrl}/apps/${app.slug}`)}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${app.status === 'published' ? '0.9' : '0.6'}</priority>
  </url>`,
        `  <url>
    <loc>${escapeHtml(`${baseUrl}/legal/app-privacy/${app.slug}`)}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`,
      ];
    }),
    ...posts.map((post) => {
      const mod = (post.updated_at || post.published_at || nowIso).split('T')[0];
      return `  <url>
    <loc>${escapeHtml(`${baseUrl}/blog/${post.slug}`)}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

export function buildSsrSeoHead(pathname: string, baseUrl: string): string {
  const settings = getSettings();
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const canonicalUrl = `${baseUrl}${cleanPath}`;
  const logoUrl = `${baseUrl}/assets/aistudio/WhatsApp_Image_2026-11-25_at_23.25.38_785cb9ed.jpeg`;

  let title = 'OKIOAI Technologies | Mobile Apps, AI & Software Innovation';
  let description =
    'Discover OKIOAI Technologies, a technology company building innovative mobile applications, AI-powered tools and digital products to simplify everyday life.';
  let ogType = 'website';
  let ogImage = logoUrl;
  const schemas: Record<string, unknown>[] = [];

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.company_name,
    url: baseUrl,
    logo: logoUrl,
    description,
    sameAs: [
      settings.social_github,
      settings.social_x,
      settings.social_linkedin,
      settings.social_playstore_dev,
    ].filter(Boolean),
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.company_name,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/apps?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  if (cleanPath === '/') {
    schemas.push(orgSchema, websiteSchema);
  } else if (cleanPath === '/about') {
    title = 'About OKIOAI Technologies | Our Mission & Vision';
    description =
      'Learn about OKIOAI Technologies, our mission to simplify everyday life through practical mobile apps, and our long-term software innovation vision.';
    schemas.push(orgSchema, {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      url: canonicalUrl,
      description,
    });
  } else if (cleanPath === '/apps') {
    title = 'Explore Useful Mobile Apps | OKIOAI Technologies';
    description =
      'Browse mobile applications, productivity utilities, and AI-powered tools created by OKIOAI Technologies for everyday life.';
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      url: canonicalUrl,
      description,
    });
  } else if (cleanPath.startsWith('/apps/')) {
    const slug = cleanPath.slice('/apps/'.length);
    const row = db
      .prepare("SELECT * FROM apps WHERE slug = ? AND status IN ('published', 'coming_soon')")
      .get(slug) as Record<string, unknown> | undefined;
    if (row) {
      const app = mapAppRow(row);
      title = `${app.name} | OKIOAI Technologies`;
      description = app.short_description;
      if (app.icon_url) ogImage = app.icon_url.startsWith('http') ? app.icon_url : `${baseUrl}${app.icon_url}`;
      const appSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'MobileApplication',
        name: app.name,
        description: app.short_description,
        applicationCategory: app.category,
        operatingSystem: app.supported_platforms.join(', ') || 'Android',
        publisher: {
          '@type': 'Organization',
          name: settings.company_name,
          url: baseUrl,
        },
        url: canonicalUrl,
      };
      if (app.status === 'published' && app.play_store_url) {
        appSchema.downloadUrl = app.play_store_url;
      }
      schemas.push(appSchema);
      if (app.faqs.length > 0) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: app.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {'@type': 'Answer', text: f.answer},
          })),
        });
      }
    }
  } else if (cleanPath === '/technology') {
    title = 'Technology & Engineering Approach | OKIOAI Technologies';
    description =
      'Discover how OKIOAI Technologies combines Android engineering, practical AI, cloud architecture, and modern web technologies.';
  } else if (cleanPath === '/future-solutions') {
    title = 'Future Software & AI Solutions | OKIOAI Technologies';
    description =
      'Explore Phase 2 expansion capabilities at OKIOAI Technologies: custom software, SaaS platforms, AI solutions, and business automation.';
  } else if (cleanPath === '/blog') {
    title = 'Technology Blog | Mobile Apps, AI & Software Insights | OKIOAI';
    description =
      'Read engineering insights, mobile application guides, AI perspectives, and productivity essays from OKIOAI Technologies.';
  } else if (cleanPath.startsWith('/blog/')) {
    const slug = cleanPath.slice('/blog/'.length);
    const row = db
      .prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'")
      .get(slug) as Record<string, unknown> | undefined;
    if (row) {
      const post = mapPostRow(row);
      title = post.seo_title || `${post.title} | OKIOAI Blog`;
      description = post.seo_description || post.excerpt;
      ogType = 'article';
      if (post.featured_image) {
        ogImage = post.featured_image.startsWith('http')
          ? post.featured_image
          : `${baseUrl}${post.featured_image}`;
      }
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description,
        image: ogImage,
        author: {'@type': 'Organization', name: post.author || settings.company_name},
        publisher: {
          '@type': 'Organization',
          name: settings.company_name,
          logo: {'@type': 'ImageObject', url: logoUrl},
        },
        datePublished: post.published_at,
        dateModified: post.updated_at,
        mainEntityOfPage: canonicalUrl,
      });
    }
  } else if (cleanPath === '/contact') {
    title = 'Contact OKIOAI Technologies | Enquiries & Partnerships';
    description =
      'Get in touch with OKIOAI Technologies regarding mobile applications, business enquiries, or strategic partnerships.';
  } else if (cleanPath.startsWith('/legal/')) {
    const slug = cleanPath.slice('/legal/'.length);
    const row = db.prepare('SELECT * FROM legal_pages WHERE slug = ?').get(slug) as
      | Record<string, unknown>
      | undefined;
    if (row) {
      const page = mapLegalRow(row);
      title = page.seo_title || `${page.title} | OKIOAI Technologies`;
      description = page.seo_description;
    }
  } else if (cleanPath === '/admin') {
    title = 'Admin CMS | OKIOAI Technologies';
    description = 'Protected content management portal for OKIOAI Technologies.';
  }

  const robotsMeta =
    cleanPath === '/admin' ? '<meta name="robots" content="noindex, nofollow" />' : '';

  const jsonLdScripts = schemas
    .map(
      (s) =>
        `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n    ');

  return `
    ${robotsMeta}
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="okioai:ssr-title" content="${escapeHtml(title)}" />
    <meta name="okioai:ssr-description" content="${escapeHtml(description)}" />
    ${jsonLdScripts}
  `.trim();
}
