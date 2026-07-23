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
  Filter
} from 'lucide-react';
import { CardProfile } from '../types.js';
import { downloadVCard } from '../lib/vcard.js';
import { AvatarDisplay } from './AvatarDisplay.js';

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

  useEffect(() => {
    async function loadCards() {
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
    }
    loadCards();
  }, []);

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
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
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
              <div className="px-6 pb-6 pt-0 grid grid-cols-2 gap-2">
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
          ))
        )}
      </div>
    </div>
  );
};
