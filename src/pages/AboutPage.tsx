import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {useSite} from '../context/SiteContext.tsx';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs, OFFICIAL_LOGO_URL} from '../components/SharedUi.tsx';

const CORE_VALUES = [
  {
    title: '01. Practical Utility First',
    body: 'Every product begins with a real everyday problem. We build software people genuinely rely on rather than chasing novelty.',
  },
  {
    title: '02. Architectural Discipline',
    body: 'Consistent engineering templates, clean typography, and reliable offline-ready behavior allow our team to scale across dozens of applications.',
  },
  {
    title: '03. Honest Transparency',
    body: 'We distinguish clearly between verified published applications, active Phase 1 prototypes, and long-term Phase 2 expansion capabilities.',
  },
  {
    title: '04. User Respect & Privacy',
    body: 'Minimal permissions, clear privacy disclosures per application, and clean separation between mobile app monetization and our corporate website.',
  },
];

export function AboutPage() {
  const {settings} = useSite();

  useSeo({
    title: 'About OKIOAI Technologies | Our Mission & Vision',
    description:
      'Learn about OKIOAI Technologies, a product-focused technology company building practical mobile applications, AI tools, and future software platforms.',
    canonicalPath: '/about',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'About Us'}]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-14 border-b border-white/[0.08]">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
            Who We Are
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Building a Global Ecosystem of Practical Digital Products
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {settings?.intro_body ||
              'OKIOAI Technologies is a software product company dedicated to designing, engineering, and maintaining focused digital tools. Rather than operating as a traditional agency, we build and own our product ecosystem.'}
          </p>
        </div>

        <div className="lg:col-span-5 p-8 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col items-center text-center">
          <img
            src={OFFICIAL_LOGO_URL}
            alt="OKIOAI Technologies official emblem"
            className="h-24 sm:h-28 w-auto object-contain mb-4"
          />
          <p className="text-xs tracking-widest text-slate-400 font-medium">
            {settings?.tagline || 'BUILD • INNOVATE • EMPOWER'}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {settings?.alt_statement || 'Technology That Simplifies Life.'}
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-14 border-b border-white/[0.08]">
        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
          <h2 className="text-sm font-semibold text-[#06B6D4] uppercase tracking-wider mb-3">
            Our Mission
          </h2>
          <p className="text-xl font-semibold text-white leading-relaxed">
            {settings?.mission_text ||
              'Making everyday life easier through practical technology and meaningful digital innovation.'}
          </p>
        </div>
        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
          <h2 className="text-sm font-semibold text-[#06B6D4] uppercase tracking-wider mb-3">
            Our Vision
          </h2>
          <p className="text-xl font-semibold text-white leading-relaxed">
            {settings?.vision_text ||
              'Building a global ecosystem of applications and software solutions that empower people and businesses.'}
          </p>
        </div>
      </div>

      {/* What We Build & Long-Term Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-14 border-b border-white/[0.08]">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            What We Build — Phase 1 Mobile Ecosystem
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Our immediate operational focus is developing and publishing 100+ practical mobile applications on Google Play Store. Each application targets a specific everyday need—from PDF and document handling to precision calculators, educational aids, AI-assisted utilities, and focused productivity tools.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            This vision guides our engineering cadence and product standards; every released application goes through structured testing before being listed as published in our directory.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Long-Term Goals — Phase 2 Expansion
          </h2>
          <p className="text-slate-300 leading-relaxed">
            As our mobile application portfolio matures and generates sustainable product revenue, OKIOAI Technologies plans to expand into full-scale software engineering—delivering SaaS platforms, AI software solutions, business automation workflows, and enterprise cloud applications.
          </p>
          <Link
            to="/future-solutions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1D6FFF] hover:text-[#06B6D4] transition-colors"
          >
            View Phase 2 Roadmap <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Core Values */}
      <div className="py-14 border-b border-white/[0.08]">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-8">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_VALUES.map((val) => (
            <div key={val.title} className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
              <h3 className="text-lg font-semibold text-white mb-2">{val.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{val.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Approach CTA */}
      <div className="pt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white">Our Technology Approach</h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Learn how we combine Android engineering, modern web architectures, cloud scalability, and practical AI across our product lifecycle.
          </p>
        </div>
        <Link
          to="/technology"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          Explore Technology <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
