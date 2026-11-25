import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Cloud, Code2, Cpu, Globe, Smartphone, Workflow} from 'lucide-react';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs, SafeImage} from '../components/SharedUi.tsx';

const TECH_PILLARS = [
  {
    icon: Smartphone,
    title: 'Android Development',
    body: 'Native and modern Android architectures built for fast startup times, clean memory management, offline resilience, and compatibility across diverse global devices.',
  },
  {
    icon: Cpu,
    title: 'Artificial Intelligence',
    body: 'Applied intelligence focused on practical tasks—structured summarization, document parsing, and smart categorization—with strict attention to user privacy and latency.',
  },
  {
    icon: Globe,
    title: 'Web Technologies',
    body: 'Standards-compliant semantic HTML5, TypeScript, and modern server-assisted architectures designed for accessibility, Core Web Vitals, and search engine clarity.',
  },
  {
    icon: Cloud,
    title: 'Cloud Technology',
    body: 'Stateless APIs, structured databases, and scalable storage architectures engineered to support multi-app synchronization and backend reliability.',
  },
  {
    icon: Workflow,
    title: 'Automation',
    body: 'Repeatable build validation, automated release verification, and structured content workflows that let a focused team maintain a large product catalog.',
  },
  {
    icon: Code2,
    title: 'Modern Software Engineering',
    body: 'Reusable component templates, typed data contracts, parameterized database access, and disciplined security practices built into every layer.',
  },
];

export function TechnologyPage() {
  useSeo({
    title: 'Technology & Engineering Approach | OKIOAI Technologies',
    description:
      'Explore how OKIOAI Technologies combines Android development, artificial intelligence, web technologies, cloud systems, and modern software engineering.',
    canonicalPath: '/technology',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'Technology'}]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-14 border-b border-white/[0.08]">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
            Engineering Architecture
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Built for Speed, Maintainability, and Multi-App Scale
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Our engineering approach prioritizes reliable fundamentals over fragile complexity. Standardized design systems and modular templates enable us to build, test, and maintain dozens of everyday digital products cleanly.
          </p>
        </div>
        <div className="lg:col-span-6">
          <div className="rounded-xl overflow-hidden border border-white/[0.08] aspect-video bg-[#0B0F17]">
            <SafeImage
              src="/src/assets/images/tech_architecture_visual_1795629421690.jpg"
              alt="OKIOAI Technologies modular cloud and AI software architecture"
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-14 border-b border-white/[0.08]">
        {TECH_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col justify-between"
            >
              <div>
                <Icon className="w-5 h-5 text-[#1D6FFF] mb-4" strokeWidth={1.6} />
                <h2 className="text-lg font-semibold text-white mb-2">{pillar.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{pillar.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white">See Our Engineering in Action</h2>
          <p className="mt-1.5 text-sm text-slate-300">
            Explore our Phase 1 mobile application directory or read technical essays on the OKIOAI blog.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap"
          >
            Our Apps <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-200 border border-white/[0.14] hover:bg-white/[0.05] rounded-lg transition-colors whitespace-nowrap"
          >
            Read Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
