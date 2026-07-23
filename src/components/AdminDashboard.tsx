import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Eye,
  QrCode,
  Users,
  ShieldCheck,
  Search,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Filter,
  MessageSquare,
  Lock,
  LogOut,
  Mail,
  Key,
  EyeOff
} from 'lucide-react';
import { CardProfile } from '../types.js';
import { AvatarDisplay } from './AvatarDisplay.js';

interface AdminDashboardProps {
  onNavigateToScan: () => void;
  onNavigateToCard: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToScan,
  onNavigateToCard,
}) => {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cardflow_admin_auth') === 'true';
  });
  const [adminEmailInput, setAdminEmailInput] = useState('apex7tech@gmail.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const [cards, setCards] = useState<CardProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Slug editing modal state
  const [editingCard, setEditingCard] = useState<CardProfile | null>(null);
  const [newSlug, setNewSlug] = useState('');
  const [slugUpdating, setSlugUpdating] = useState(false);

  // Confidence Inspector modal state
  const [inspectCard, setInspectCard] = useState<CardProfile | null>(null);

  // AI Enrichment state
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedEmail = adminEmailInput.trim().toLowerCase();
    const trimmedPass = adminPasswordInput.trim();

    // Valid credentials check: apex7tech@gmail.co or apex7tech@gmail.com and password Search@1959
    const isValidEmail = trimmedEmail === 'apex7tech@gmail.co' || trimmedEmail === 'apex7tech@gmail.com' || trimmedEmail === 'apex7tech';
    const isValidPassword = trimmedPass === 'Search@1959';

    if (isValidEmail && isValidPassword) {
      sessionStorage.setItem('cardflow_admin_auth', 'true');
      sessionStorage.setItem('cardflow_admin_email', adminEmailInput.trim());
      setLoginSuccess(true);
      setTimeout(() => {
        setIsAuthenticated(true);
        setLoginSuccess(false);
      }, 500);
    } else {
      setLoginError('Invalid Login ID or Password. Please verify your credentials.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('cardflow_admin_auth');
    sessionStorage.removeItem('cardflow_admin_email');
    setIsAuthenticated(false);
    setAdminPasswordInput('');
    setLoginError('');
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      setCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDeleteCard = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile for "${name}"?`)) return;
    try {
      await fetch(`/api/cards/${id}`, { method: 'DELETE' });
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Error deleting card');
    }
  };

  const handleUpdateSlug = async () => {
    if (!editingCard || !newSlug) return;
    setSlugUpdating(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug }),
      });
      if (!res.ok) throw new Error('Failed to update slug');
      const updated = await res.json();
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCard(null);
    } catch (err: any) {
      alert(err.message || 'Slug update failed');
    } finally {
      setSlugUpdating(false);
    }
  };

  const handleAIEnrich = async (id: string) => {
    setEnrichingId(id);
    try {
      const res = await fetch(`/api/cards/${id}/enrich`, { method: 'POST' });
      if (!res.ok) throw new Error('Enrichment failed');
      const updated = await res.json();
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      alert('AI Enrichment error: ' + err.message);
    } finally {
      setEnrichingId(null);
    }
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.businessCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalViews = cards.reduce((a, b) => a + (b.viewsCount || 0), 0);
  const totalScans = cards.reduce((a, b) => a + (b.qrScansCount || 0), 0);
  const totalLeads = cards.reduce((a, b) => a + (b.leadsCount || 0), 0);

  // If not authenticated, show Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-3 mb-8 relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Admin Authentication</h2>
            <p className="text-xs text-slate-400">
              Enter your admin credentials to access the CardFlow management portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-5 relative z-10">
            {/* Login ID / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Login ID / Email</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="apex7tech@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Search@1959"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 pr-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2 text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Success Feedback */}
            {loginSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Login successful! Loading dashboard...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 text-sm transition-all transform active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login to Dashboard</span>
            </button>

            {/* Credentials Note */}
            <div className="pt-2 text-center">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="text-slate-500">Demo Login:</span>
                <span className="text-blue-400 font-bold">apex7tech@gmail.com</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-bold">Search@1959</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Digital Identity Admin Dashboard</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Verified</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage OCR visiting card profiles, custom slugs, AI enrichment, and QR analytics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center space-x-2 text-xs transition-all"
            title="Log out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={onNavigateToScan}
            className="px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 flex items-center space-x-2 text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Scan New Card</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Identities</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{cards.length}</p>
          <p className="text-[11px] text-emerald-400 font-semibold">Active Digital Profiles</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Profile Page Views</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalViews}</p>
          <p className="text-[11px] text-slate-400">Total Visits across Cards</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>QR Code Scans</span>
            <QrCode className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalScans}</p>
          <p className="text-[11px] text-slate-400">Physical Card Scans</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>CRM Leads Captured</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalLeads}</p>
          <p className="text-[11px] text-amber-400 font-semibold">Inquiries Generated</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or slug..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="IT Services & Software">IT Services & Software</option>
            <option value="Design & Branding">Design & Branding</option>
            <option value="Real Estate & Properties">Real Estate & Properties</option>
            <option value="Legal & Advisory">Legal & Advisory</option>
          </select>
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Profile Holder</th>
                <th className="p-4">SEO Slug</th>
                <th className="p-4">Category</th>
                <th className="p-4">OCR Score</th>
                <th className="p-4">Views / Leads</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading digital card profiles...
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No card profiles match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <AvatarDisplay
                          avatarUrl={c.avatarUrl}
                          logoUrl={c.logoUrl}
                          name={c.name}
                          primaryColor={c.primaryColor}
                          className="w-9 h-9 rounded-xl border border-slate-700 text-xs font-bold overflow-hidden"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.title} • {c.company}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-blue-400">
                      <div className="flex items-center space-x-1.5">
                        <span>/card/{c.slug}</span>
                        <button
                          onClick={() => {
                            setEditingCard(c);
                            setNewSlug(c.slug);
                          }}
                          className="p-1 hover:text-white text-slate-500"
                          title="Edit Custom Slug"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] font-semibold">
                        {c.businessCategory}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => setInspectCard(c)}
                        className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 text-[11px] font-bold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{c.confidenceScores?.overall || 95}%</span>
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-300 font-semibold">{c.viewsCount || 0} views</span>
                        <span className="text-slate-500 text-[10px] block">{c.leadsCount || 0} leads</span>
                      </div>
                    </td>

                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          const cleanPhone = (c.whatsapp || c.phone || '').replace(/[^0-9]/g, '');
                          const landingUrl = `${window.location.origin}/card/${c.slug}`;
                          const msg = encodeURIComponent(`Hello ${c.name}! Here is your digital card webpage:\n${landingUrl}`);
                          const waUrl = cleanPhone && cleanPhone.length >= 7
                            ? `https://wa.me/${cleanPhone}?text=${msg}`
                            : `https://wa.me/?text=${msg}`;
                          window.open(waUrl, '_blank');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] inline-flex items-center space-x-1"
                        title="Share Landing Page on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onNavigateToCard(c.slug)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] inline-flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleAIEnrich(c.id)}
                        disabled={enrichingId === c.id}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] inline-flex items-center space-x-1"
                        title="AI Company Enrichment"
                      >
                        {enrichingId === c.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                        )}
                        <span>Enrich</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCard(c.id, c.name)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slug Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-white relative">
            <button onClick={() => setEditingCard(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg">Manage Custom SEO Slug</h3>
            <p className="text-xs text-slate-400">
              Editing slug for <strong className="text-white">{editingCard.name}</strong>. Previous link will automatically redirect.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">New Slug Endpoint</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-mono">/card/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateSlug}
              disabled={slugUpdating}
              className="w-full py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs transition-all"
            >
              {slugUpdating ? 'Updating Slug...' : 'Save New Slug'}
            </button>
          </div>
        </div>
      )}

      {/* OCR Confidence Inspector Modal */}
      {inspectCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 text-white relative">
            <button onClick={() => setInspectCard(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-lg">OCR Confidence Score Inspector</h3>
            </div>

            <p className="text-xs text-slate-400">
              Detailed field accuracy logs extracted by Gemini multi-modal engine for {inspectCard.name}.
            </p>

            {inspectCard.cardImageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 h-36 bg-slate-950">
                <img src={inspectCard.cardImageUrl} alt="Card Source" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(inspectCard.confidenceScores || {}).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="capitalize text-slate-400">{key}</span>
                  <span className="font-mono font-bold text-emerald-400">{val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
