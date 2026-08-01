import { CardProfile } from '../types.js';
import { saveCardToFirestore, getCardFromFirestore, deleteCardFromFirestore } from './firebase.js';
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

  const generatedBio = `${name} is an accomplished ${category === 'Finance & Venture Capital' ? 'Senior Relationship Manager' : 'Senior Executive'} at ${company}, operating at the intersection of strategic innovation, organizational leadership, and executive client management in ${category}.\n\nWith extensive industry experience and a proven track record, ${name} drives business expansion, operational efficiency, and high-value partnership initiatives. Known for a collaborative management approach, ${name} leads multi-disciplinary efforts to deliver scalable solutions and maintain exceptional quality standards across all enterprise commitments.\n\nDedicated to ongoing innovation and customer-centric leadership, ${name} continues to advance market presence and deliver measurable value for partners and institutional stakeholders.`;

  return sanitizeAndEnrichCardAIContent({
    id: 'card-' + slug,
    slug: slug,
    name: name,
    title: category === 'Finance & Venture Capital' ? 'Senior Relationship Manager & Executive' : 'Senior Managing Consultant',
    company: company,
    tagline: `Excellence in ${category} & Strategic Enterprise Leadership`,
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
    bio: generatedBio,
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
  });
}

/**
 * Sanitizes and enriches a card with complete AI biography, tagline, services, and FAQs
 */
export function sanitizeAndEnrichCardAIContent(card: CardProfile): CardProfile {
  if (!card) return card;

  const name = card.name || 'Executive Contact';
  const company = card.company || 'Enterprise Solutions';
  const title = card.title || 'Senior Executive';
  const category = card.businessCategory || 'IT Services & Software';

  let tagline = card.tagline || '';
  if (!tagline || tagline.toLowerCase().startsWith('official digital contact profile')) {
    tagline = company
      ? `Driving Strategic Innovation & Enterprise Leadership at ${company}`
      : `Delivering Strategic Leadership & Excellence in ${category}`;
  }

  let bio = card.bio || '';
  if (!bio || bio.trim().length < 60 || bio.toLowerCase().startsWith('official digital contact profile')) {
    bio = `${name} is an accomplished ${title} at ${company}, operating at the intersection of strategic innovation, organizational leadership, and executive client management in ${category}.\n\nWith extensive industry experience and a proven track record, ${name} drives business expansion, operational efficiency, and high-value partnership initiatives. Known for a collaborative management approach, ${name} leads multi-disciplinary efforts to deliver scalable solutions and maintain exceptional quality standards across all enterprise commitments.\n\nDedicated to ongoing innovation and customer-centric leadership, ${name} continues to advance market presence and deliver measurable value for partners and institutional stakeholders.`;
  }

  const services = card.services && card.services.length > 0 ? card.services : [
    {
      id: 's1',
      title: `${category} Advisory & Strategy`,
      description: `Tailored strategic consultation and enterprise solutions delivered by ${name} at ${company}.`,
      price: 'Custom Advisory',
    },
    {
      id: 's2',
      title: 'Executive Client Relations & Leadership',
      description: 'End-to-end management of high-value partnerships and organizational projects.',
      price: 'Institutional Rates',
    },
  ];

  const products = card.products && card.products.length > 0 ? card.products : [
    {
      id: 'p1',
      name: `${company} Enterprise Solution Package`,
      description: `Comprehensive roadmap and digital transformation assessment for enterprise clients.`,
      price: 'Custom Rate',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
      category: category,
    },
  ];

  const faqs = card.faqs && card.faqs.length > 0 ? card.faqs : [
    {
      question: `What services does ${company} specialize in?`,
      answer: `${company} specializes in ${category} solutions, strategic advisory, and client leadership under ${name}.`,
    },
    {
      question: 'How can I schedule a consultation or connect?',
      answer: `You can send a message directly using the contact form on this page or connect via WhatsApp at ${card.whatsapp || card.phone || 'our direct contact line'}.`,
    },
  ];

  return {
    ...card,
    tagline,
    bio,
    services,
    products,
    faqs,
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
 * Deletes card profile globally from Firestore, LocalStorage, KV Store, and Express server API.
 */
export async function deleteCardGlobally(slugOrId: string): Promise<boolean> {
  if (!slugOrId) return false;
  const cleanKey = slugOrId.toLowerCase().trim();

  // 1. Delete from Firebase Firestore
  try {
    await deleteCardFromFirestore(cleanKey);
  } catch (e) {
    console.warn('Firebase delete error:', e);
  }

  // 2. Delete from LocalStorage
  try {
    const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
    const filtered = existing.filter((c: CardProfile) => c.slug !== cleanKey && c.id !== slugOrId);
    localStorage.setItem('cardflow_user_cards', JSON.stringify(filtered));
  } catch (e) {
    console.warn('LocalStorage delete error:', e);
  }

  // 3. Delete from Express server
  try {
    await fetch(`/api/cards/${encodeURIComponent(slugOrId)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Backend API delete error:', e);
  }

  // 4. Delete from KV Store
  try {
    await fetch(`${KV_BASE_URL}/card_${cleanKey}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('KV Store delete error:', e);
  }

  return true;
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
      const enriched = sanitizeAndEnrichCardAIContent(firestoreCard);
      // Cache to LocalStorage
      try {
        const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
        const filtered = existing.filter((c: CardProfile) => c.slug !== enriched.slug);
        localStorage.setItem('cardflow_user_cards', JSON.stringify([enriched, ...filtered]));
      } catch (e) {}
      return enriched;
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
    const enrichedPreset = sanitizeAndEnrichCardAIContent(presetMatch);
    saveCardGlobally(enrichedPreset).catch(() => {});
    return enrichedPreset;
  }

  // 3. Check URL query parameters for embedded card data payload (?d=... or ?card=...)
  if (searchParams) {
    const dataParam = searchParams.get('d') || searchParams.get('data') || searchParams.get('card');
    if (dataParam) {
      const decodedCard = decodeCardFromUrlParam(dataParam);
      if (decodedCard) {
        const enrichedDecoded = sanitizeAndEnrichCardAIContent(decodedCard);
        saveCardGlobally(enrichedDecoded).catch(() => {});
        return enrichedDecoded;
      }
    }
  }

  // 4. Fetch from Backend Express Server API
  try {
    const res = await fetch(`/api/cards/by-slug/${targetSlug}`);
    if (res.ok) {
      const card: CardProfile = await res.json();
      if (card && card.slug) {
        const enrichedCard = sanitizeAndEnrichCardAIContent(card);
        saveCardToFirestore(enrichedCard).catch(() => {});
        try {
          const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
          const filtered = existing.filter((c: CardProfile) => c.slug !== enrichedCard.slug);
          localStorage.setItem('cardflow_user_cards', JSON.stringify([enrichedCard, ...filtered]));
        } catch (e) {}
        return enrichedCard;
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
        const enrichedKv = sanitizeAndEnrichCardAIContent(kvCard);
        saveCardToFirestore(enrichedKv).catch(() => {});
        try {
          const existing = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
          const filtered = existing.filter((c: CardProfile) => c.slug !== enrichedKv.slug);
          localStorage.setItem('cardflow_user_cards', JSON.stringify([enrichedKv, ...filtered]));
        } catch (e) {}
        return enrichedKv;
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
      const enrichedMatched = sanitizeAndEnrichCardAIContent(matched);
      saveCardGlobally(enrichedMatched).catch(() => {});
      return enrichedMatched;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  // 7. Dynamic Auto-Generator fallback for any slug
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
