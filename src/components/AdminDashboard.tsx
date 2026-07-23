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
  MessageSquare
} from 'lucide-react';
import { CardProfile } from '../types.js';

interface AdminDashboardProps {
  onNavigateToScan: () => void;
  onNavigateToCard: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToScan,
  onNavigateToCard,
}) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Digital Identity Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage OCR visiting card profiles, custom slugs, AI enrichment, and QR analytics.
          </p>
        </div>
        <button
          onClick={onNavigateToScan}
          className="px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 flex items-center space-x-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Scan New Card</span>
        </button>
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
                        <img
                          src={c.avatarUrl || c.logoUrl}
                          alt={c.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 bg-slate-950"
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
