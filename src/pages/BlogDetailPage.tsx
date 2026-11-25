import React, {useEffect, useMemo, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, Check, Copy, Share2} from 'lucide-react';
import type {BlogPost} from '../types/cms.ts';
import {useSeo} from '../hooks/useSeo.ts';
import {
  Breadcrumbs,
  MarkdownContent,
  SafeImage,
  extractHeadings,
} from '../components/SharedUi.tsx';

export function BlogDetailPage() {
  const {slug} = useParams<{slug: string}>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public/posts/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.post) {
          setPost(data.post);
          setRelated(Array.isArray(data.related) ? data.related : []);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const headings = useMemo(() => (post ? extractHeadings(post.content) : []), [post]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const schemas: Record<string, unknown>[] = [];
  if (post) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.seo_description || post.excerpt,
      author: {'@type': 'Organization', name: post.author || 'OKIOAI Technologies'},
      publisher: {
        '@type': 'Organization',
        name: 'OKIOAI Technologies',
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/assets/aistudio/WhatsApp_Image_2026-11-25_at_23.25.38_785cb9ed.jpeg`,
        },
      },
      datePublished: post.published_at,
      dateModified: post.updated_at,
      mainEntityOfPage: `${origin}/blog/${post.slug}`,
    });

    if (post.faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {'@type': 'Answer', text: f.answer},
        })),
      });
    }
  }

  useSeo({
    title: post ? post.seo_title || `${post.title} | OKIOAI Blog` : 'Article | OKIOAI Blog',
    description: post?.seo_description || post?.excerpt || 'OKIOAI Technologies editorial article.',
    canonicalPath: `/blog/${slug || ''}`,
    ogType: 'article',
    ogImage: post?.featured_image || undefined,
    schemas,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted contexts
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-72 rounded-xl border border-white/[0.06] bg-[#0B0F17] animate-pulse" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Article Not Found</h1>
        <p className="text-slate-400">This article does not exist or is currently saved as a draft.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = encodeURIComponent(post.title);

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs
        items={[
          {label: 'Home', to: '/'},
          {label: 'Blog', to: '/blog'},
          {label: post.title},
        ]}
      />

      <header className="max-w-4xl space-y-4 pb-8 border-b border-white/[0.08]">
        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
          <span className="text-[#06B6D4] font-medium">{post.category}</span>
          <span aria-hidden="true">&middot;</span>
          <span>By {post.author}</span>
          <span aria-hidden="true">&middot;</span>
          <time dateTime={post.published_at} className="tabular-nums">
            Published{' '}
            {new Date(post.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
          <span aria-hidden="true">&middot;</span>
          <time dateTime={post.updated_at} className="tabular-nums">
            Updated{' '}
            {new Date(post.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">{post.excerpt}</p>

        {post.is_demo && (
          <p className="text-xs text-slate-400 pt-1">
            Editorial Note: This article is provided as clearly identified editable sample content and can be updated or replaced from the Admin CMS.
          </p>
        )}
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="max-w-4xl my-8 rounded-xl overflow-hidden border border-white/[0.08] aspect-[16/9] bg-[#0B0F17]">
          <SafeImage
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        {/* Main Article Body */}
        <div className="lg:col-span-8 space-y-10">
          <MarkdownContent content={post.content} />

          {/* Internal Ecosystem Links */}
          <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Explore OKIOAI Products</h2>
              <p className="text-xs text-slate-400 mt-1">
                See how these engineering principles guide our Phase 1 mobile app directory.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/apps"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors"
              >
                Explore Our Apps
              </Link>
              <Link
                to="/technology"
                className="px-4 py-2 text-xs font-semibold text-slate-200 border border-white/[0.14] hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                Our Technology
              </Link>
            </div>
          </div>

          {/* FAQ Section when eligible */}
          {post.faqs.length > 0 && (
            <section className="pt-4 space-y-4">
              <h2 className="text-2xl font-semibold text-white">Frequently Asked Questions</h2>
              {post.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-2"
                >
                  <h3 className="text-base font-semibold text-white">{faq.question}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </section>
          )}

          {/* Social Share Bar */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Share2 className="w-4 h-4" />
              <span>Share this article</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-white/[0.12] text-slate-200 hover:bg-white/[0.05]"
              >
                Share on X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-white/[0.12] text-slate-200 hover:bg-white/[0.05]"
              >
                Share on LinkedIn
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.12] text-slate-200 hover:bg-white/[0.05]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Table of Contents & Related Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {headings.length > 0 && (
            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] lg:sticky lg:top-24">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Table of Contents
              </h2>
              <nav aria-label="Article Table of Contents">
                <ul className="space-y-2.5 text-sm">
                  {headings.map((h) => (
                    <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
                      <a
                        href={`#${h.id}`}
                        className="text-slate-300 hover:text-[#06B6D4] transition-colors block leading-snug"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          {related.length > 0 && (
            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Related Articles
              </h2>
              <div className="space-y-4">
                {related.map((rel) => (
                  <div key={rel.id} className="pt-3 first:pt-0 border-t first:border-t-0 border-white/[0.06]">
                    <p className="text-xs text-slate-500 mb-1">{rel.category}</p>
                    <Link
                      to={`/blog/${rel.slug}`}
                      className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors leading-snug block"
                    >
                      {rel.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
