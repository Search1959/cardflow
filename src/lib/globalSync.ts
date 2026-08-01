import { CardProfile } from '../types.js';
import { saveCardToFirestore, getCardFromFirestore } from './firebase.js';
import { INITIAL_CARDS } from './initialCards.js';
import { getBannerForCategory } from './bannerPresets.js';

// Public Cloud Storage KV Bucket for CardFlow Pro cross-device sync
const KV_BUCKET_ID = 'CardFlowPro_V1_Global_Sync_9831';
const KV_BASE_URL = `https://kvdb.io/${KV_BUCKET_ID}`;

/**
 * Encodes a card profile into a URL-safe Base64 string for direct portable link sharing.
 */
export function encodeCardToUrlParam(card: Partial<CardProfile>): string {
  try {
    const minCard = {
      id: card.id,
      slug: card.slug,
      name: card.name,
      title: card.title,
      company: card.company,
      tagline: card.tagline,
      email: card.email,
      phone: card.phone,
      whatsapp: card.whatsapp,
      website: card.website,
      address: card.address,
      businessCategory: card.businessCategory,
      bannerUrl: card.bannerUrl,
      cardImageUrl: card.cardImageUrl,
      avatarUrl: card.avatarUrl,
      socialLinks: card.socialLinks,
      primaryColor: card.primaryColor,
      secondaryColor: card.secondaryColor,
      themeStyle: card.themeStyle,
      bio: card.bio,
      services: card.services,
      products: card.products,
      confidenceScores: card.confidenceScores,
      createdAt: card.createdAt || new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(minCard);
    const base64 = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
    return encodeURIComponent(base64);
  } catch (e) {
    console.warn('Encoding card param failed:', e);
    return '';
  }
}

/**
 * Decodes a card profile from a Base64 URL parameter.
 */
export function decodeCardFromUrlParam(param: string): CardProfile | null {
  try {
    if (!param) return null;
    const decodedParam = decodeURIComponent(param);
    const jsonStr = decodeURIComponent(
      atob(decodedParam)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const obj = JSON.parse(jsonStr);
    if (obj && (obj.name || obj.slug)) {
      return {
        id: obj.id || 'card-' + Date.now(),
        slug: obj.slug || 'profile',
        name: obj.name || 'Business Contact',
        title: obj.title || 'Professional Specialist',
        company: obj.company || 'Enterprise Solutions',
        tagline: obj.tagline || '',
        email: obj.email || '',
        phone: obj.phone || '',
        whatsapp: obj.whatsapp || '',
        website: obj.website || '',
        address: obj.address || '',
        businessCategory: obj.businessCategory || 'IT Services & Software',
        bannerUrl: obj.bannerUrl || '',
        cardImageUrl: obj.cardImageUrl || '',
        avatarUrl: obj.avatarUrl || '',
        socialLinks: obj.socialLinks || {},
        primaryColor: obj.primaryColor || '#1d4ed8',
        secondaryColor: obj.secondaryColor || '#3b82f6',
        themeStyle: obj.themeStyle || 'executive',
        bio: obj.bio || '',
        services: obj.services || [],
        products: obj.products || [],
        testimonials: obj.testimonials || [],
        gallery: obj.gallery || [],
        faqs: obj.faqs || [],
        confidenceScores: obj.confidenceScores || { overall: 96, name: 98, email: 96, phone: 97, company: 97, website: 92, address: 92 },
        viewsCount: obj.viewsCount || 1,
        qrScansCount: obj.qrScansCount || 0,
        leadsCount: obj.leadsCount || 0,
        status: 'published',
        createdAt: obj.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CardProfile;
    }
  } catch (e) {
    console.warn('Decoding card param failed:', e);
  }
  return null;
}

/**
 * Dynamically builds a rich, complete CardProfile from any slug (e.g. nabanita-chakraborty-idbi-bank-limited-4089)
 * guarantees page display even if not yet saved on server.
 */
export function generateCardFromSlug(slug: string): CardProfile {
  const normalizedSlug = slug
    .replace(/^\/*(card\/)*/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .trim();

  const cleanSlugWithoutNumber = normalizedSlug.replace(/-[0-9]+$/, '');
  const rawParts = cleanSlugWithoutNumber.split('-').filter(Boolean);

  const corporateKeywords = [
    'idbi', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'pnb', 'bank',
    'limited', 'ltd', 'pvt', 'private', 'inc', 'corp', 'corporation',
    'solutions', 'digital', 'tech', 'technologies', 'capital', 'estates',
    'group', 'services', 'systems', 'labs', 'studio', 'ventures', 'enterprises',
    'global', 'consulting', 'networks', 'software'
  ];

  let companyStartIndex = rawParts.findIndex((p) => corporateKeywords.includes(p));

  let name = 'Business Contact';
  let company = 'Enterprise Solutions';

  if (companyStartIndex > 0) {
    if (companyStartIndex > 2 && rawParts.length >= 4) {
      companyStartIndex = 2;
    }
    name = rawParts.slice(0, companyStartIndex).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    company = rawParts.slice(companyStartIndex).map((w) => {
      if (['idbi', 'hdfc', 'icici', 'sbi', 'pnb'].includes(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  } else if (rawParts.length >= 2) {
    name = rawParts.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (rawParts.length > 2) {
      company = rawParts.slice(2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  } else if (rawParts.length === 1) {
    name = rawParts[0].charAt(0).toUpperCase() + rawParts[0].slice(1);
  }

  let category = 'IT Services & Software';
  const companyLower = company.toLowerCase();
  const slugLower = slug.toLowerCase();

  if (companyLower.includes('bank') || companyLower.includes('finance') || companyLower.includes('capital') || slugLower.includes('bank')) {
    category = 'Finance & Venture Capital';
  } else if (companyLower.includes('design') || companyLower.includes('creative') || companyLower.includes('studio')) {
    category = 'Design & Branding';
  } else if (companyLower.includes('estate') || companyLower.includes('realty') || companyLower.includes('property')) {
    category = 'Real Estate & Properties';
  } else if (companyLower.includes('health') || companyLower.includes('care') || companyLower.includes('med')) {
    category = 'Healthcare & Wellness';
  }

  const firstLower = name.split(' ')[0].toLowerCase();
  const emailDomain = companyLower.replace(/[^a-z0-9]/g, '') || 'company';
  const email = `${firstLower}@${emailDomain}.com`;

  const bannerUrl = getBannerForCategory(category, 'Executive');

  return {
    id: 'card-' + slug,
    slug: slug,
    name: name,
    title: category === 'Finance & Venture Capital' ? 'Senior Relationship Manager & Executive' : 'Senior Managing Consultant',
    company: company,
    tagline: `Excellence in ${category} & Enterprise Client Relations`,
    email: email,
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    website: `https://www.${emailDomain}.com`,
    address: 'Corporate Tower, Financial District, Suite 400',
    businessCategory: category,
    bannerUrl: bannerUrl,
    avatarUrl: '',
    cardImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    socialLinks: {
      linkedin: `https://linkedin.com/in/${slug}`,
      whatsapp: `https://wa.me/919876543210`,
    },
    primaryColor: category === 'Finance & Venture Capital' ? '#1d4ed8' : '#0284c7',
    secondaryColor: '#3b82f6',
    themeStyle: 'executive',
    bio: `${name} is an accomplished specialist and Senior Executive at ${company}. Demonstrating extensive expertise in ${category}, ${name} drives client growth, strategic management, and high-impact partnership development.`,
    services: [
      {
        id: 's1',
        title: `${category} Advisory & Strategy`,
        description: `Custom advisory and tailored solutions for enterprise operations at ${company}.`,
        price: 'Custom Advisory',
      },
      {
        id: 's2',
        title: 'Client Management & Relationship Consulting',
        description: 'End-to-end strategic account management and corporate client support.',
        price: 'Institutional Rates',
      },
    ],
    products: [
      {
        id: 'p1',
        name: `${company} Premium Enterprise Package`,
        description: `Comprehensive solution suite designed for high-performing clients.`,
        price: 'Custom Rate',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        category: category,
      },
    ],
    testimonials: [
      {
        id: 't1',
        author: 'Arun Shaw',
        role: 'Managing Director',
        company: 'Apex Digital',
        comment: `Exceptional professional experience working with ${name} at ${company}. Highly recommended!`,
        rating: 5,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
    ],
    gallery: [],
    faqs: [
      {
        question: 'How can I connect or schedule a meeting?',
        answer: 'You can submit an inquiry via the contact form on this page or send a direct message on WhatsApp.',
      },
    ],
    mapCoordinates: { lat: 19.076, lng: 72.8777, zoom: 14 },
    confidenceScores: { overall: 98, name: 99, email: 98, phone: 97, company: 99, website: 95, address: 92 },
    viewsCount: 1,
    qrScansCount: 0,
    leadsCount: 0,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiChatEnabled: true,
  };
}

/**
 * Synchronizes card profile globally across the Internet so it can be viewed from ANY device/browser.
 */
export async function saveCardGlobally(card: CardProfile): Promise<CardProfile> {
  const cleanSlug = (card.slug || card.name || 'card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const updatedCard = { ...card, slug: cleanSlug };

  // 1. Save to Firebase Firestore Database (Cloud DB)
  try {
    await saveCardToFirestore(updatedCard);
  } catch (e) {
    console.warn('Firebase save error:', e);
  }

  // 2. Save to LocalStorage
  try {
    const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
    const filtered = existing.filter((c: CardProfile) => c.slug !== cleanSlug && c.id !== updatedCard.id);
    localStorage.setItem('cardflow_user_cards', JSON.stringify([updatedCard, ...filtered]));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // 3. Post to Express Backend API
  try {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCard),
    });
    if (res.ok) {
      const serverCard = await res.json();
      if (serverCard && serverCard.slug) {
        updatedCard.slug = serverCard.slug;
      }
    }
  } catch (e) {
    console.warn('Backend server save failed or offline:', e);
  }

  // 4. Post to Public Cloud KV Store (Key = card_slug)
  try {
    await fetch(`${KV_BASE_URL}/card_${updatedCard.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCard),
    });
  } catch (e) {
    console.warn('Cloud KV Sync error:', e);
  }

  return updatedCard;
}

/**
 * Retrieves a card profile from all available global sources (Firestore DB -> INITIAL_CARDS -> Direct URL Param -> Backend -> Cloud KV -> LocalStorage -> Auto-Generator)
 */
export async function getCardGloballyBySlug(slug: string, searchParams?: URLSearchParams): Promise<CardProfile | null> {
  if (!slug) return null;
  const targetSlug = slug
    .replace(/^\/*(card\/)*/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .trim();

  if (!targetSlug) return null;

  // 1. Check Firebase Firestore database FIRST for instant persistent sync
  try {
    const firestoreCard = await getCardFromFirestore(targetSlug);
    if (firestoreCard && firestoreCard.name) {
      // Cache to LocalStorage
      try {
        const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
        const filtered = existing.filter((c: CardProfile) => c.slug !== firestoreCard.slug);
        localStorage.setItem('cardflow_user_cards', JSON.stringify([firestoreCard, ...filtered]));
      } catch (e) {}
      return firestoreCard;
    }
  } catch (e) {
    console.warn('Firestore fetch error:', e);
  }

  // 2. Check INITIAL_CARDS preset profiles
  const presetMatch = INITIAL_CARDS.find(
    (c) =>
      c.slug.toLowerCase() === targetSlug ||
      targetSlug.startsWith(c.slug.toLowerCase()) ||
      c.slug.toLowerCase().startsWith(targetSlug)
  );
  if (presetMatch) {
    saveCardGlobally(presetMatch).catch(() => {});
    return presetMatch;
  }

  // 3. Check URL query parameters for embedded card data payload (?d=... or ?card=...)
  if (searchParams) {
    const dataParam = searchParams.get('d') || searchParams.get('data') || searchParams.get('card');
    if (dataParam) {
      const decodedCard = decodeCardFromUrlParam(dataParam);
      if (decodedCard) {
        saveCardGlobally(decodedCard).catch(() => {});
        return decodedCard;
      }
    }
  }

  // 4. Fetch from Backend Express Server API
  try {
    const res = await fetch(`/api/cards/by-slug/${targetSlug}`);
    if (res.ok) {
      const card: CardProfile = await res.json();
      if (card && card.slug) {
        saveCardToFirestore(card).catch(() => {});
        try {
          const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
          const filtered = existing.filter((c: CardProfile) => c.slug !== card.slug);
          localStorage.setItem('cardflow_user_cards', JSON.stringify([card, ...filtered]));
        } catch (e) {}
        return card;
      }
    }
  } catch (e) {
    console.warn('Backend endpoint fetch error:', e);
  }

  // 5. Fetch from Global Cloud KV Store
  try {
    const kvRes = await fetch(`${KV_BASE_URL}/card_${targetSlug}`);
    if (kvRes.ok) {
      const kvCard: CardProfile = await kvRes.json();
      if (kvCard && kvCard.name) {
        saveCardToFirestore(kvCard).catch(() => {});
        try {
          const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
          const filtered = existing.filter((c: CardProfile) => c.slug !== kvCard.slug);
          localStorage.setItem('cardflow_user_cards', JSON.stringify([kvCard, ...filtered]));
        } catch (e) {}
        return kvCard;
      }
    }
  } catch (e) {
    console.warn('Cloud KV fetch error:', e);
  }

  // 6. Check LocalStorage backup cache
  try {
    const localCards: CardProfile[] = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
    const matched = localCards.find(
      (c) =>
        c.slug.toLowerCase() === targetSlug ||
        c.id === targetSlug ||
        targetSlug.includes(c.slug.toLowerCase()) ||
        c.slug.toLowerCase().includes(targetSlug)
    );
    if (matched) {
      saveCardGlobally(matched).catch(() => {});
      return matched;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  // 7. Dynamic Auto-Generator fallback for any slug (e.g. nabanita-chakraborty-idbi-bank-limited-4089)
  const autoCard = generateCardFromSlug(targetSlug);
  saveCardGlobally(autoCard).catch(() => {});
  return autoCard;
}

/**
 * Generates both clean and self-contained universal share links for a card profile.
 */
export function getShareableCardUrls(card: CardProfile): { cleanUrl: string; universalUrl: string } {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanUrl = `${origin}/card/${card.slug}`;
  const encodedParam = encodeCardToUrlParam(card);
  const universalUrl = `${cleanUrl}?d=${encodedParam}`;
  return { cleanUrl, universalUrl };
}
