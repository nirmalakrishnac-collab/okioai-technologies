import React, {useEffect} from 'react';
import {BrowserRouter, Route, Routes, useLocation} from 'react-router-dom';
import {SiteProvider} from './context/SiteContext.tsx';
import {Layout} from './components/Layout.tsx';
import {HomePage} from './pages/HomePage.tsx';
import {AboutPage} from './pages/AboutPage.tsx';
import {AppsDirectoryPage} from './pages/AppsDirectoryPage.tsx';
import {AppDetailPage} from './pages/AppDetailPage.tsx';
import {TechnologyPage} from './pages/TechnologyPage.tsx';
import {FutureSolutionsPage} from './pages/FutureSolutionsPage.tsx';
import {BlogListPage} from './pages/BlogListPage.tsx';
import {BlogDetailPage} from './pages/BlogDetailPage.tsx';
import {ContactPage} from './pages/ContactPage.tsx';
import {LegalPage} from './pages/LegalPage.tsx';
import {AdminDashboardPage} from './pages/AdminDashboardPage.tsx';
import {Link} from 'react-router-dom';

function ScrollToTop() {
  const {pathname} = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
      <p className="text-xs font-mono text-[#06B6D4]">404</p>
      <h1 className="text-3xl font-bold text-white">Page Not Found</h1>
      <p className="text-sm text-slate-400">
        The requested page could not be found on OKIOAI Technologies.
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[#1D6FFF] rounded-lg"
      >
        Return Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/apps" element={<AppsDirectoryPage />} />
            <Route path="/apps/:slug" element={<AppDetailPage />} />
            <Route path="/technology" element={<TechnologyPage />} />
            <Route path="/future-solutions" element={<FutureSolutionsPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/legal/app-privacy/:slug" element={<LegalPage appSpecific />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </SiteProvider>
    </BrowserRouter>
  );
}
