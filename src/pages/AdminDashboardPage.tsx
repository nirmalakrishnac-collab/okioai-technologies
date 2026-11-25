import React, {useCallback, useEffect, useState} from 'react';
import {
  FileText,
  Inbox,
  LogOut,
  Plus,
  Scale,
  Settings,
  Shield,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import {useSite} from '../context/SiteContext.tsx';
import {useSeo} from '../hooks/useSeo.ts';
import type {
  AppItem,
  BlogPost,
  ContactMessage,
  LegalPage,
  SiteSettings,
} from '../types/cms.ts';
import {APP_CATEGORIES, BLOG_CATEGORIES} from '../types/cms.ts';

type AdminTab = 'apps' | 'blog' | 'website' | 'legal' | 'contacts';

export function AdminDashboardPage() {
  const {adminToken, setAdminToken, refreshBootstrap} = useSite();

  useSeo({
    title: 'Admin CMS | OKIOAI Technologies',
    description: 'Protected OKIOAI Technologies content management dashboard.',
    canonicalPath: '/admin',
    noIndex: true,
  });

  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    needsSetup: boolean;
    usingEnvPasscode: boolean;
  }>({loading: true, needsSetup: false, usingEnvPasscode: false});
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('apps');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settingsForm, setSettingsForm] = useState<SiteSettings | null>(null);
  const [legalDocs, setLegalDocs] = useState<LegalPage[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const authFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      if (adminToken) headers.set('Authorization', `Bearer ${adminToken}`);
      const res = await fetch(url, {...init, headers});
      if (res.status === 401) {
        setAdminToken(null);
      }
      return res;
    },
    [adminToken, setAdminToken],
  );

  const loadAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/status');
      const data = await res.json();
      setAuthStatus({
        loading: false,
        needsSetup: Boolean(data.needsSetup),
        usingEnvPasscode: Boolean(data.usingEnvPasscode),
      });
    } catch {
      setAuthStatus({loading: false, needsSetup: false, usingEnvPasscode: false});
    }
  }, []);

  const loadAllAdminData = useCallback(async () => {
    if (!adminToken) return;
    const [appsRes, postsRes, settingsRes, legalRes, contactsRes] = await Promise.all([
      authFetch('/api/admin/apps'),
      authFetch('/api/admin/posts'),
      authFetch('/api/admin/settings'),
      authFetch('/api/admin/legal'),
      authFetch('/api/admin/contacts'),
    ]);
    if (appsRes.ok) setApps((await appsRes.json()).apps || []);
    if (postsRes.ok) setPosts((await postsRes.json()).posts || []);
    if (settingsRes.ok) setSettingsForm((await settingsRes.json()).settings || null);
    if (legalRes.ok) setLegalDocs((await legalRes.json()).pages || []);
    if (contactsRes.ok) setContacts((await contactsRes.json()).messages || []);
  }, [adminToken, authFetch]);

  useEffect(() => {
    loadAuthStatus();
  }, [loadAuthStatus]);

  useEffect(() => {
    if (adminToken) {
      loadAllAdminData();
    }
  }, [adminToken, loadAllAdminData]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authStatus.needsSetup) {
      if (passwordInput.length < 8) {
        setAuthError('Choose a password with at least 8 characters.');
        return;
      }
      if (passwordInput !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    setAuthSubmitting(true);
    try {
      const endpoint = authStatus.needsSetup
        ? '/api/admin/auth/setup'
        : '/api/admin/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: passwordInput}),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      setAdminToken(data.token);
      setPasswordInput('');
      setConfirmPassword('');
      await loadAuthStatus();
    } catch {
      setAuthError('Network error during authentication.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Image upload failed.');
      return null;
    }
    return data.url as string;
  };

  if (authStatus.loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-sm text-slate-400">
        Checking administrator security status...
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="p-8 rounded-xl border border-white/[0.1] bg-[#0B0F17] space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#1D6FFF]" />
            <div>
              <h1 className="text-xl font-bold text-white">
                {authStatus.needsSetup ? 'Initialize Admin Account' : 'Admin Portal Sign-In'}
              </h1>
              <p className="text-xs text-slate-400">
                {authStatus.needsSetup
                  ? 'First-run setup: set your administrator password to lock CMS access.'
                  : 'Enter your administrator password to manage applications, blog, and site content.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                {authStatus.needsSetup ? 'Create Admin Password (min 8 chars)' : 'Administrator Password'}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white focus:outline-none focus:border-[#1D6FFF]"
              />
            </div>

            {authStatus.needsSetup && (
              <div>
                <label htmlFor="admin-confirm" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="admin-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white focus:outline-none focus:border-[#1D6FFF]"
                />
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] disabled:opacity-60 rounded-lg transition-colors"
            >
              {authSubmitting
                ? 'Verifying...'
                : authStatus.needsSetup
                  ? 'Claim Admin Access'
                  : 'Sign In to CMS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top CMS Bar */}
      <div className="pb-6 mb-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#06B6D4] font-medium">Protected Content Management</p>
          <h1 className="text-2xl font-bold text-white">OKIOAI CMS Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {notice && (
            <span className="text-xs text-emerald-400 font-medium">{notice}</span>
          )}
          <button
            type="button"
            onClick={() => setAdminToken(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 border border-white/[0.12] hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3">
          <nav className="space-y-1 p-2 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
            {(
              [
                {key: 'apps', label: 'Applications', icon: Smartphone, count: apps.length},
                {key: 'blog', label: 'Blog Articles', icon: FileText, count: posts.length},
                {key: 'website', label: 'Website & Future', icon: Settings},
                {key: 'legal', label: 'Legal Policies', icon: Scale},
                {
                  key: 'contacts',
                  label: 'Enquiries',
                  icon: Inbox,
                  count: contacts.filter((c) => c.status === 'new').length,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-[#1D6FFF] text-white'
                      : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                  {'count' in tab && tab.count !== undefined && (
                    <span className="text-xs tabular-nums opacity-80">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <div className="lg:col-span-9">
          {activeTab === 'apps' && (
            <AppsManager
              apps={apps}
              authFetch={authFetch}
              uploadImageFile={uploadImageFile}
              onSaved={async (msg) => {
                await loadAllAdminData();
                await refreshBootstrap();
                showToast(msg);
              }}
            />
          )}

          {activeTab === 'blog' && (
            <BlogManager
              posts={posts}
              authFetch={authFetch}
              uploadImageFile={uploadImageFile}
              onSaved={async (msg) => {
                await loadAllAdminData();
                await refreshBootstrap();
                showToast(msg);
              }}
            />
          )}

          {activeTab === 'website' && settingsForm && (
            <WebsiteSettingsManager
              initial={settingsForm}
              authFetch={authFetch}
              onSaved={async (msg) => {
                await loadAllAdminData();
                await refreshBootstrap();
                showToast(msg);
              }}
            />
          )}

          {activeTab === 'legal' && (
            <LegalManager
              pages={legalDocs}
              authFetch={authFetch}
              onSaved={async (msg) => {
                await loadAllAdminData();
                await refreshBootstrap();
                showToast(msg);
              }}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsManager
              messages={contacts}
              authFetch={authFetch}
              onUpdated={async (msg) => {
                await loadAllAdminData();
                showToast(msg);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. APPLICATIONS MANAGER
// ==========================================
function AppsManager({
  apps,
  authFetch,
  uploadImageFile,
  onSaved,
}: {
  apps: AppItem[];
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  uploadImageFile: (file: File) => Promise<string | null>;
  onSaved: (msg: string) => Promise<void>;
}) {
  const emptyDraft = {
    id: 0,
    name: '',
    slug: '',
    short_description: '',
    full_description: '',
    category: APP_CATEGORIES[0] as string,
    status: 'coming_soon' as AppItem['status'],
    is_featured: false,
    icon_url: '',
    screenshots: [] as string[],
    featuresText: '',
    platformsText: 'Android',
    version: '1.0.0',
    play_store_url: '',
    privacy_policy_content: '',
    faqsText: '',
    admob_configured: false,
    analytics_configured: false,
  };

  const [editing, setEditing] = useState<typeof emptyDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (app: AppItem) => {
    setError(null);
    setEditing({
      id: app.id,
      name: app.name,
      slug: app.slug,
      short_description: app.short_description,
      full_description: app.full_description,
      category: app.category,
      status: app.status,
      is_featured: app.is_featured,
      icon_url: app.icon_url,
      screenshots: app.screenshots,
      featuresText: app.features.join('\n'),
      platformsText: app.supported_platforms.join(', '),
      version: app.version,
      play_store_url: app.play_store_url,
      privacy_policy_content: app.privacy_policy_content,
      faqsText: app.faqs.map((f) => `${f.question} | ${f.answer}`).join('\n'),
      admob_configured: app.admob_configured,
      analytics_configured: app.analytics_configured,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    setSaving(true);

    const payload = {
      name: editing.name,
      slug: editing.slug,
      short_description: editing.short_description,
      full_description: editing.full_description,
      category: editing.category,
      status: editing.status,
      is_featured: editing.is_featured,
      icon_url: editing.icon_url,
      screenshots: editing.screenshots,
      features: editing.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      supported_platforms: editing.platformsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      version: editing.version,
      play_store_url: editing.play_store_url,
      privacy_policy_content: editing.privacy_policy_content,
      faqs: editing.faqsText
        .split('\n')
        .map((line) => {
          const [q, ...rest] = line.split('|');
          return {question: (q || '').trim(), answer: rest.join('|').trim()};
        })
        .filter((f) => f.question && f.answer),
      admob_configured: editing.admob_configured,
      analytics_configured: editing.analytics_configured,
    };

    try {
      const res = await authFetch(
        editing.id ? `/api/admin/apps/${editing.id}` : '/api/admin/apps',
        {
          method: editing.id ? 'PUT' : 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save application.');
        return;
      }
      setEditing(null);
      await onSaved('Application saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await authFetch(`/api/admin/apps/${id}`, {method: 'DELETE'});
    if (res.ok) await onSaved('Application deleted.');
  };

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="text-lg font-semibold text-white">
            {editing.id ? 'Edit Application' : 'Add New Application'}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Application Name"
            value={editing.name}
            onChange={(v) => setEditing({...editing, name: v})}
            required
          />
          <Field
            label="URL Slug (leave blank to auto-generate)"
            value={editing.slug}
            onChange={(v) => setEditing({...editing, slug: v})}
          />
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={editing.category}
              onChange={(e) => setEditing({...editing, category: e.target.value})}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white"
            >
              {APP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Release Status</label>
            <select
              value={editing.status}
              onChange={(e) =>
                setEditing({...editing, status: e.target.value as AppItem['status']})
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white"
            >
              <option value="published">Published (Live)</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>
          <Field
            label="Version"
            value={editing.version}
            onChange={(v) => setEditing({...editing, version: v})}
          />
          <Field
            label="Supported Platforms (comma-separated)"
            value={editing.platformsText}
            onChange={(v) => setEditing({...editing, platformsText: v})}
          />
        </div>

        <Field
          label="Google Play Store Link (https://play.google.com/...)"
          value={editing.play_store_url}
          onChange={(v) => setEditing({...editing, play_store_url: v})}
        />

        {/* Icon Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">App Icon</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={editing.icon_url}
              onChange={(e) => setEditing({...editing, icon_url: e.target.value})}
              placeholder="/uploads/... or https://..."
              className="flex-1 min-w-[220px] px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white"
            />
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#101622] border border-white/[0.14] rounded-lg cursor-pointer hover:bg-white/[0.06]">
              <Upload className="w-3.5 h-3.5" /> Upload Icon
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImageFile(file);
                  if (url) setEditing({...editing, icon_url: url});
                }}
              />
            </label>
          </div>
        </div>

        {/* Screenshots Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Screenshots ({editing.screenshots.length})
            </label>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#101622] border border-white/[0.14] rounded-lg cursor-pointer hover:bg-white/[0.06]">
              <Upload className="w-3.5 h-3.5" /> Add Screenshot
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImageFile(file);
                  if (url) setEditing({...editing, screenshots: [...editing.screenshots, url]});
                }}
              />
            </label>
          </div>
          {editing.screenshots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editing.screenshots.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#05070B] border border-white/[0.1] text-xs text-slate-300"
                >
                  <span className="truncate max-w-[160px]">{s}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        screenshots: editing.screenshots.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <TextAreaField
          label="Short Description"
          rows={2}
          value={editing.short_description}
          onChange={(v) => setEditing({...editing, short_description: v})}
        />
        <TextAreaField
          label="Full Description"
          rows={4}
          value={editing.full_description}
          onChange={(v) => setEditing({...editing, full_description: v})}
        />
        <TextAreaField
          label="Key Features (one per line)"
          rows={4}
          value={editing.featuresText}
          onChange={(v) => setEditing({...editing, featuresText: v})}
        />
        <TextAreaField
          label="App-Specific Privacy Policy (supports ## headings)"
          rows={4}
          value={editing.privacy_policy_content}
          onChange={(v) => setEditing({...editing, privacy_policy_content: v})}
        />
        <TextAreaField
          label="FAQs (one per line: Question | Answer)"
          rows={3}
          value={editing.faqsText}
          onChange={(v) => setEditing({...editing, faqsText: v})}
        />

        <div className="flex flex-wrap gap-6 text-xs text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.is_featured}
              onChange={(e) => setEditing({...editing, is_featured: e.target.checked})}
            />
            Featured on Homepage
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.admob_configured}
              onChange={(e) => setEditing({...editing, admob_configured: e.target.checked})}
            />
            In-App AdMob Consent Configured
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.analytics_configured}
              onChange={(e) => setEditing({...editing, analytics_configured: e.target.checked})}
            />
            App Analytics Configured
          </label>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="px-4 py-2 text-xs font-medium text-slate-300 border border-white/[0.12] rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg"
          >
            {saving ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Applications ({apps.length})</h2>
        <button
          type="button"
          onClick={() => setEditing(emptyDraft)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#0B0F17] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.08] text-xs text-slate-400">
            <tr>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {apps.map((app) => (
              <tr key={app.id} className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-medium text-white">{app.name}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{app.category}</td>
                <td className="py-3 px-4 text-xs">
                  <span
                    className={
                      app.status === 'published'
                        ? 'text-emerald-400'
                        : app.status === 'coming_soon'
                          ? 'text-[#06B6D4]'
                          : 'text-slate-400'
                    }
                  >
                    {app.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-3 text-xs">
                  <button
                    type="button"
                    onClick={() => openEdit(app)}
                    className="text-[#06B6D4] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(app.id)}
                    className="text-red-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 2. BLOG MANAGER
// ==========================================
function BlogManager({
  posts,
  authFetch,
  uploadImageFile,
  onSaved,
}: {
  posts: BlogPost[];
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  uploadImageFile: (file: File) => Promise<string | null>;
  onSaved: (msg: string) => Promise<void>;
}) {
  const emptyPost = {
    id: 0,
    title: '',
    slug: '',
    seo_title: '',
    seo_description: '',
    excerpt: '',
    content: '',
    category: BLOG_CATEGORIES[0] as string,
    featured_image: '',
    author: 'OKIOAI Editorial Team',
    status: 'draft' as BlogPost['status'],
    scheduled_at: '',
    is_demo: false,
    faqsText: '',
  };

  const [editing, setEditing] = useState<typeof emptyPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (p: BlogPost) => {
    setError(null);
    setEditing({
      id: p.id,
      title: p.title,
      slug: p.slug,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      featured_image: p.featured_image,
      author: p.author,
      status: p.status,
      scheduled_at: p.scheduled_at ? p.scheduled_at.slice(0, 16) : '',
      is_demo: p.is_demo,
      faqsText: p.faqs.map((f) => `${f.question} | ${f.answer}`).join('\n'),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    setSaving(true);

    const payload = {
      title: editing.title,
      slug: editing.slug,
      seo_title: editing.seo_title,
      seo_description: editing.seo_description,
      excerpt: editing.excerpt,
      content: editing.content,
      category: editing.category,
      featured_image: editing.featured_image,
      author: editing.author,
      status: editing.status,
      scheduled_at:
        editing.status === 'scheduled' && editing.scheduled_at
          ? new Date(editing.scheduled_at).toISOString()
          : null,
      is_demo: editing.is_demo,
      faqs: editing.faqsText
        .split('\n')
        .map((line) => {
          const [q, ...rest] = line.split('|');
          return {question: (q || '').trim(), answer: rest.join('|').trim()};
        })
        .filter((f) => f.question && f.answer),
    };

    try {
      const res = await authFetch(
        editing.id ? `/api/admin/posts/${editing.id}` : '/api/admin/posts',
        {
          method: editing.id ? 'PUT' : 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save article.');
        return;
      }
      setEditing(null);
      await onSaved('Article saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await authFetch(`/api/admin/posts/${id}`, {method: 'DELETE'});
    if (res.ok) await onSaved('Article deleted.');
  };

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="text-lg font-semibold text-white">
            {editing.id ? 'Edit Article' : 'New Article'}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Article Title (H1)"
            value={editing.title}
            onChange={(v) => setEditing({...editing, title: v})}
            required
          />
          <Field
            label="URL Slug"
            value={editing.slug}
            onChange={(v) => setEditing({...editing, slug: v})}
          />
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={editing.category}
              onChange={(e) => setEditing({...editing, category: e.target.value})}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white"
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
            <select
              value={editing.status}
              onChange={(e) =>
                setEditing({...editing, status: e.target.value as BlogPost['status']})
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          {editing.status === 'scheduled' && (
            <Field
              label="Schedule Publish Date & Time"
              type="datetime-local"
              value={editing.scheduled_at}
              onChange={(v) => setEditing({...editing, scheduled_at: v})}
            />
          )}
          <Field
            label="Author"
            value={editing.author}
            onChange={(v) => setEditing({...editing, author: v})}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="SEO Title"
            value={editing.seo_title}
            onChange={(v) => setEditing({...editing, seo_title: v})}
          />
          <Field
            label="SEO Description"
            value={editing.seo_description}
            onChange={(v) => setEditing({...editing, seo_description: v})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Featured Image</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={editing.featured_image}
              onChange={(e) => setEditing({...editing, featured_image: e.target.value})}
              placeholder="/uploads/... or /src/assets/..."
              className="flex-1 min-w-[220px] px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white"
            />
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#101622] border border-white/[0.14] rounded-lg cursor-pointer hover:bg-white/[0.06]">
              <Upload className="w-3.5 h-3.5" /> Upload Image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImageFile(file);
                  if (url) setEditing({...editing, featured_image: url});
                }}
              />
            </label>
          </div>
        </div>

        <TextAreaField
          label="Excerpt"
          rows={2}
          value={editing.excerpt}
          onChange={(v) => setEditing({...editing, excerpt: v})}
        />
        <TextAreaField
          label="Article Body (use ## for H2 and ### for H3 — auto-generates Table of Contents)"
          rows={10}
          value={editing.content}
          onChange={(v) => setEditing({...editing, content: v})}
        />
        <TextAreaField
          label="FAQs (optional, one per line: Question | Answer)"
          rows={3}
          value={editing.faqsText}
          onChange={(v) => setEditing({...editing, faqsText: v})}
        />

        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={editing.is_demo}
            onChange={(e) => setEditing({...editing, is_demo: e.target.checked})}
          />
          Mark as Sample Demo Content
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="px-4 py-2 text-xs font-medium text-slate-300 border border-white/[0.12] rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg"
          >
            {saving ? 'Saving...' : 'Save Article'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Blog Articles ({posts.length})</h2>
        <button
          type="button"
          onClick={() => setEditing(emptyPost)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg"
        >
          <Plus className="w-4 h-4" /> Create Article
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#0B0F17] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.08] text-xs text-slate-400">
            <tr>
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-medium text-white">{post.title}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{post.category}</td>
                <td className="py-3 px-4 text-xs">
                  <span className={post.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>
                    {post.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-3 text-xs">
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="text-[#06B6D4] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 3. WEBSITE SETTINGS & FUTURE SERVICES MANAGER
// ==========================================
function WebsiteSettingsManager({
  initial,
  authFetch,
  onSaved,
}: {
  initial: SiteSettings;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onSaved: (msg: string) => Promise<void>;
}) {
  const [form, setForm] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form),
      });
      if (res.ok) await onSaved('Website settings updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-6"
    >
      <h2 className="text-lg font-semibold text-white border-b border-white/[0.08] pb-3">
        Website Content, Contact &amp; Future Services
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Company Name"
          value={form.company_name}
          onChange={(v) => setForm({...form, company_name: v})}
        />
        <Field
          label="Tagline"
          value={form.tagline}
          onChange={(v) => setForm({...form, tagline: v})}
        />
        <Field
          label="Hero Headline"
          value={form.hero_headline}
          onChange={(v) => setForm({...form, hero_headline: v})}
        />
        <Field
          label="Alternative Brand Statement"
          value={form.alt_statement}
          onChange={(v) => setForm({...form, alt_statement: v})}
        />
      </div>

      <TextAreaField
        label="Hero Subheadline"
        rows={2}
        value={form.hero_subheadline}
        onChange={(v) => setForm({...form, hero_subheadline: v})}
      />
      <Field
        label="Company Intro Title"
        value={form.intro_title}
        onChange={(v) => setForm({...form, intro_title: v})}
      />
      <TextAreaField
        label="Company Intro Body"
        rows={3}
        value={form.intro_body}
        onChange={(v) => setForm({...form, intro_body: v})}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextAreaField
          label="Mission Statement"
          rows={2}
          value={form.mission_text}
          onChange={(v) => setForm({...form, mission_text: v})}
        />
        <TextAreaField
          label="Vision Statement"
          rows={2}
          value={form.vision_text}
          onChange={(v) => setForm({...form, vision_text: v})}
        />
      </div>

      <div className="pt-4 border-t border-white/[0.08] space-y-4">
        <h3 className="text-sm font-semibold text-white">Contact &amp; Social Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Public Contact Email (shown in footer/contact page)"
            value={form.contact_email}
            onChange={(v) => setForm({...form, contact_email: v})}
          />
          <Field
            label="Lead Forwarding Email (FormSubmit.co inbox)"
            value={form.lead_forward_email || ''}
            onChange={(v) => setForm({...form, lead_forward_email: v})}
          />
          <Field
            label="Web3Forms Access Key (Instant free Gmail delivery)"
            value={form.web3forms_access_key || ''}
            onChange={(v) => setForm({...form, web3forms_access_key: v})}
            placeholder="Paste your UUID key from web3forms.com"
          />
          <Field
            label="Contact Phone"
            value={form.contact_phone}
            onChange={(v) => setForm({...form, contact_phone: v})}
          />
          <Field
            label="Office Address"
            value={form.office_address}
            onChange={(v) => setForm({...form, office_address: v})}
          />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          To receive instant lead emails via Web3Forms, create a free access key for{' '}
          <span className="text-slate-200">{form.lead_forward_email || 'nirmalavamsi1431@gmail.com'}</span>{' '}
          at{' '}
          <a
            href="https://web3forms.com/#start"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#06B6D4] underline hover:text-white"
          >
            web3forms.com
          </a>{' '}
          and paste the key above. Both Web3Forms and FormSubmit run automatically on form submission.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Google Play Developer URL"
            value={form.social_playstore_dev}
            onChange={(v) => setForm({...form, social_playstore_dev: v})}
          />
          <Field
            label="GitHub URL"
            value={form.social_github}
            onChange={(v) => setForm({...form, social_github: v})}
          />
          <Field
            label="LinkedIn URL"
            value={form.social_linkedin}
            onChange={(v) => setForm({...form, social_linkedin: v})}
          />
          <Field
            label="X (Twitter) URL"
            value={form.social_x}
            onChange={(v) => setForm({...form, social_x: v})}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.08] space-y-4">
        <h3 className="text-sm font-semibold text-white">Phase 2 Future Services</h3>
        <div className="space-y-3">
          {form.future_services.map((svc, idx) => (
            <div
              key={svc.id}
              className="p-4 rounded-lg border border-white/[0.08] bg-[#05070B] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              <input
                type="text"
                value={svc.title}
                onChange={(e) => {
                  const next = [...form.future_services];
                  next[idx] = {...svc, title: e.target.value};
                  setForm({...form, future_services: next});
                }}
                className="sm:col-span-4 px-3 py-1.5 text-sm rounded bg-[#0B0F17] border border-white/[0.1] text-white"
              />
              <input
                type="text"
                value={svc.description}
                onChange={(e) => {
                  const next = [...form.future_services];
                  next[idx] = {...svc, description: e.target.value};
                  setForm({...form, future_services: next});
                }}
                className="sm:col-span-5 px-3 py-1.5 text-xs rounded bg-[#0B0F17] border border-white/[0.1] text-slate-300"
              />
              <select
                value={svc.status}
                onChange={(e) => {
                  const next = [...form.future_services];
                  next[idx] = {
                    ...svc,
                    status: e.target.value === 'available' ? 'available' : 'coming_soon',
                  };
                  setForm({...form, future_services: next});
                }}
                className="sm:col-span-3 px-2.5 py-1.5 text-xs rounded bg-[#0B0F17] border border-white/[0.1] text-white"
              >
                <option value="coming_soon">Coming Soon</option>
                <option value="available">Available</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 4. LEGAL MANAGER
// ==========================================
function LegalManager({
  pages,
  authFetch,
  onSaved,
}: {
  pages: LegalPage[];
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onSaved: (msg: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<LegalPage | null>(pages[0] || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected && pages.length > 0) setSelected(pages[0]);
  }, [pages, selected]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/legal/${encodeURIComponent(selected.slug)}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(selected),
      });
      if (res.ok) await onSaved(`${selected.title} updated.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {pages.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSelected(p)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border ${
              selected?.slug === p.slug
                ? 'bg-[#1D6FFF] border-[#1D6FFF] text-white'
                : 'bg-[#0B0F17] border-white/[0.1] text-slate-300'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {selected && (
        <form
          onSubmit={handleSave}
          className="p-6 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-4"
        >
          <Field
            label="Document Title"
            value={selected.title}
            onChange={(v) => setSelected({...selected, title: v})}
          />
          <Field
            label="SEO Title"
            value={selected.seo_title}
            onChange={(v) => setSelected({...selected, seo_title: v})}
          />
          <Field
            label="SEO Description"
            value={selected.seo_description}
            onChange={(v) => setSelected({...selected, seo_description: v})}
          />
          <TextAreaField
            label="Policy Content (## for headings)"
            rows={12}
            value={selected.content}
            onChange={(v) => setSelected({...selected, content: v})}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg"
            >
              {saving ? 'Saving...' : 'Update Legal Document'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ==========================================
// 5. CONTACT ENQUIRIES MANAGER
// ==========================================
function ContactsManager({
  messages,
  authFetch,
  onUpdated,
}: {
  messages: ContactMessage[];
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onUpdated: (msg: string) => Promise<void>;
}) {
  const updateStatus = async (id: number, status: ContactMessage['status']) => {
    const res = await authFetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    if (res.ok) await onUpdated('Enquiry status updated.');
  };

  const deleteMessage = async (id: number) => {
    const res = await authFetch(`/api/admin/contacts/${id}`, {method: 'DELETE'});
    if (res.ok) await onUpdated('Enquiry deleted.');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Contact Enquiries ({messages.length})</h2>
      {messages.length === 0 ? (
        <div className="p-10 rounded-xl border border-white/[0.08] bg-[#0B0F17] text-center text-sm text-slate-400">
          No enquiries have been submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="p-5 rounded-xl border border-white/[0.08] bg-[#0B0F17] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{msg.subject}</p>
                  <p className="text-xs text-slate-400">
                    {msg.name} ({msg.email}) &middot; {msg.inquiry_type} &middot;{' '}
                    <span className="tabular-nums">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={msg.status}
                    onChange={(e) =>
                      updateStatus(msg.id, e.target.value as ContactMessage['status'])
                    }
                    className="px-2.5 py-1 text-xs rounded bg-[#05070B] border border-white/[0.12] text-white"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1.5 text-red-400 hover:text-red-300"
                    aria-label="Delete enquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1D6FFF]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white focus:outline-none focus:border-[#1D6FFF]"
      />
    </div>
  );
}
