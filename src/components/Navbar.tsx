import React, { useState } from 'react';
import {
  Scan,
  LayoutDashboard,
  Users,
  BarChart3,
  CreditCard,
  Plus,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  activeCardSlug?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, activeCardSlug }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Profiles Directory', icon: CreditCard },
    { id: 'scan', label: 'Scan Visiting Card', icon: Scan },
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'CRM Leads', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('explore')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  CardFlow<span className="text-blue-500">Pro</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  AI Platform
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Digital Identity & Visiting Card OCR Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {activeCardSlug && (
              <button
                onClick={() => onNavigate('profile', activeCardSlug)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 transition-all"
              >
                <span>Live Card: /card/{activeCardSlug}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onNavigate('scan')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Scan New Card</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onNavigate('scan');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold bg-blue-600 text-white"
            >
              <Plus className="w-5 h-5" />
              <span>Scan Physical Card</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
