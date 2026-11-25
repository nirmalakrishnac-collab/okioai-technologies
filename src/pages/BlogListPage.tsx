import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Search} from 'lucide-react';
import type {BlogPost} from '../types/cms.ts';
import {BLOG_CATEGORIES} from '../types/cms.ts';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs, SafeImage} from '../components/SharedUi.tsx';

export function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useSeo({
    title: 'Technology Blog | Mobile Apps, AI & Software Insights | OKIOAI',
    description:
      'Read engineering perspectives, mobile application guides, AI product design insights, and technology updates from OKIOAI Technologies.',
    canonicalPath: '/blog',
  });

  useEffect(() => {
    let active = true;
    fetch('/api/public/posts')
      .then((res) => res.json())
      .then((data) => {
        if (active) setPosts(Array.isArray(data.posts) ? data.posts : []);
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
    return posts.filter((post) => {
      if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
      if (q) {
        const hay = `${post.title} ${post.excerpt} ${post.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, query, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'Blog'}]} />

      <div className="pb-10 border-b border-white/[0.08] max-w-3xl space-y-3">
        <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
          OKIOAI Editorial &amp; Engineering
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
          Technology &amp; Product Insights
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Guides, architecture notes, and research on practical mobile applications, AI software design, and everyday productivity tools.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="py-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            aria-label="Search blog articles"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[#0B0F17] border border-white/[0.12] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#1D6FFF]"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles by category">
          {['All', ...BLOG_CATEGORIES].map((cat) => (
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-xl border border-white/[0.06] bg-[#0B0F17] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-xl border border-white/[0.08] bg-[#0B0F17] text-center space-y-3">
          <p className="text-base font-medium text-white">No articles match your filter</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] rounded-lg"
          >
            Show All Articles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
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
                        <span className="text-[#06B6D4]">Sample Demo Content</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white leading-snug mb-2">
                    <Link to={`/blog/${post.slug}`} className="hover:text-[#06B6D4] transition-colors">
                      {post.title}
                    </Link>
                  </h2>
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
      )}
    </div>
  );
}
