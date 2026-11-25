import {useEffect} from 'react';

interface SeoOptions {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noIndex?: boolean;
  schemas?: Record<string, unknown>[];
}

export function useSeo({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  noIndex = false,
  schemas = [],
}: SeoOptions): void {
  useEffect(() => {
    document.title = title;

    const origin = window.location.origin;
    const canonicalUrl = `${origin}${canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '')}`;
    const resolvedImage = ogImage
      ? ogImage.startsWith('http')
        ? ogImage
        : `${origin}${ogImage}`
      : `${origin}/assets/aistudio/WhatsApp_Image_2026-11-25_at_23.25.38_785cb9ed.jpeg`;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', resolvedImage);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', resolvedImage);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    if (noIndex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    // Replace dynamic client JSON-LD scripts
    document.querySelectorAll('script[data-okioai-jsonld="true"]').forEach((el) => el.remove());
    for (const schema of schemas) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-okioai-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, ogType, ogImage, noIndex, JSON.stringify(schemas)]);
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
}
