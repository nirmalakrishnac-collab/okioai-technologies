import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {useSite} from '../context/SiteContext.tsx';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs} from '../components/SharedUi.tsx';

export function FutureSolutionsPage() {
  const {settings} = useSite();

  useSeo({
    title: 'Future Software & AI Solutions | OKIOAI Technologies',
    description:
      'Explore Phase 2 expansion capabilities at OKIOAI Technologies including custom software, SaaS platforms, AI solutions, and business automation.',
    canonicalPath: '/future-solutions',
  });

  const services = settings?.future_services || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'Future Solutions'}]} />

      <div className="max-w-3xl pb-12 border-b border-white/[0.08] space-y-4">
        <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
          Phase 2 Expansion Roadmap
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          Future Software &amp; Enterprise Solutions
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {settings?.future_solutions_notice ||
            'We are continuously expanding our technology ecosystem to create more powerful solutions for individuals and businesses.'}
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          Currently, OKIOAI Technologies is focused on Phase 1: designing and publishing practical mobile applications. The capabilities below represent our planned Phase 2 expansion and remain marked as Coming Soon until formally activated.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-14 border-b border-white/[0.08]">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="p-7 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 text-xs">
                <span className="font-mono tabular-nums text-slate-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={
                    service.status === 'available'
                      ? 'text-emerald-400 font-medium'
                      : 'text-[#06B6D4] font-medium'
                  }
                >
                  {service.status === 'available' ? 'Available Now' : 'Coming Soon'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">{service.title}</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{service.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-slate-400">
              {service.status === 'available' ? (
                <Link to="/contact" className="text-white hover:text-[#06B6D4] font-medium">
                  Enquire About Availability &rarr;
                </Link>
              ) : (
                <span>Planned Phase 2 Capability</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white">Interested in Future Collaboration?</h2>
          <p className="mt-1.5 text-sm text-slate-300">
            Share your partnership or long-term software enquiry with our team through the Contact page.
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          Contact Us <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
