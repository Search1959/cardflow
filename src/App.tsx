import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ExploreCards } from './components/ExploreCards.tsx';
import { VisitingCardScanner } from './components/VisitingCardScanner.tsx';
import { PublicProfile } from './components/PublicProfile.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { LeadsManager } from './components/LeadsManager.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { CardProfile } from './types.js';
import { updatePageSEO, generatePlatformAppJSONLD } from './lib/seo.js';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('explore');
  const [activeSlug, setActiveSlug] = useState<string>('arun-shaw');

  // Sync state with URL path
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/card/')) {
        let rawSlug = path.replace(/^\/card\//, '').trim();
        rawSlug = rawSlug.split('?')[0].replace(/\/+$/, '');
        try {
          rawSlug = decodeURIComponent(rawSlug);
        } catch (e) {}
        if (rawSlug) {
          setActiveSlug(rawSlug);
          setCurrentView('profile');
        }
      } else if (path === '/scan') {
        setCurrentView('scan');
      } else if (path === '/dashboard') {
        setCurrentView('dashboard');
      } else if (path === '/leads') {
        setCurrentView('leads');
      } else if (path === '/analytics') {
        setCurrentView('analytics');
      } else {
        setCurrentView('explore');
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update platform level SEO metadata when switching non-profile views
  useEffect(() => {
    if (currentView === 'explore') {
      updatePageSEO({
        title: 'CardFlow Pro - AI Digital Identity & Visiting Card Directory',
        description: 'Discover verified executive digital identity cards, scan physical visiting cards with AI OCR, download electronic vCards, and capture CRM leads.',
        keywords: 'digital business cards, visiting card scanner, AI OCR card reader, executive profiles, electronic vCards',
        jsonLd: generatePlatformAppJSONLD(),
      });
    } else if (currentView === 'scan') {
      updatePageSEO({
        title: 'AI Visiting Card Scanner & OCR Extraction | CardFlow Pro',
        description: 'Scan physical paper visiting cards instantly using Gemini AI OCR vision to auto-extract contact details and create custom digital identity profiles.',
        keywords: 'card scanner, AI OCR, business card reader, visiting card scanner, automated contact extraction',
      });
    } else if (currentView === 'dashboard') {
      updatePageSEO({
        title: 'Executive Profile Manager & Dashboard | CardFlow Pro',
        description: 'Manage digital identity profile cards, edit contact details, customize themes, and track engagement.',
      });
    } else if (currentView === 'leads') {
      updatePageSEO({
        title: 'CRM Lead Management & Inquiries | CardFlow Pro',
        description: 'Track and manage inbound business inquiries captured directly from digital profile cards.',
      });
    } else if (currentView === 'analytics') {
      updatePageSEO({
        title: 'Real-Time QR & Profile Analytics | CardFlow Pro',
        description: 'Monitor profile card views, QR scan counts, lead conversion rates, and engagement performance.',
      });
    }
  }, [currentView]);

  const navigateTo = (view: string, slug?: string) => {
    setCurrentView(view);
    let targetPath = '/';

    if (view === 'profile') {
      const targetSlug = slug || activeSlug || 'arun-shaw';
      setActiveSlug(targetSlug);
      targetPath = `/card/${targetSlug}`;
    } else if (view === 'scan') {
      targetPath = '/scan';
    } else if (view === 'dashboard') {
      targetPath = '/dashboard';
    } else if (view === 'leads') {
      targetPath = '/leads';
    } else if (view === 'analytics') {
      targetPath = '/analytics';
    } else {
      targetPath = '/';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleCardCreated = (newCard: CardProfile) => {
    setActiveSlug(newCard.slug);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Global Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        activeCardSlug={activeSlug}
      />

      {/* Main View Router */}
      <div className="pb-12">
        {currentView === 'explore' && (
          <ExploreCards
            onNavigateToCard={(slug) => navigateTo('profile', slug)}
            onNavigateToScan={() => navigateTo('scan')}
          />
        )}

        {currentView === 'scan' && (
          <VisitingCardScanner
            onCardCreated={handleCardCreated}
            onNavigateToCard={(slug) => navigateTo('profile', slug)}
          />
        )}

        {currentView === 'profile' && (
          <PublicProfile
            slug={activeSlug}
            onNavigateHome={() => navigateTo('explore')}
          />
        )}

        {currentView === 'dashboard' && (
          <AdminDashboard
            onNavigateToScan={() => navigateTo('scan')}
            onNavigateToCard={(slug) => navigateTo('profile', slug)}
          />
        )}

        {currentView === 'leads' && <LeadsManager />}

        {currentView === 'analytics' && <AnalyticsView />}
      </div>
    </div>
  );
}
