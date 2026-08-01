import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  ExternalLink,
  Sparkles,
  Building2,
  Phone,
  Mail,
  QrCode,
  Download,
  Plus,
  ShieldCheck,
  Eye,
  Filter,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Save
} from 'lucide-react';
import { CardProfile } from '../types.js';
import { downloadVCard } from '../lib/vcard.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { getAllCardsFromFirestore } from '../lib/firebase.js';
import { saveCardGlobally, deleteCardGlobally } from '../lib/globalSync.js';

interface ExploreCardsProps {
  onNavigateToCard: (slug: string) => void;
  onNavigateToScan: () => void;
}

export const ExploreCards: React.FC<ExploreCardsProps> = ({
  onNavigateToCard,
  onNavigateToScan,
}) => {
  const [cards, setCards] = useState<CardProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Edit and Delete states
  const [editingCard, setEditingCard] = useState<CardProfile | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  useEffect(() => {
    async function loadCards() {
      setLoading(true);
      let firestoreCards: CardProfile[] = [];
      try {
        firestoreCards = await getAllCardsFromFirestore();
      } catch (e) {
        console.warn('Firestore load cards error:', e);
      }

      let fetched: CardProfile[] = [];
      try {
        const res = await fetch('/api/cards');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            fetched = data;
          }
        }
      } catch (err) {
        console.warn('Backend cards endpoint unreachable, loading local cards:', err);
      }

      // Merge with localStorage cards
      let localCards: CardProfile[] = [];
      try {
        localCards = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
      } catch (e) {
        console.warn('LocalStorage parse error:', e);
      }

      const mergedMap = new Map<string, CardProfile>();
      [...firestoreCards, ...fetched, ...localCards].forEach((card) => {
        if (card && card.slug) {
          mergedMap.set(card.slug, card);
        }
      });

      setCards(Array.from(mergedMap.values()));
      setLoading(false);
    }
    loadCards();
  }, []);

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    setIsSaving(true);
    try {
      const savedCard = await saveCardGlobally(editingCard);
      setCards((prev) =>
        prev.map((c) => (c.id === savedCard.id || c.slug === savedCard.slug ? savedCard : c))
      );
      setEditingCard(null);
    } catch (e) {
      console.warn('Save edit card error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCard) return;
    setIsDeleting(true);
    try {
      await deleteCardGlobally(deletingCard.slug);
      if (deletingCard.id) {
        await deleteCardGlobally(deletingCard.id);
      }
      setCards((prev) => prev.filter((c) => c.slug !== deletingCard.slug && c.id !== deletingCard.id));
      setDeletingCard(null);
    } catch (e) {
      console.warn('Delete card error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateAIBioModal = async () => {
    if (!editingCard) return;
    setIsGeneratingBio(true);
    try {
      const res = await fetch('/api/cards/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCard.name,
          title: editingCard.title,
          company: editingCard.company,
          businessCategory: editingCard.businessCategory,
          tagline: editingCard.tagline,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bio) {
          setEditingCard({ ...editingCard, bio: data.bio });
        }
      } else {
        const name = editingCard.name || 'Executive Contact';
        const company = editingCard.company || 'Enterprise Solutions';
        const title = editingCard.title || 'Senior Executive';
        const category = editingCard.businessCategory || 'IT Services & Software';

        const fallbackBio = `${name} is an accomplished ${title} at ${company}, operating at the intersection of strategic innovation, organizational leadership, and executive client management in ${category}.\n\nWith extensive industry experience and a proven track record, ${name} drives business expansion, operational efficiency, and high-value partnership initiatives. Known for a collaborative management approach, ${name} leads multi-disciplinary efforts to deliver scalable solutions and maintain exceptional quality standards across all enterprise commitments.\n\nDedicated to ongoing innovation and customer-centric leadership, ${name} continues to advance market presence and deliver measurable value for partners and institutional stakeholders.`;

        setEditingCard({ ...editingCard, bio: fallbackBio });
      }
    } catch (e) {
      console.warn('Modal bio generation error:', e);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const dynamicCategories = Array.from(new Set(cards.map((c) => c.businessCategory).filter(Boolean)));
  const categories = ['all', ...dynamicCategories];

  const filtered = cards.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.businessCategory === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Digital Identity Platform</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Turn Physical Cards into <span className="text-blue-400">Live Business Websites</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Scan physical visiting cards with multi-modal Gemini OCR. Instantly generate downloadable vCards, interactive QR codes, SEO public profiles at <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded">/card/{'{slug}'}</code>, AI trained chatbots, and CRM lead pipelines.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onNavigateToScan}
              className="px-6 py-3 rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all transform active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Scan Visiting Card Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Directory Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles by name, company, or category..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Directory' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading digital identity profiles...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No identity profiles match your query.
          </div>
        ) : (
          filtered.map((card) => (
            <div
              key={card.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Card Header Banner */}
              <div className="h-28 relative bg-slate-800 overflow-hidden">
                <img src={card.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                
                {/* Top Action Badge Row */}
                <div className="absolute top-3 right-3 flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCard(card);
                    }}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-blue-600 text-slate-200 hover:text-white backdrop-blur-md rounded-full text-[10px] font-bold flex items-center space-x-1 border border-slate-700/60 hover:border-blue-500 transition-all shadow-md"
                    title="Edit profile card"
                  >
                    <Pencil className="w-3 h-3 text-blue-400 group-hover/btn:text-white" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCard(card);
                    }}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-red-600 text-slate-200 hover:text-white backdrop-blur-md rounded-full text-[10px] font-bold flex items-center space-x-1 border border-slate-700/60 hover:border-red-500 transition-all shadow-md"
                    title="Delete profile card"
                  >
                    <Trash2 className="w-3 h-3 text-red-400 group-hover/btn:text-white" />
                    <span>Delete</span>
                  </button>

                  <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Card Profile Info */}
              <div className="p-6 -mt-10 relative z-10 space-y-4">
                <div className="flex items-end justify-between">
                  <AvatarDisplay
                    avatarUrl={card.avatarUrl}
                    logoUrl={card.logoUrl}
                    name={card.name}
                    primaryColor={card.primaryColor}
                    className="w-16 h-16 rounded-2xl border-2 border-slate-900 text-lg font-bold shadow-xl overflow-hidden"
                  />
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <span className="text-blue-400 font-bold flex items-center space-x-1 justify-end">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{card.viewsCount} views</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-white group-hover:text-blue-400 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-400">{card.title}</p>
                  <p className="text-xs text-slate-400 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{card.company}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{card.bio}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                  <span className="px-2.5 py-1 bg-slate-950 text-slate-400 rounded-lg text-[10px] font-semibold border border-slate-800">
                    {card.businessCategory}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">/card/{card.slug}</span>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-6 pb-6 pt-0 space-y-2">
                {/* Edit & Delete Buttons Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditingCard(card)}
                    className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setDeletingCard(card)}
                    className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-red-600/20 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-red-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* vCard & Open Profile Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadVCard(card)}
                    className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>vCard</span>
                  </button>

                  <button
                    onClick={() => onNavigateToCard(card.slug)}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all"
                  >
                    <span>Open Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Profile Card</h2>
                  <p className="text-xs text-slate-400">Modify executive profile details, AI biography, and contact info</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingCard.name}
                  onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={editingCard.company}
                  onChange={(e) => setEditingCard({ ...editingCard, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Category</label>
                <input
                  type="text"
                  value={editingCard.businessCategory}
                  onChange={(e) => setEditingCard({ ...editingCard, businessCategory: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">AI Tagline / Headline</label>
                <input
                  type="text"
                  value={editingCard.tagline || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* AI Bio with regenerate button */}
              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>AI Executive Biography</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIBioModal}
                    disabled={isGeneratingBio}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-all"
                  >
                    {isGeneratingBio ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>{isGeneratingBio ? 'Generating...' : '✨ Re-Generate Bio'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={editingCard.bio || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingCard.email || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingCard.phone || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, phone: e.target.value, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
                <input
                  type="text"
                  value={editingCard.website || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Office Address</label>
                <input
                  type="text"
                  value={editingCard.address || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/30"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Profile Card</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the digital identity profile for <strong className="text-white">{deletingCard.name}</strong> (<span className="text-blue-400 font-mono text-xs">/card/{deletingCard.slug}</span>)?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingCard(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-red-600/30"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

