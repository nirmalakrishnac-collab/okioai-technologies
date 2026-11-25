import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type {
  AppItem,
  BlogPost,
  ContactMessage,
  LegalPage,
  SiteSettings,
} from '../types/cms.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {recursive: true});
}

const DB_PATH = path.join(DATA_DIR, 'okioai.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'super_admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      alt_statement TEXT NOT NULL,
      hero_headline TEXT NOT NULL,
      hero_subheadline TEXT NOT NULL,
      intro_title TEXT NOT NULL,
      intro_body TEXT NOT NULL,
      mission_text TEXT NOT NULL,
      vision_text TEXT NOT NULL,
      future_solutions_notice TEXT NOT NULL,
      contact_email TEXT NOT NULL DEFAULT '',
      contact_phone TEXT NOT NULL DEFAULT '',
      office_address TEXT NOT NULL DEFAULT '',
      lead_forward_email TEXT NOT NULL DEFAULT 'nirmalavamsi1431@gmail.com',
      web3forms_access_key TEXT NOT NULL DEFAULT '',
      social_github TEXT NOT NULL DEFAULT '',
      social_x TEXT NOT NULL DEFAULT '',
      social_linkedin TEXT NOT NULL DEFAULT '',
      social_playstore_dev TEXT NOT NULL DEFAULT '',
      future_services_json TEXT NOT NULL,
      analytics_measurement_id TEXT NOT NULL DEFAULT '',
      admob_publisher_note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'coming_soon',
      is_featured INTEGER NOT NULL DEFAULT 0,
      icon_url TEXT NOT NULL DEFAULT '',
      screenshots_json TEXT NOT NULL DEFAULT '[]',
      features_json TEXT NOT NULL DEFAULT '[]',
      supported_platforms_json TEXT NOT NULL DEFAULT '["Android"]',
      version TEXT NOT NULL DEFAULT 'In Development',
      play_store_url TEXT NOT NULL DEFAULT '',
      privacy_policy_content TEXT NOT NULL DEFAULT '',
      faqs_json TEXT NOT NULL DEFAULT '[]',
      admob_configured INTEGER NOT NULL DEFAULT 0,
      analytics_configured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      featured_image TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'OKIOAI Editorial Team',
      status TEXT NOT NULL DEFAULT 'published',
      scheduled_at TEXT,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      faqs_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS legal_pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_type TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );
  `);

  // Safe migration if site_settings existed before lead_forward_email was added
  const cols = db.prepare('PRAGMA table_info(site_settings)').all() as {name: string}[];
  if (!cols.some((c) => c.name === 'lead_forward_email')) {
    db.exec(
      "ALTER TABLE site_settings ADD COLUMN lead_forward_email TEXT NOT NULL DEFAULT 'nirmalavamsi1431@gmail.com'",
    );
  } else {
    db.prepare(
      "UPDATE site_settings SET lead_forward_email = 'nirmalavamsi1431@gmail.com' WHERE lead_forward_email = 'nimralakrishnac@gmail.com'",
    ).run();
  }
  if (!cols.some((c) => c.name === 'web3forms_access_key')) {
    db.exec("ALTER TABLE site_settings ADD COLUMN web3forms_access_key TEXT NOT NULL DEFAULT ''");
  }

  seedDefaults();
}

function seedDefaults(): void {
  const now = new Date().toISOString();

  const existingSettings = db.prepare('SELECT id FROM site_settings WHERE id = 1').get();
  if (!existingSettings) {
    const defaultFutureServices = [
      {
        id: 'custom-software',
        title: 'Custom Software Development',
        description:
          'Bespoke desktop, cross-platform, and backend systems engineered around specific operational workflows.',
        status: 'coming_soon',
      },
      {
        id: 'saas-platforms',
        title: 'SaaS Product Development',
        description:
          'Multi-tenant cloud software products designed for recurring utility, team collaboration, and scale.',
        status: 'coming_soon',
      },
      {
        id: 'ai-solutions',
        title: 'AI Software Solutions',
        description:
          'Applied machine intelligence, document understanding, and domain-tuned automation pipelines.',
        status: 'coming_soon',
      },
      {
        id: 'business-automation',
        title: 'Business Automation',
        description:
          'Streamlined workflow orchestration connecting internal tools, data pipelines, and reporting systems.',
        status: 'coming_soon',
      },
      {
        id: 'enterprise-apps',
        title: 'Enterprise Software Solutions',
        description:
          'Resilient, security-audited internal platforms built for organizations requiring structured governance.',
        status: 'coming_soon',
      },
      {
        id: 'web-development',
        title: 'Web Application Development',
        description:
          'Fast, accessible, SEO-ready web platforms engineered with modern full-stack TypeScript architectures.',
        status: 'coming_soon',
      },
    ];

    db.prepare(`
      INSERT INTO site_settings (
        id, company_name, tagline, alt_statement, hero_headline, hero_subheadline,
        intro_title, intro_body, mission_text, vision_text, future_solutions_notice,
        contact_email, contact_phone, office_address, lead_forward_email,
        social_github, social_x, social_linkedin, social_playstore_dev,
        future_services_json, analytics_measurement_id, admob_publisher_note, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      'OKIOAI Technologies',
      'BUILD • INNOVATE • EMPOWER',
      'Technology That Simplifies Life.',
      'Building Technology for Everyday Life.',
      'We create innovative mobile applications and intelligent digital products designed to simplify everyday tasks and solve real-world problems.',
      'A Product-First Technology Company Built for Practical Scale',
      'OKIOAI Technologies is a software product company dedicated to designing, engineering, and maintaining focused digital tools. Our current strategic focus is developing a long-term ecosystem of 100+ practical mobile applications that solve everyday problems reliably—without bloat or unnecessary complexity.',
      'Making everyday life easier through practical technology and meaningful digital innovation.',
      'Building a global ecosystem of applications and software solutions that empower people and businesses.',
      'We are continuously expanding our technology ecosystem to create more powerful solutions for individuals and businesses.',
      '',
      '',
      '',
      'nirmalavamsi1431@gmail.com',
      '',
      '',
      '',
      '',
      JSON.stringify(defaultFutureServices),
      '',
      'Google AdMob monetization is configured strictly inside mobile applications with explicit consent management and app-level privacy disclosures. No mobile ad SDKs are loaded on the corporate website.',
      now,
    );
  }

  const appCount = db.prepare('SELECT COUNT(*) as count FROM apps').get() as {count: number};
  if (appCount.count === 0) {
    // Seed transparent "coming_soon" Phase 1 roadmap concepts only — zero fake published apps, ratings, downloads, or Play Store links.
    const comingSoonBlueprints = [
      {
        slug: 'smart-document-pdf-utilities',
        name: 'Document & PDF Utility Suite',
        short_description:
          'Upcoming offline-capable Android utility for scanning, merging, compressing, and organizing everyday PDF documents cleanly.',
        full_description:
          'Part of OKIOAI Technologies Phase 1 mobile roadmap. Designed for fast, distraction-free document workflows on Android devices, enabling users to scan receipts, combine pages, and export clean PDFs without cluttered interfaces.',
        category: 'PDF & Document',
        status: 'coming_soon',
        is_featured: 1,
        icon_url: '',
        screenshots: [],
        features: [
          'Fast offline PDF merging and page reordering',
          'Clean document compression for email and messaging',
          'Minimal, single-hand mobile interface',
          'Transparent privacy disclosures with local processing priority',
        ],
        supported_platforms: ['Android'],
        version: 'In Development',
        play_store_url: '',
        privacy_policy_content:
          'This application is currently in development. Before release on Google Play Store, a complete application-specific privacy policy detailing local file permissions, optional analytics, and Google AdMob consent disclosures will be published here.',
        faqs: [
          {
            question: 'When will this application be available on Google Play Store?',
            answer:
              'This application is part of our active Phase 1 development pipeline. Once internal QA and Play Store review are complete, its verified Google Play link will be published here.',
          },
          {
            question: 'Will it work offline for core document tasks?',
            answer:
              'Yes. Core document utilities are engineered to process files directly on your device whenever possible.',
          },
        ],
        admob_configured: 0,
        analytics_configured: 0,
      },
      {
        slug: 'everyday-precision-calculators',
        name: 'Everyday Calculators & Unit Converters',
        short_description:
          'Upcoming modular suite of practical financial, engineering, and daily unit conversion tools built for instant clarity.',
        full_description:
          'Engineered as a lightweight, zero-clutter Android utility collection covering currency-free mathematical conversions, percentage breakdowns, measurement units, and daily calculation workflows.',
        category: 'Calculators & Converters',
        status: 'coming_soon',
        is_featured: 1,
        icon_url: '',
        screenshots: [],
        features: [
          'Instant unit conversions across length, mass, volume, and data',
          'Precision calculation history with copy-ready output',
          'Dark-mode-first typography for high legibility',
          'Lightweight APK footprint optimized for older and newer Android devices',
        ],
        supported_platforms: ['Android'],
        version: 'In Development',
        play_store_url: '',
        privacy_policy_content:
          'This application is currently in development. Its final privacy disclosure will specify zero unnecessary device permissions and clear consent choices for any ad-supported features.',
        faqs: [
          {
            question: 'Does the calculator suite require account registration?',
            answer:
              'No. Everyday utility tools from OKIOAI are designed for immediate use without mandatory sign-ups.',
          },
        ],
        admob_configured: 0,
        analytics_configured: 0,
      },
      {
        slug: 'focused-daily-productivity-companion',
        name: 'AI-Assisted Daily Productivity Tool',
        short_description:
          'Upcoming structured task and note organizer combining clean mobile ergonomics with practical AI summarization.',
        full_description:
          'Designed to bridge daily habit tracking, quick voice-to-note capture, and intelligent daily summaries without overwhelming users with complex project management boards.',
        category: 'AI-Powered',
        status: 'coming_soon',
        is_featured: 1,
        icon_url: '',
        screenshots: [],
        features: [
          'Structured daily capture and priority checklists',
          'Practical AI-assisted note summarization',
          'Fast launch speed for on-the-go productivity',
          'User-controlled data export and privacy preferences',
        ],
        supported_platforms: ['Android'],
        version: 'In Development',
        play_store_url: '',
        privacy_policy_content:
          'This application is currently in development. Full details on how optional AI processing and local storage operate will be published prior to Google Play release.',
        faqs: [
          {
            question: 'How does OKIOAI approach AI inside mobile productivity tools?',
            answer:
              'We apply AI strictly where it saves genuine time—such as condensing long notes or structuring tasks—while keeping core controls predictable and fast.',
          },
        ],
        admob_configured: 0,
        analytics_configured: 0,
      },
    ];

    const insertApp = db.prepare(`
      INSERT INTO apps (
        slug, name, short_description, full_description, category, status, is_featured,
        icon_url, screenshots_json, features_json, supported_platforms_json, version,
        play_store_url, privacy_policy_content, faqs_json, admob_configured, analytics_configured,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const app of comingSoonBlueprints) {
      insertApp.run(
        app.slug,
        app.name,
        app.short_description,
        app.full_description,
        app.category,
        app.status,
        app.is_featured,
        app.icon_url,
        JSON.stringify(app.screenshots),
        JSON.stringify(app.features),
        JSON.stringify(app.supported_platforms),
        app.version,
        app.play_store_url,
        app.privacy_policy_content,
        JSON.stringify(app.faqs),
        app.admob_configured,
        app.analytics_configured,
        now,
        now,
      );
    }
  }

  const postCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get() as {count: number};
  if (postCount.count === 0) {
    const demoPosts = [
      {
        slug: 'designing-practical-android-utility-apps',
        title: 'Designing Practical Android Utility Apps for Everyday Reliability',
        seo_title: 'Designing Practical Android Utility Apps | OKIOAI Insights',
        seo_description:
          'Explore engineering principles for building fast, lightweight, and reliable Android utility applications that solve everyday user problems.',
        excerpt:
          'Why single-purpose clarity, offline resilience, and restrained UI design define the best everyday Android utility applications.',
        category: 'Mobile Applications',
        featured_image: '/src/assets/images/blog_mobile_ecosystem_1795629421597.jpg',
        author: 'OKIOAI Editorial Team',
        status: 'published',
        is_demo: 1,
        published_at: now,
        content: `## Why Everyday Utility Apps Matter

Most mobile software fails users not because it lacks features, but because it demands too much attention for simple tasks. When someone opens a document scanner, unit converter, or daily checklist, speed and predictability matter more than visual spectacle.

### Focusing on One Clear Problem

At OKIOAI Technologies, our product architecture starts with a narrow, real-world problem. Instead of bundling dozens of unrelated modules into a single heavy application, dedicated utilities allow faster cold-start times, clearer navigation, and lower battery overhead.

### Offline-First Architecture

Everyday reliability means tools continue working when connectivity drops. By prioritizing local storage, deterministic input validation, and lightweight Android components, utility applications remain responsive anywhere.

## Engineering for Diverse Devices

Global mobile ecosystems span flagship hardware and entry-level Android devices alike. Designing for wide compatibility requires disciplined memory usage, compact asset sizes, and clear typography that remains legible across screen sizes.

### Respecting User Attention and Privacy

Practical software earns trust through minimal permission requests and transparent disclosures. Every application should request only the system capabilities directly required for its core function.`,
        faqs: [
          {
            question: 'Why build focused utility apps instead of one giant super-app?',
            answer:
              'Focused apps launch faster, stay easier to learn, require fewer permissions, and allow continuous improvements tailored to one specific workflow.',
          },
          {
            question: 'Is this article editable in the OKIOAI Admin CMS?',
            answer:
              'Yes. This is clearly labeled sample editorial content that administrators can update, replace, or unpublish from the dashboard.',
          },
        ],
      },
      {
        slug: 'practical-ai-in-mobile-digital-products',
        title: 'Practical AI in Mobile Products: Solving Real Tasks Without Complexity',
        seo_title: 'Practical AI in Mobile Digital Products | OKIOAI Insights',
        seo_description:
          'How thoughtful AI integration enhances everyday mobile applications through summarization, organization, and workflow simplification.',
        excerpt:
          'Moving beyond hype to apply artificial intelligence where it genuinely saves time inside everyday mobile tools.',
        category: 'AI Technology',
        featured_image: '/src/assets/images/blog_ai_utility_1795629422225.jpg',
        author: 'OKIOAI Editorial Team',
        status: 'published',
        is_demo: 1,
        published_at: now,
        content: `## Beyond AI Buzzwords

Artificial intelligence is most valuable when users barely notice the underlying technology—only the time saved. In everyday mobile products, AI works best as a quiet assistant inside structured workflows rather than a separate chat box bolted onto every screen.

### Where AI Adds Genuine Everyday Value

Three areas consistently deliver tangible benefits in mobile applications:

### 1. Document and Text Structuring

Extracting key dates, action items, or clean summaries from unstructured notes turns raw input into actionable information within seconds.

### 2. Smart Categorization

Helping users organize receipts, study notes, or recurring expenses automatically reduces manual sorting friction.

### 3. Adaptive Guidance

Offering contextual explanations inside educational or business utilities makes complex calculations and workflows easier to understand.

## Balancing Capability With Privacy

Responsible AI engineering evaluates what belongs on-device versus in secure cloud APIs, keeping data minimization and clear user consent central to every product decision.`,
        faqs: [
          {
            question: 'Does every mobile app need AI features?',
            answer:
              'No. Deterministic tools like basic calculators or file splitters work best without AI overhead. AI should be introduced only when it measurably simplifies a task.',
          },
        ],
      },
      {
        slug: 'sustainable-mobile-app-ecosystem-architecture',
        title: 'Building a Scalable Architecture for 100+ Mobile Applications',
        seo_title: 'Scalable Mobile App Ecosystem Architecture | OKIOAI Insights',
        seo_description:
          'How standardized templates, modular Android engineering, and disciplined QA enable sustainable growth across a multi-app product portfolio.',
        excerpt:
          'How modular engineering, reusable design systems, and iterative user feedback support a growing portfolio of practical applications.',
        category: 'Software Development',
        featured_image: '/src/assets/images/blog_productivity_craft_1795629423657.jpg',
        author: 'OKIOAI Editorial Team',
        status: 'published',
        is_demo: 1,
        published_at: now,
        content: `## From Isolated Projects to a Product Ecosystem

Developing a single mobile app is an engineering project; building toward an ecosystem of 100+ practical applications is a systems architecture challenge. Without shared standards, maintenance quickly overwhelms feature iteration.

### Shared Core Foundations

A disciplined multi-app studio standardizes foundational layers across products:

### Design Tokens and Accessibility

Consistent spacing, high-contrast dark and light palettes, and accessible touch targets ensure users immediately feel comfortable across every OKIOAI product.

### Testing, Release, and Feedback Loops

Automated verification, staged rollouts on Google Play Store, and structured user feedback channels create a continuous improvement cycle: Research, Design, Develop, Test, Publish, and Improve.

## Looking Toward Phase 2 Software Platforms

Mastering mobile product delivery builds the operational rigor required for future SaaS platforms, automation systems, and enterprise software solutions.`,
        faqs: [],
      },
    ];

    const insertPost = db.prepare(`
      INSERT INTO blog_posts (
        slug, title, seo_title, seo_description, excerpt, content, category,
        featured_image, author, status, scheduled_at, published_at, updated_at, is_demo, faqs_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const post of demoPosts) {
      insertPost.run(
        post.slug,
        post.title,
        post.seo_title,
        post.seo_description,
        post.excerpt,
        post.content,
        post.category,
        post.featured_image,
        post.author,
        post.status,
        null,
        post.published_at,
        now,
        post.is_demo,
        JSON.stringify(post.faqs),
      );
    }
  }

  const legalCount = db.prepare('SELECT COUNT(*) as count FROM legal_pages').get() as {count: number};
  if (legalCount.count === 0) {
    const legalTemplates = [
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        seo_title: 'Privacy Policy | OKIOAI Technologies',
        seo_description:
          'Read the OKIOAI Technologies website privacy policy explaining how contact enquiries and essential technical data are handled.',
        content: `## 1. Overview

OKIOAI Technologies ("OKIOAI", "we", "our") respects your privacy and handles personal data transparently. This Privacy Policy describes what information is collected when you visit our corporate website or submit an enquiry through our Contact page.

## 2. Information We Collect

### Contact Form Submissions

When you submit the Contact form, we collect the details you voluntarily provide: your name, email address, enquiry category, subject, and message. This information is stored securely on our server solely to review and respond to your enquiry.

### Technical Server Logs

Like standard web infrastructure, our server may record basic technical request metadata (such as request timestamps and browser user-agent headers) to protect against abuse, spam, and unauthorized access.

### Mobile Applications

Individual mobile applications published by OKIOAI Technologies on Google Play Store maintain their own dedicated Application Privacy Policies, accessible from each application's detail page. Mobile advertising SDKs (such as Google AdMob) are strictly separated from this corporate website and only operate within mobile applications with appropriate disclosures and consent flows.

## 3. How We Use Information

We use submitted contact details exclusively to respond to business, partnership, or application support enquiries. We do not sell your personal information to third parties.

## 4. Data Retention and Security

Contact enquiries are stored in our protected backend database and accessible only to authorized administrators. You may request deletion of your contact enquiry at any time by reaching out via our Contact page.

## 5. Updates to This Policy

Administrators may update this policy as our services evolve. The latest revision date is displayed at the top of this page.`,
      },
      {
        slug: 'terms-and-conditions',
        title: 'Terms and Conditions',
        seo_title: 'Terms and Conditions | OKIOAI Technologies',
        seo_description:
          'Terms and conditions governing use of the OKIOAI Technologies corporate website, application directory, and published content.',
        content: `## 1. Acceptance of Terms

By accessing and using the OKIOAI Technologies website, you agree to comply with these Terms and Conditions and all applicable laws.

## 2. Intellectual Property

The OKIOAI Technologies brand name, official logo, original software architecture, design assets, and editorial content displayed on this website are the property of OKIOAI Technologies unless otherwise noted. You may not reproduce, alter, or redistribute our brand assets without prior written permission.

## 3. Product Roadmap and Availability

Descriptions of applications marked "Coming Soon" and services listed under "Future Solutions" represent our ongoing development vision and planned Phase 2 capabilities. They do not constitute a binding offer, service-level commitment, or guarantee of specific release dates.

## 4. External Links

Published mobile applications link to official third-party distribution platforms such as Google Play Store. Your download and use of mobile applications are also governed by the respective platform's terms of service and each app's specific privacy disclosure.

## 5. Limitation of Liability

This website is provided on an "as-is" and "as-available" basis. To the fullest extent permitted by law, OKIOAI Technologies disclaims warranties regarding uninterrupted availability or fitness for a particular purpose.`,
      },
      {
        slug: 'cookie-policy',
        title: 'Cookie Policy',
        seo_title: 'Cookie Policy | OKIOAI Technologies',
        seo_description:
          'Understand how OKIOAI Technologies uses essential storage and optional analytics on its corporate website.',
        content: `## 1. What Are Cookies?

Cookies and similar browser storage technologies are small data files placed on your device by websites to support core functionality and, where configured, aggregate traffic measurement.

## 2. How OKIOAI Technologies Uses Browser Storage

### Essential Operation

This corporate website is designed to operate with minimal client-side storage. Administrator authentication uses in-memory session tokens rather than persistent advertising trackers.

### Optional Analytics

If website analytics are enabled by the site administrator, only aggregate usage metrics are collected to understand page performance and improve content clarity.

### Separation From Mobile App Advertising

Google AdMob and mobile app monetization SDKs are never embedded on this corporate website.

## 3. Managing Preferences

You can configure your browser settings to block or clear cookies at any time without blocking access to informational pages on this website.`,
      },
      {
        slug: 'disclaimer',
        title: 'Disclaimer',
        seo_title: 'Disclaimer | OKIOAI Technologies',
        seo_description:
          'Legal disclaimer regarding informational content, future expansion roadmaps, and software products at OKIOAI Technologies.',
        content: `## 1. General Information

All content published on the OKIOAI Technologies website—including technology articles, app guides, and product overviews—is provided for general informational purposes only.

## 2. Forward-Looking Statements

Our stated goal of developing 100+ practical mobile applications and expanding into custom software, SaaS platforms, AI solutions, and enterprise automation reflects our company vision and strategic roadmap. Actual timelines, product scopes, and service availability may evolve based on research and engineering priorities.

## 3. No Unverified Claims

OKIOAI Technologies presents only verified published applications with active links. Items marked "Coming Soon" are currently in planning or development and are not yet publicly released.`,
      },
    ];

    const insertLegal = db.prepare(`
      INSERT INTO legal_pages (slug, title, seo_title, seo_description, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const page of legalTemplates) {
      insertLegal.run(page.slug, page.title, page.seo_title, page.seo_description, page.content, now);
    }
  }
}

export function getSettings(): SiteSettings {
  const row = db.prepare('SELECT * FROM site_settings WHERE id = 1').get() as Record<string, unknown>;
  return {
    company_name: String(row.company_name ?? 'OKIOAI Technologies'),
    tagline: String(row.tagline ?? 'BUILD • INNOVATE • EMPOWER'),
    alt_statement: String(row.alt_statement ?? 'Technology That Simplifies Life.'),
    hero_headline: String(row.hero_headline ?? ''),
    hero_subheadline: String(row.hero_subheadline ?? ''),
    intro_title: String(row.intro_title ?? ''),
    intro_body: String(row.intro_body ?? ''),
    mission_text: String(row.mission_text ?? ''),
    vision_text: String(row.vision_text ?? ''),
    future_solutions_notice: String(row.future_solutions_notice ?? ''),
    contact_email: String(row.contact_email ?? ''),
    contact_phone: String(row.contact_phone ?? ''),
    office_address: String(row.office_address ?? ''),
    lead_forward_email: String(row.lead_forward_email ?? 'nirmalavamsi1431@gmail.com'),
    web3forms_access_key: String(row.web3forms_access_key ?? ''),
    social_github: String(row.social_github ?? ''),
    social_x: String(row.social_x ?? ''),
    social_linkedin: String(row.social_linkedin ?? ''),
    social_playstore_dev: String(row.social_playstore_dev ?? ''),
    future_services: safeJsonParse(String(row.future_services_json ?? '[]'), []),
    analytics_measurement_id: String(row.analytics_measurement_id ?? ''),
    admob_publisher_note: String(row.admob_publisher_note ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export function mapAppRow(row: Record<string, unknown>): AppItem {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    short_description: String(row.short_description),
    full_description: String(row.full_description),
    category: String(row.category),
    status: (row.status as AppItem['status']) ?? 'coming_soon',
    is_featured: Boolean(row.is_featured),
    icon_url: String(row.icon_url ?? ''),
    screenshots: safeJsonParse(String(row.screenshots_json ?? '[]'), []),
    features: safeJsonParse(String(row.features_json ?? '[]'), []),
    supported_platforms: safeJsonParse(String(row.supported_platforms_json ?? '["Android"]'), ['Android']),
    version: String(row.version ?? ''),
    play_store_url: String(row.play_store_url ?? ''),
    privacy_policy_content: String(row.privacy_policy_content ?? ''),
    faqs: safeJsonParse(String(row.faqs_json ?? '[]'), []),
    admob_configured: Boolean(row.admob_configured),
    analytics_configured: Boolean(row.analytics_configured),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapPostRow(row: Record<string, unknown>): BlogPost {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    seo_title: String(row.seo_title),
    seo_description: String(row.seo_description),
    excerpt: String(row.excerpt),
    content: String(row.content),
    category: String(row.category),
    featured_image: String(row.featured_image ?? ''),
    author: String(row.author ?? 'OKIOAI Editorial Team'),
    status: (row.status as BlogPost['status']) ?? 'draft',
    scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
    published_at: String(row.published_at),
    updated_at: String(row.updated_at),
    is_demo: Boolean(row.is_demo),
    faqs: safeJsonParse(String(row.faqs_json ?? '[]'), []),
  };
}

export function mapLegalRow(row: Record<string, unknown>): LegalPage {
  return {
    slug: String(row.slug),
    title: String(row.title),
    seo_title: String(row.seo_title),
    seo_description: String(row.seo_description),
    content: String(row.content),
    updated_at: String(row.updated_at),
  };
}

export function mapContactRow(row: Record<string, unknown>): ContactMessage {
  return {
    id: Number(row.id),
    inquiry_type: (row.inquiry_type as ContactMessage['inquiry_type']) ?? 'general',
    name: String(row.name),
    email: String(row.email),
    subject: String(row.subject),
    message: String(row.message),
    status: (row.status as ContactMessage['status']) ?? 'new',
    created_at: String(row.created_at),
  };
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
