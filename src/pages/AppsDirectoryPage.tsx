import React, {useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, Search} from 'lucide-react';
import type {AppItem} from '../types/cms.ts';
import {APP_CATEGORIES} from '../types/cms.ts';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs, SafeImage} from '../components/SharedUi.tsx';

export function AppsDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'coming_soon'>('all');

  useSeo({
    title: 'Explore Useful Mobile Apps | OKIOAI Technologies',
    description:
      'Browse practical mobile applications, AI utilities, PDF tools, and productivity products built by OKIOAI Technologies.',
    canonicalPath: '/apps',
  });

  useEffect(() => {
    let active = true;
    fetch('/api/public/apps')
      .then((res) => res.json())
      .then((data) => {
        if (active) setApps(Array.isArray(data.apps) ? data.apps : []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (selectedCategory !== 'All' && app.category !== selectedCategory) return false;
      if (q) {
        const hay = `${app.name} ${app.short_description} ${app.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, query, selectedCategory, statusFilter]);

  const featuredApps = useMemo(
    () => apps.filter((a) => a.is_featured && a.status === 'published'),
    [apps],
  );
  const publishedCount = useMemo(
    () => apps.filter((a) => a.status === 'published').length,
    [apps],
  );
  const comingSoonCount = useMemo(
    () => apps.filter((a) => a.status === 'coming_soon').length,
    [apps],
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({q: val});
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'Our Apps'}]} />

      <div className="pb-10 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
            Application Directory
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Practical Mobile Applications
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Our Phase 1 product roadmap aims to develop 100+ focused mobile tools for everyday tasks. Explore verified published releases and upcoming applications in active development.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400 tabular-nums shrink-0">
          <div>
            <span className="block text-lg font-semibold text-white">{publishedCount}</span>
            <span>Published</span>
          </div>
          <div className="h-8 w-px bg-white/[0.08]" aria-hidden="true" />
          <div>
            <span className="block text-lg font-semibold text-[#06B6D4]">{comingSoonCount}</span>
            <span>Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Featured Published Strip (only if published apps exist) */}
      {featuredApps.length > 0 && (
        <section className="py-10 border-b border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
            Featured Published Apps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}

      {/* Search & Interactive Filter Controls */}
      <div className="py-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search applications by name or category..."
              aria-label="Search applications"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[#0B0F17] border border-white/[0.12] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#1D6FFF]"
            />
          </div>

          <div
            role="group"
            aria-label="Filter by release status"
            className="inline-flex items-center p-1 rounded-lg bg-[#0B0F17] border border-white/[0.08] self-start"
          >
            {(
              [
                {key: 'all', label: 'All'},
                {key: 'published', label: 'Published'},
                {key: 'coming_soon', label: 'Coming Soon'},
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-[#1D6FFF] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {['All', ...APP_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-[#05070B] border-white'
                  : 'bg-[#0B0F17] text-slate-300 border-white/[0.08] hover:border-white/[0.2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-xl border border-white/[0.06] bg-[#0B0F17] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-xl border border-white/[0.08] bg-[#0B0F17] text-center space-y-3">
          <p className="text-base font-medium text-white">No matching applications found</p>
          <p className="text-sm text-slate-400">
            Try clearing your search query or selecting a different category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              handleQueryChange('');
              setSelectedCategory('All');
              setStatusFilter('all');
            }}
            className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] rounded-lg hover:bg-[#155AE0] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppCard({app}: {app: AppItem}) {
  return (
    <article className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col justify-between hover:border-white/[0.18] transition-colors">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <SafeImage
            src={app.icon_url}
            alt={`${app.name} icon`}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/[0.08]"
          />
          <div className="min-w-0">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 flex-wrap">
              <span>{app.category}</span>
              <span aria-hidden="true">&middot;</span>
              <span className={app.status === 'published' ? 'text-emerald-400' : 'text-[#06B6D4]'}>
                {app.status === 'published' ? 'Published' : 'Coming Soon'}
              </span>
            </p>
            <h3 className="text-lg font-semibold text-white leading-snug">
              <Link to={`/apps/${app.slug}`} className="hover:text-[#06B6D4] transition-colors">
                {app.name}
              </Link>
            </h3>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-5">{app.short_description}</p>
      </div>

      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
        <Link
          to={`/apps/${app.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-[#06B6D4] transition-colors"
        >
          View Application <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {app.status === 'published' && app.play_store_url ? (
          <a
            href={app.play_store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors whitespace-nowrap"
          >
            Play Store <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-500 tabular-nums">{app.version}</span>
        )}
      </div>
    </article>
  );
}
