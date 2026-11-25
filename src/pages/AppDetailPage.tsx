import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, ArrowUpRight, Check, ShieldCheck} from 'lucide-react';
import type {AppItem} from '../types/cms.ts';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs, SafeImage} from '../components/SharedUi.tsx';

export function AppDetailPage() {
  const {slug} = useParams<{slug: string}>();
  const [app, setApp] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public/apps/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.app) setApp(data.app);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const schemas: Record<string, unknown>[] = [];
  if (app) {
    const appSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: app.name,
      description: app.short_description,
      applicationCategory: app.category,
      operatingSystem: app.supported_platforms.join(', ') || 'Android',
      softwareVersion: app.version,
      url: `${origin}/apps/${app.slug}`,
      publisher: {
        '@type': 'Organization',
        name: 'OKIOAI Technologies',
        url: origin,
      },
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

  useSeo({
    title: app ? `${app.name} | OKIOAI Technologies` : 'Application | OKIOAI Technologies',
    description:
      app?.short_description ||
      'Explore mobile application details, features, screenshots, and privacy disclosures from OKIOAI Technologies.',
    canonicalPath: `/apps/${slug || ''}`,
    ogImage: app?.icon_url || undefined,
    schemas,
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-64 rounded-xl border border-white/[0.08] bg-[#0B0F17] animate-pulse" />
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Application Not Found</h1>
        <p className="text-slate-400">
          This application entry could not be located or has not been published publicly yet.
        </p>
        <Link
          to="/apps"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Our Apps
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs
        items={[
          {label: 'Home', to: '/'},
          {label: 'Our Apps', to: '/apps'},
          {label: app.name},
        ]}
      />

      {/* Application Header */}
      <header className="pb-10 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <SafeImage
            src={app.icon_url}
            alt={`${app.name} icon`}
            className="w-20 h-20 rounded-2xl object-cover border border-white/[0.1] shrink-0"
            priority
          />
          <div className="space-y-2">
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
              <span>{app.category}</span>
              <span aria-hidden="true">&middot;</span>
              <span className={app.status === 'published' ? 'text-emerald-400' : 'text-[#06B6D4]'}>
                {app.status === 'published' ? 'Published' : 'Coming Soon'}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="tabular-nums">Version: {app.version}</span>
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {app.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              {app.short_description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          {app.status === 'published' && app.play_store_url ? (
            <a
              href={app.play_store_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap"
            >
              Get on Google Play
              <ArrowUpRight className="w-4 h-4" />
            </a>
          ) : (
            <span className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold text-[#06B6D4] border border-[#06B6D4]/30 bg-[#06B6D4]/5 rounded-lg whitespace-nowrap">
              In Development · Coming Soon
            </span>
          )}
          <Link
            to={`/legal/app-privacy/${app.slug}`}
            className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Application Privacy Policy
          </Link>
        </div>
      </header>

      {/* Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-white/[0.08] text-xs">
        <div>
          <span className="block text-slate-500 mb-1">Platforms</span>
          <span className="font-medium text-white">
            {app.supported_platforms.join(', ') || 'Android'}
          </span>
        </div>
        <div>
          <span className="block text-slate-500 mb-1">Category</span>
          <span className="font-medium text-white">{app.category}</span>
        </div>
        <div>
          <span className="block text-slate-500 mb-1">Release Version</span>
          <span className="font-medium text-white tabular-nums">{app.version}</span>
        </div>
        <div>
          <span className="block text-slate-500 mb-1">Last Updated</span>
          <span className="font-medium text-white tabular-nums">
            {new Date(app.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Screenshots Gallery (if uploaded) */}
      {app.screenshots.length > 0 && (
        <section className="py-10 border-b border-white/[0.08]">
          <h2 className="text-xl font-semibold text-white mb-5">Screenshots</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {app.screenshots.map((shot, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0B0F17]"
              >
                <SafeImage
                  src={shot}
                  alt={`${app.name} screenshot ${idx + 1}`}
                  className="w-full h-72 object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Description & Key Features */}
      <section className="py-10 border-b border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-semibold text-white">Overview</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">
            {app.full_description}
          </p>
        </div>

        <div className="lg:col-span-5">
          <h2 className="text-xl font-semibold text-white mb-4">Key Features</h2>
          {app.features.length > 0 ? (
            <ul className="space-y-3">
              {app.features.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-white/[0.06] bg-[#0B0F17] text-sm text-slate-200"
                >
                  <Check className="w-4 h-4 text-[#06B6D4] mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Feature specifications will be published prior to release.</p>
          )}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      {app.faqs.length > 0 && (
        <section className="py-10 border-b border-white/[0.08]">
          <h2 className="text-xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {app.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-2"
              >
                <h3 className="text-base font-semibold text-white">{faq.question}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Privacy & Support Links */}
      <div className="pt-10 flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link
          to="/apps"
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Applications
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to={`/legal/app-privacy/${app.slug}`}
            className="text-[#06B6D4] hover:underline"
          >
            Read {app.name} Privacy Policy
          </Link>
          <Link to="/contact" className="text-slate-300 hover:text-white">
            Report Issue or Enquiry
          </Link>
        </div>
      </div>
    </div>
  );
}
