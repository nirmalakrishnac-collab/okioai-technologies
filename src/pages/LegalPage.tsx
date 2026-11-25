import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import type {AppItem, LegalPage as LegalPageType} from '../types/cms.ts';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs, MarkdownContent} from '../components/SharedUi.tsx';

export function LegalPage({appSpecific = false}: {appSpecific?: boolean}) {
  const {slug} = useParams<{slug: string}>();
  const [legalDoc, setLegalDoc] = useState<LegalPageType | null>(null);
  const [appDoc, setAppDoc] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    const endpoint = appSpecific
      ? `/api/public/apps/${encodeURIComponent(slug)}`
      : `/api/public/legal/${encodeURIComponent(slug)}`;

    fetch(endpoint)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (appSpecific && data?.app) {
          setAppDoc(data.app);
          setLegalDoc(null);
        } else if (!appSpecific && data?.page) {
          setLegalDoc(data.page);
          setAppDoc(null);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, appSpecific]);

  const title = appSpecific
    ? appDoc
      ? `${appDoc.name} — Privacy Policy | OKIOAI Technologies`
      : 'Application Privacy Policy | OKIOAI Technologies'
    : legalDoc?.seo_title || 'Legal & Trust | OKIOAI Technologies';

  const description = appSpecific
    ? `Application-specific privacy policy and data disclosure for ${appDoc?.name || 'OKIOAI mobile app'}.`
    : legalDoc?.seo_description || 'Official legal policies and disclosures for OKIOAI Technologies.';

  useSeo({
    title,
    description,
    canonicalPath: appSpecific ? `/legal/app-privacy/${slug || ''}` : `/legal/${slug || ''}`,
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-64 rounded-xl border border-white/[0.06] bg-[#0B0F17] animate-pulse" />
      </div>
    );
  }

  if (notFound || (appSpecific ? !appDoc : !legalDoc)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Document Not Found</h1>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Return Home
        </Link>
      </div>
    );
  }

  const displayTitle = appSpecific && appDoc ? `${appDoc.name} — Privacy Policy` : legalDoc!.title;
  const updatedAt = appSpecific && appDoc ? appDoc.updated_at : legalDoc!.updated_at;
  const bodyContent =
    appSpecific && appDoc
      ? appDoc.privacy_policy_content ||
        `No custom privacy disclosure has been published for ${appDoc.name} yet.`
      : legalDoc!.content;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs
        items={
          appSpecific && appDoc
            ? [
                {label: 'Home', to: '/'},
                {label: 'Our Apps', to: '/apps'},
                {label: appDoc.name, to: `/apps/${appDoc.slug}`},
                {label: 'Privacy Policy'},
              ]
            : [{label: 'Home', to: '/'}, {label: displayTitle}]
        }
      />

      <header className="pb-8 border-b border-white/[0.08] space-y-2">
        <p className="text-xs text-[#06B6D4] font-medium uppercase tracking-wider">
          Legal &amp; Transparency
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-xs text-slate-400 tabular-nums">
          Last Updated:{' '}
          {new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <div className="py-10">
        <MarkdownContent content={bodyContent} />
      </div>

      <div className="pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <span>OKIOAI Technologies</span>
        <Link to="/contact" className="text-[#06B6D4] hover:underline">
          Questions about this policy? Contact us
        </Link>
      </div>
    </div>
  );
}
