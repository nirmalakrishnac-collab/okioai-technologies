import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import type {AppItem, BlogPost, SiteSettings} from '../types/cms.ts';

interface LegalLink {
  slug: string;
  title: string;
  updated_at: string;
}

interface SiteContextValue {
  settings: SiteSettings | null;
  publishedApps: AppItem[];
  comingSoonApps: AppItem[];
  latestPosts: BlogPost[];
  legalPages: LegalLink[];
  loading: boolean;
  refreshBootstrap: () => Promise<void>;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export function SiteProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [publishedApps, setPublishedApps] = useState<AppItem[]>([]);
  const [comingSoonApps, setComingSoonApps] = useState<AppItem[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
  const [legalPages, setLegalPages] = useState<LegalLink[]>([]);
  const [loading, setLoading] = useState(true);
  // Session token stored strictly in React memory (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) return;
      const data = await res.json();
      setSettings(data.settings ?? null);
      setPublishedApps(Array.isArray(data.publishedApps) ? data.publishedApps : []);
      setComingSoonApps(Array.isArray(data.comingSoonApps) ? data.comingSoonApps : []);
      setLatestPosts(Array.isArray(data.latestPosts) ? data.latestPosts : []);
      setLegalPages(Array.isArray(data.legalPages) ? data.legalPages : []);
    } catch {
      // Fail gracefully; page views handle null/loading cleanly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  return (
    <SiteContext.Provider
      value={{
        settings,
        publishedApps,
        comingSoonApps,
        latestPosts,
        legalPages,
        loading,
        refreshBootstrap,
        adminToken,
        setAdminToken,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}
