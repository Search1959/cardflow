import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ExploreCards } from './components/ExploreCards.tsx';
import { VisitingCardScanner } from './components/VisitingCardScanner.tsx';
import { PublicProfile } from './components/PublicProfile.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { LeadsManager } from './components/LeadsManager.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { CardProfile } from './types.js';

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
