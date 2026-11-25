import React, {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Menu, X, ArrowUpRight} from 'lucide-react';
import {useSite} from '../context/SiteContext.tsx';
import {OFFICIAL_LOGO_URL} from './SharedUi.tsx';

const PRIMARY_NAV = [
  {label: 'Home', to: '/'},
  {label: 'About', to: '/about'},
  {label: 'Apps', to: '/apps'},
  {label: 'Technology', to: '/technology'},
  {label: 'Future', to: '/future-solutions'},
  {label: 'Blog', to: '/blog'},
];

export function Layout({children}: {children: React.ReactNode}) {
  const {settings, legalPages} = useSite();
  const {pathname} = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/';
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070B] text-[#F1F5F9]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1D6FFF] focus:text-white focus:rounded-md"
      >
        Skip to content
      </a>

      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-white/[0.08] bg-[#05070B]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Official Logo (single clean anchor, zero extra chips/subtitles) */}
          <Link
            to="/"
            className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D6FFF] rounded"
            aria-label="OKIOAI Technologies Home"
          >
            <img
              src={OFFICIAL_LOGO_URL}
              alt="OKIOAI Technologies"
              className="h-11 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* Zone 2: Concise single-line nav links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors duration-150 ${
                    active
                      ? 'text-white border-[#1D6FFF]'
                      : 'text-slate-400 border-transparent hover:text-white hover:border-white/30'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Contact
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-white/[0.1] text-slate-200 hover:bg-white/[0.05] transition-colors"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-b border-white/[0.08] bg-[#0B0F17] px-4 py-4 space-y-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.to)
                    ? 'bg-[#1D6FFF]/15 text-white'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1D6FFF] mt-2 text-center"
            >
              Contact Us
            </Link>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Quiet, International Corporate Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img
                  src={OFFICIAL_LOGO_URL}
                  alt="OKIOAI Technologies"
                  className="h-14 w-auto object-contain"
                />
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                {settings?.alt_statement || 'Technology That Simplifies Life.'} Building practical mobile applications and intelligent software products.
              </p>
              <p className="text-xs tracking-widest text-slate-500 font-medium">
                {settings?.tagline || 'BUILD • INNOVATE • EMPOWER'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/apps" className="hover:text-white transition-colors">
                    Our Apps
                  </Link>
                </li>
                <li>
                  <Link to="/technology" className="hover:text-white transition-colors">
                    Technology
                  </Link>
                </li>
                <li>
                  <Link to="/future-solutions" className="hover:text-white transition-colors">
                    Future Solutions
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-white transition-colors">
                    Blog &amp; Insights
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Trust &amp; Legal</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {legalPages.length > 0 ? (
                  legalPages.map((page) => (
                    <li key={page.slug}>
                      <Link to={`/legal/${page.slug}`} className="hover:text-white transition-colors">
                        {page.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link to="/legal/privacy-policy" className="hover:text-white transition-colors">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link to="/legal/terms-and-conditions" className="hover:text-white transition-colors">
                        Terms and Conditions
                      </Link>
                    </li>
                    <li>
                      <Link to="/legal/cookie-policy" className="hover:text-white transition-colors">
                        Cookie Policy
                      </Link>
                    </li>
                    <li>
                      <Link to="/legal/disclaimer" className="hover:text-white transition-colors">
                        Disclaimer
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Connect</h3>
              <div className="space-y-2.5 text-sm text-slate-400">
                {settings?.contact_email ? (
                  <p>
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="hover:text-white transition-colors"
                    >
                      {settings.contact_email}
                    </a>
                  </p>
                ) : null}
                {settings?.contact_phone ? <p>{settings.contact_phone}</p> : null}
                {settings?.office_address ? <p>{settings.office_address}</p> : null}
                {!settings?.contact_email && !settings?.contact_phone && !settings?.office_address && (
                  <p className="text-slate-400">
                    Reach our product and partnership team directly via our{' '}
                    <Link to="/contact" className="text-[#06B6D4] hover:underline">
                      Contact page
                    </Link>
                    .
                  </p>
                )}
                <div className="pt-2 flex flex-wrap gap-4 text-xs">
                  {settings?.social_playstore_dev && (
                    <a
                      href={settings.social_playstore_dev}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      Google Play <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {settings?.social_github && (
                    <a
                      href={settings.social_github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      GitHub <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {settings?.social_linkedin && (
                    <a
                      href={settings.social_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      LinkedIn <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {settings?.social_x && (
                    <a
                      href={settings.social_x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      X <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} {settings?.company_name || 'OKIOAI Technologies'}. All rights reserved.
            </p>
            <p>Mobile Applications &middot; AI Products &middot; Software Engineering</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
