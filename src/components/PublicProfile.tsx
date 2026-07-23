import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Download,
  QrCode,
  Share2,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Star,
  Building2,
  ExternalLink,
  ChevronRight,
  X,
  Languages,
  Check,
  Briefcase,
  Layers,
  HelpCircle,
  Copy,
  Navigation
} from 'lucide-react';
import { CardProfile, ChatMessage } from '../types.js';
import { downloadVCard } from '../lib/vcard.js';
import { AvatarDisplay } from './AvatarDisplay.js';

interface PublicProfileProps {
  slug: string;
  onNavigateHome?: () => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ slug }) => {
  const [card, setCard] = useState<CardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // CRM Lead Form state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [selectedServiceInterest, setSelectedServiceInterest] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // AI Chatbot Widget state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Multilingual Translate state
  const [currentLang, setCurrentLang] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);

  // Copy URL state
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch card profile data
  useEffect(() => {
    async function fetchCard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cards/by-slug/${slug}`);
        if (!res.ok) {
          throw new Error('Digital identity profile not found');
        }
        const data: CardProfile = await res.json();
        setCard(data);

        // Welcome message for AI Chatbot
        setChatMessages([
          {
            id: 'msg-0',
            sender: 'assistant',
            text: `Hello! I'm ${data.name}'s virtual assistant. Ask me anything about ${data.company}, services, pricing, or availability!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // Generate QR code data URL
        const fullUrl = `${window.location.origin}/card/${data.slug}`;
        const qrData = await QRCode.toDataURL(fullUrl, { width: 300, margin: 2 });
        setQrCodeDataUrl(qrData);
      } catch (err: any) {
        setError(err.message || 'Failed to load card profile');
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchCard();
  }, [slug]);

  // Handle QR Scan increment
  const handleOpenQRModal = async () => {
    setShowQRModal(true);
    if (card) {
      fetch(`/api/cards/${card.slug}/qr-scan`, { method: 'POST' }).catch(() => {});
    }
  };

  // Lead submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !leadName || !leadEmail || !leadMessage) return;

    setLeadSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${card.slug}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          message: leadMessage,
          serviceInterest: selectedServiceInterest || 'General Inquiry',
        }),
      });

      if (!res.ok) throw new Error('Failed to submit message');

      setLeadSuccess(true);
      setLeadName('');
      setLeadEmail('');
      setLeadPhone('');
      setLeadMessage('');
    } catch (err: any) {
      alert(err.message || 'Error submitting message');
    } finally {
      setLeadSubmitting(false);
    }
  };

  // Chat message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim() || !card || chatLoading) return;

    const userMsgText = inputChat;
    setInputChat('');

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatLoading(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.sender, text: m.text }));
      const res = await fetch(`/api/cards/${card.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsgText, history }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'Thank you for asking!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: `Sorry, I am unable to connect right now. Please reach ${card.name} at ${card.email}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Multilingual translation trigger
  const handleLanguageChange = async (targetLang: string) => {
    if (!card || isTranslating) return;
    setCurrentLang(targetLang);

    if (targetLang === 'English') {
      // reload original card
      const res = await fetch(`/api/cards/by-slug/${slug}`);
      const data = await res.json();
      setCard(data);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: targetLang }),
      });
      const translated = await res.json();
      setCard((prev) => (prev ? { ...prev, ...translated } : prev));
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Loading Digital Identity Profile...</p>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400 mb-4">
          <X className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Card Profile Not Found</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md">
          The requested slug <code className="text-blue-400 bg-slate-900 px-2 py-0.5 rounded">/card/{slug}</code> does not exist or has been removed.
        </p>
      </div>
    );
  }

  const primaryStyle = { color: card.primaryColor || '#2563eb' };
  const primaryBgStyle = { backgroundColor: card.primaryColor || '#2563eb' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 relative">
      {/* Top Language & Quick Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-2 sticky top-16 z-30 flex items-center justify-between max-w-4xl mx-auto rounded-b-2xl shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Profile Language:</span>
          <div className="flex items-center space-x-1">
            {['English', 'Spanish', 'French', 'Hindi', 'German'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                disabled={isTranslating}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentLang === lang
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyProfileLink}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center space-x-1"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedUrl ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={handleOpenQRModal}
            className="p-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center space-x-1 hover:bg-blue-500"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {/* Banner & Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Cover Banner */}
          <div className="h-44 sm:h-56 relative overflow-hidden bg-slate-800">
            <img
              src={card.bannerUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80'}
              alt="Banner"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </div>

          {/* Profile Header Content */}
          <div className="px-6 sm:px-10 pb-8 -mt-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar Logo */}
              <div className="relative">
                <AvatarDisplay
                  avatarUrl={card.avatarUrl}
                  logoUrl={card.logoUrl}
                  name={card.name}
                  primaryColor={card.primaryColor}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-slate-900 text-3xl sm:text-4xl font-black shadow-2xl overflow-hidden"
                />
                <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Verified Active Profile" />
              </div>

              {/* Title & Name */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">{card.name}</h1>
                  <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
                </div>
                <p className="text-sm sm:text-base font-semibold text-blue-400">{card.title}</p>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>{card.company}</span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[11px] font-medium">{card.businessCategory}</span>
                </p>
              </div>
            </div>

            {/* Save Contact & WhatsApp Share Buttons */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  const cleanPhone = (card.whatsapp || card.phone || '').replace(/[^0-9]/g, '');
                  const landingUrl = `${window.location.origin}/card/${card.slug}`;
                  const msg = encodeURIComponent(`Hi ${card.name}! Here is your live digital business card webpage:\n${landingUrl}`);
                  const waUrl = cleanPhone && cleanPhone.length >= 7
                    ? `https://wa.me/${cleanPhone}?text=${msg}`
                    : `https://wa.me/?text=${msg}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
              >
                <MessageSquare className="w-5 h-5 text-white" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={() => downloadVCard(card)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>Save Contact (.vcf)</span>
              </button>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-800/80 divide-x divide-slate-800/80 bg-slate-950/60 text-xs">
            <a
              href={`tel:${card.phone}`}
              className="p-3.5 flex items-center justify-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold truncate">Call</span>
            </a>
            <a
              href={`mailto:${card.email}`}
              className="p-3.5 flex items-center justify-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="font-semibold truncate">Email</span>
            </a>
            <a
              href={(() => {
                const cleanPhone = (card.whatsapp || card.phone || '').replace(/[^0-9]/g, '');
                const landingUrl = `${window.location.origin}/card/${card.slug}`;
                const msg = encodeURIComponent(`Hi ${card.name}! I viewed your digital card profile at:\n${landingUrl}`);
                return cleanPhone && cleanPhone.length >= 7
                  ? `https://wa.me/${cleanPhone}?text=${msg}`
                  : `https://wa.me/?text=${msg}`;
              })()}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 flex items-center justify-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold truncate">WhatsApp</span>
            </a>
            <a
              href={card.website || '#'}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 flex items-center justify-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold truncate">Website</span>
            </a>
          </div>
        </div>

        {/* Executive Bio & AI Tagline */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>AI Executive Biography</span>
          </div>
          {card.tagline && (
            <p className="text-lg sm:text-xl font-bold italic text-slate-200 border-l-4 border-blue-500 pl-4 py-1">
              "{card.tagline}"
            </p>
          )}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {card.bio}
          </p>
        </div>

        {/* Services Showcase */}
        {card.services && card.services.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <span>Services & Offerings</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {card.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                        {service.title}
                      </h3>
                      {service.price && (
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                          {service.price}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{service.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedServiceInterest(service.title);
                      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Request Quote / Inquiry</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Catalog */}
        {card.products && card.products.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Products & Featured Listings</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {card.products.map((prod) => (
                <div key={prod.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3">
                  {prod.imageUrl && (
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">{prod.name}</h3>
                      <span className="text-emerald-400 font-extrabold text-sm">{prod.price}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{prod.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {card.gallery && card.gallery.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Media & Highlights</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {card.gallery.map((item) => (
                <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-slate-800 aspect-square bg-slate-900">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-white font-bold text-xs">{item.title}</p>
                    {item.caption && <p className="text-slate-400 text-[10px]">{item.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client Testimonials */}
        {card.testimonials && card.testimonials.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Client Reviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {card.testimonials.map((t) => (
                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-xs italic">"{t.comment}"</p>
                  <div className="flex items-center space-x-3 pt-2 border-t border-slate-800/60">
                    {t.avatarUrl && <img src={t.avatarUrl} alt={t.author} className="w-8 h-8 rounded-full object-cover" />}
                    <div>
                      <p className="text-xs font-bold text-white">{t.author}</p>
                      <p className="text-[10px] text-slate-400">{t.role}, {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Maps & Location Preview */}
        {card.address && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-base text-white">Office Location & Directions</h3>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(card.address)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </a>
            </div>
            <p className="text-xs text-slate-300">{card.address}</p>
            {/* Embedded Visual Map Representation */}
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative flex items-center justify-center text-center p-4">
              <div className="absolute inset-0 bg-slate-900 opacity-90" />
              <div className="relative z-10 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-bounce">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">{card.company}</p>
                <p className="text-[11px] text-slate-400 max-w-sm">{card.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* CRM Lead Capture Form */}
        <div id="contact-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Send className="w-5 h-5 text-blue-400" />
              <span>Get in Touch / Request Collaboration</span>
            </h2>
            <p className="text-xs text-slate-400">
              Send a message directly to {card.name}. Entries are saved instantly in CRM leads.
            </p>
          </div>

          {leadSuccess ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-emerald-400 text-lg">Inquiry Sent Successfully!</h3>
              <p className="text-xs text-slate-300">
                Thank you for connecting. {card.name} will receive your details and respond shortly.
              </p>
              <button
                onClick={() => setLeadSuccess(false)}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Service Interest</label>
                  <input
                    type="text"
                    value={selectedServiceInterest}
                    onChange={(e) => setSelectedServiceInterest(e.target.value)}
                    placeholder="e.g. Enterprise AI Consulting"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  value={leadMessage}
                  onChange={(e) => setLeadMessage(e.target.value)}
                  placeholder="Tell us about your requirement or project..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={leadSubmitting}
                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2"
              >
                {leadSubmitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to {card.name}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Floating AI Chatbot Launcher */}
      <div className="fixed bottom-6 right-6 z-40">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-2xl hover:scale-105 transition-all animate-bounce"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">Ask AI Assistant</span>
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700/80 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">{card.name}'s AI Assistant</p>
                  <p className="text-[10px] text-slate-400">Trained on profile content</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <p className="text-[9px] opacity-60 text-right mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 text-xs animate-pulse">
                    Thinking response...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Ask about services, rates, experience..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputChat.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 relative text-white">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg">Scan Digital Business Card</h3>
            <p className="text-xs text-slate-400">Point phone camera to open /card/{card.slug}</p>
            {qrCodeDataUrl && (
              <div className="p-4 bg-white rounded-2xl mx-auto w-fit shadow-xl">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              Total Scans: <span className="text-emerald-400 font-bold">{card.qrScansCount + 1}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
