import { CardProfile } from '../types.js';
import { saveCardToFirestore, getCardFromFirestore } from './firebase.js';

// Public Cloud Storage KV Bucket for CardFlow Pro cross-device sync
const KV_BUCKET_ID = 'CardFlowPro_V1_Global_Sync_9831';
const KV_BASE_URL = `https://kvdb.io/${KV_BUCKET_ID}`;

/**
 * Encodes a card profile into a URL-safe Base64 string for direct portable link sharing.
 * Guaranteed to work on ANY device, ANY browser, EVEN IF offline or server is unavailable!
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
        title: obj.title || 'Professional',
        company: obj.company || 'Enterprise',
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
 * Retrieves a card profile from all available global sources (Firestore DB -> Backend -> Cloud KV -> Direct URL Param -> LocalStorage)
 */
export async function getCardGloballyBySlug(slug: string, searchParams?: URLSearchParams): Promise<CardProfile | null> {
  if (!slug) return null;
  const targetSlug = slug.toLowerCase().trim();

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

  // 2. Check URL query parameters for embedded card data payload (?d=... or ?card=...)
  if (searchParams) {
    const dataParam = searchParams.get('d') || searchParams.get('data') || searchParams.get('card');
    if (dataParam) {
      const decodedCard = decodeCardFromUrlParam(dataParam);
      if (decodedCard) {
        // Cache decoded card into Firestore, LocalStorage, and sync to server
        saveCardGlobally(decodedCard).catch(() => {});
        return decodedCard;
      }
    }
  }

  // 3. Fetch from Backend Express Server API
  try {
    const res = await fetch(`/api/cards/by-slug/${targetSlug}`);
    if (res.ok) {
      const card: CardProfile = await res.json();
      if (card && card.slug) {
        // Save to Firestore & LocalStorage
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

  // 4. Fetch from Global Cloud KV Store
  try {
    const kvRes = await fetch(`${KV_BASE_URL}/card_${targetSlug}`);
    if (kvRes.ok) {
      const kvCard: CardProfile = await kvRes.json();
      if (kvCard && kvCard.name) {
        // Save to Firestore
        saveCardToFirestore(kvCard).catch(() => {});

        // Post back to Express backend server so server database re-populates!
        fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kvCard),
        }).catch(() => {});

        // Save to LocalStorage
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

  // 5. Check LocalStorage backup cache
  try {
    const localCards: CardProfile[] = JSON.parse(localStorage.getItem('cardflow_user_cards') || '[]');
    const matched = localCards.find((c) => c.slug.toLowerCase() === targetSlug || c.id === targetSlug);
    if (matched) {
      // Push matched card to Firestore & backend server & cloud KV for future internet callers
      saveCardGlobally(matched).catch(() => {});
      return matched;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  return null;
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
