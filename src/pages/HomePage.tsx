import React from 'react';
import {Link} from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Layers,
  Smartphone,
  Workflow,
} from 'lucide-react';
import {useSite} from '../context/SiteContext.tsx';
import {useSeo} from '../hooks/useSeo.ts';
import {EcosystemVisual, SafeImage} from '../components/SharedUi.tsx';
import {APP_CATEGORIES} from '../types/cms.ts';

const PROCESS_STEPS = [
  {
    step: '01. Research',
    detail: 'Identify recurring everyday problems where lightweight mobile software saves meaningful time.',
  },
  {
    step: '02. Design',
    detail: 'Craft distraction-free interfaces with clear typography, accessible contrast, and fast navigation.',
  },
  {
    step: '03. Develop',
    detail: 'Engineer modular Android architectures focused on offline reliability and low device overhead.',
  },
  {
    step: '04. Test',
    detail: 'Verify edge cases, screen sizes, privacy boundaries, and performance before public release.',
  },
  {
    step: '05. Publish',
    detail: 'Distribute verified builds on Google Play Store with transparent app-level privacy disclosures.',
  },
  {
    step: '06. Improve',
    detail: 'Refine features continuously using real user feedback and structured product telemetry.',
  },
];

export function HomePage() {
  const {settings, publishedApps, comingSoonApps, latestPosts} = useSite();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  useSeo({
    title: 'OKIOAI Technologies | Mobile Apps, AI & Software Innovation',
    description:
      'Discover OKIOAI Technologies, a technology company building innovative mobile applications, AI-powered tools and digital products to simplify everyday life.',
    canonicalPath: '/',
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: settings?.company_name || 'OKIOAI Technologies',
        url: origin,
        logo: `${origin}/assets/aistudio/WhatsApp_Image_2026-11-25_at_23.25.38_785cb9ed.jpeg`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: settings?.company_name || 'OKIOAI Technologies',
        url: origin,
      },
    ],
  });

  const featuredPublished = publishedApps.slice(0, 3);
  const previewUpcoming = comingSoonApps.slice(0, 3);

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium tracking-widest text-[#06B6D4] uppercase mb-4">
                {settings?.tagline || 'BUILD • INNOVATE • EMPOWER'}
              </p>
              <h1 className="text-[clamp(2.25rem,4.1vw,3.75rem)] font-bold tracking-tight text-white leading-[1.08] max-w-xl">
                {settings?.hero_headline || 'Building Technology for Everyday Life.'}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {settings?.hero_subheadline ||
                  'We create innovative mobile applications and intelligent digital products designed to simplify everyday tasks and solve real-world problems.'}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/apps"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  Explore Our Apps
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-200 border border-white/[0.14] hover:bg-white/[0.05] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  Discover OKIOAI
                </Link>
              </div>
              <p className="mt-8 text-xs text-slate-500">
                {settings?.alt_statement || 'Technology That Simplifies Life.'} &middot; Product-First Mobile &amp; Software Studio
              </p>
            </div>

            <div className="lg:col-span-6 flex">
              <EcosystemVisual />
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPANY INTRODUCTION, MISSION & VISION */}
      <section className="border-b border-white/[0.08] bg-[#0B0F17]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
                Company Overview
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {settings?.intro_title ||
                  'A Product-First Technology Company Built for Practical Scale'}
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {settings?.intro_body ||
                  'OKIOAI Technologies is a software product company dedicated to designing, engineering, and maintaining focused digital tools. Our current strategic focus is developing a long-term ecosystem of 100+ practical mobile applications that solve everyday problems reliably—without bloat or unnecessary complexity.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1D6FFF] hover:text-[#06B6D4] transition-colors"
                >
                  Read about our long-term vision <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-white/[0.08] bg-[#05070B]">
                <p className="text-xs font-medium tracking-wider text-slate-400 uppercase mb-3">
                  Our Mission
                </p>
                <p className="text-base font-medium text-white leading-relaxed">
                  {settings?.mission_text ||
                    'Making everyday life easier through practical technology and meaningful digital innovation.'}
                </p>
              </div>
              <div className="p-6 rounded-xl border border-white/[0.08] bg-[#05070B]">
                <p className="text-xs font-medium tracking-wider text-slate-400 uppercase mb-3">
                  Our Vision
                </p>
                <p className="text-base font-medium text-white leading-relaxed">
                  {settings?.vision_text ||
                    'Building a global ecosystem of applications and software solutions that empower people and businesses.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEVELOPMENT ECOSYSTEM (ASYMMETRIC BENTO) */}
      <section className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase mb-3">
              Development Ecosystem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Focused Product Pillars Built for Everyday Utility
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Marquee Phase 1 Pillar */}
            <div className="md:col-span-2 p-7 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-xs font-medium text-[#06B6D4]">
                    Phase 1 Core Focus &middot; Active Roadmap
                  </span>
                  <Smartphone className="w-5 h-5 text-[#1D6FFF]" strokeWidth={1.6} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Mobile Apps</h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Our immediate engineering priority is building and publishing 100+ practical Android applications on Google Play Store—spanning everyday utilities, documents, calculators, education, and focused personal productivity.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs text-slate-400">
                {APP_CATEGORIES.map((cat) => (
                  <span key={cat}>{cat}</span>
                ))}
              </div>
            </div>

            <div className="p-7 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-medium text-slate-400">Applied Intelligence</span>
                <Cpu className="w-5 h-5 text-[#1D6FFF]" strokeWidth={1.6} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Products</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Thoughtful artificial intelligence integrated where it genuinely simplifies tasks—summarizing notes, organizing documents, and accelerating daily workflows without complexity.
              </p>
            </div>

            <div className="p-7 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-medium text-slate-400">Daily Clarity</span>
                <Workflow className="w-5 h-5 text-[#1D6FFF]" strokeWidth={1.6} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Productivity Tools</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Fast-launching checklists, PDF utilities, converters, and business helpers designed for one-handed mobile clarity and minimal battery footprint.
              </p>
            </div>

            <div className="md:col-span-2 p-7 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-[#1D6FFF]" strokeWidth={1.6} />
                  <span className="text-xs font-medium text-slate-400">Continuous Evolution</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Digital Innovation</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Every mobile release strengthens our shared engineering foundation—preparing OKIOAI to expand into SaaS platforms, web applications, and business automation in Phase 2.
                </p>
              </div>
              <Link
                to="/technology"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white border border-white/[0.14] hover:bg-white/[0.05] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                Explore Technology
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED APPLICATIONS (VERIFIED PUBLISHED OR COMING SOON) */}
      <section className="border-b border-white/[0.08] bg-[#0B0F17]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase mb-2">
                {featuredPublished.length > 0
                  ? 'Featured Applications'
                  : 'Phase 1 Application Pipeline'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {featuredPublished.length > 0
                  ? 'Published Mobile Applications'
                  : 'Upcoming Applications — Coming Soon'}
              </h2>
            </div>
            <Link
              to="/apps"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1D6FFF] hover:text-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
            >
              View App Directory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredPublished.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPublished.map((app) => (
                <article
                  key={app.id}
                  className="p-6 rounded-xl border border-white/[0.08] bg-[#05070B] flex flex-col justify-between hover:border-white/[0.18] transition-colors"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <SafeImage
                        src={app.icon_url}
                        alt={`${app.name} icon`}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/[0.1]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 mb-1">
                          {app.category} &middot; {app.supported_platforms.join(', ')}
                        </p>
                        <h3 className="text-lg font-semibold text-white truncate">
                          <Link to={`/apps/${app.slug}`} className="hover:text-[#06B6D4] transition-colors">
                            {app.name}
                          </Link>
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      {app.short_description}
                    </p>
                    {app.screenshots.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        {app.screenshots.slice(0, 2).map((shot, idx) => (
                          <SafeImage
                            key={idx}
                            src={shot}
                            alt={`${app.name} screenshot ${idx + 1}`}
                            className="h-28 w-full object-cover rounded-lg border border-white/[0.06]"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                    <Link
                      to={`/apps/${app.slug}`}
                      className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
                    >
                      Details &amp; Privacy
                    </Link>
                    {app.play_store_url && (
                      <a
                        href={app.play_store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Google Play
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-white/[0.08] bg-[#05070B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Verified Releases Preparing for Google Play Store
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    We publish only verified, tested applications with active Google Play links. Below are our first Phase 1 utility applications currently in development.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white border border-white/[0.14] hover:bg-white/[0.05] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Request Early Updates
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {previewUpcoming.map((app) => (
                  <article
                    key={app.id}
                    className="p-6 rounded-xl border border-white/[0.08] bg-[#05070B] flex flex-col justify-between hover:border-white/[0.18] transition-colors"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <SafeImage
                          src={app.icon_url}
                          alt={`${app.name} concept`}
                          className="w-12 h-12 rounded-xl shrink-0"
                        />
                        <div>
                          <p className="text-xs text-[#06B6D4] mb-1">
                            {app.category} &middot; Coming Soon
                          </p>
                          <h3 className="text-base font-semibold text-white">
                            <Link to={`/apps/${app.slug}`} className="hover:text-[#06B6D4] transition-colors">
                              {app.name}
                            </Link>
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {app.short_description}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                      <span>Platform: {app.supported_platforms.join(', ')}</span>
                      <Link
                        to={`/apps/${app.slug}`}
                        className="font-medium text-white hover:text-[#06B6D4] transition-colors inline-flex items-center gap-1"
                      >
                        View Blueprint <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. DEVELOPMENT PROCESS & SUSTAINABLE BUSINESS MODEL */}
      <section className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase mb-2">
              Engineering Lifecycle &amp; Business Model
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How Every OKIOAI Product Moves From Research to Everyday Use
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROCESS_STEPS.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17]/70"
              >
                <h3 className="text-base font-semibold text-white mb-2 tabular-nums">
                  {item.step}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Product-Sustained Distribution &amp; Transparent Monetization
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                OKIOAI builds and maintains standalone digital products distributed on Google Play Store. Free mobile applications are supported responsibly through Google AdMob and ethical in-app models—strictly isolated inside mobile applications and never placed on this corporate website.
              </p>
            </div>
            <Link
              to="/legal/privacy-policy"
              className="text-xs font-semibold text-[#06B6D4] hover:underline whitespace-nowrap shrink-0"
            >
              Read Privacy Standards
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FUTURE TECHNOLOGY EXPANSION */}
      <section className="border-b border-white/[0.08] bg-[#0B0F17]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
                Phase 2 Expansion Vision
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Expanding Beyond Mobile Apps Into Intelligent Software Platforms
              </h2>
              <p className="text-slate-300 leading-relaxed max-w-2xl">
                {settings?.future_solutions_notice ||
                  'We are continuously expanding our technology ecosystem to create more powerful solutions for individuals and businesses.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/future-solutions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white border border-white/[0.14] hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  Explore Future Solutions
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 text-sm">
              {(settings?.future_services || []).slice(0, 4).map((svc) => (
                <div
                  key={svc.id}
                  className="p-4 rounded-xl border border-white/[0.08] bg-[#05070B]"
                >
                  <p className="text-xs text-slate-400 mb-1">
                    {svc.status === 'available' ? 'Available' : 'Coming Soon'}
                  </p>
                  <p className="font-medium text-white">{svc.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. LATEST BLOG ARTICLES */}
      {latestPosts.length > 0 && (
        <section className="border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase mb-2">
                  Engineering &amp; Product Insights
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Latest From the OKIOAI Blog
                </h2>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1D6FFF] hover:text-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
              >
                All Articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-xl border border-white/[0.08] bg-[#0B0F17] overflow-hidden flex flex-col hover:border-white/[0.18] transition-colors"
                >
                  <Link to={`/blog/${post.slug}`} className="block aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      fallbackLabel={post.category}
                    />
                  </Link>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-2 flex flex-wrap items-center gap-2">
                        <span>{post.category}</span>
                        <span aria-hidden="true">&middot;</span>
                        <time className="tabular-nums">
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                        {post.is_demo && (
                          <>
                            <span aria-hidden="true">&middot;</span>
                            <span className="text-[#06B6D4]">Sample Editorial</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white leading-snug mb-2">
                        <Link to={`/blog/${post.slug}`} className="hover:text-[#06B6D4] transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-white/[0.06]">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-[#06B6D4] transition-colors"
                      >
                        Read Article <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. CONTACT CTA */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="p-8 sm:p-12 rounded-xl border border-white/[0.1] bg-gradient-to-br from-[#0B0F17] to-[#05070B] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Partner With OKIOAI Technologies
              </h2>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Have questions about our mobile applications, distribution partnerships, or upcoming software ecosystem? Reach our team directly.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Contact Our Team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
