import { CardProfile } from '../types.js';

export interface SEOOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'profile' | 'article';
  keywords?: string;
  jsonLd?: Record<string, any>;
}

/**
 * Dynamically updates document head tags for SEO, Open Graph, Twitter Cards, and JSON-LD structured data.
 */
export function updatePageSEO(options: SEOOptions) {
  if (typeof document === 'undefined') return;

  // Update Title
  document.title = options.title;

  // Helper to set or create meta element
  const setMeta = (nameOrProperty: 'name' | 'property', key: string, content: string) => {
    let element = document.querySelector(`meta[${nameOrProperty}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(nameOrProperty, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Helper to set link element
  const setLink = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      document.head.appendChild(element);
    }
    element.setAttribute('href', href);
  };

  const currentUrl = options.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Standard Meta Tags
  setMeta('name', 'description', options.description);
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  if (options.keywords) {
    setMeta('name', 'keywords', options.keywords);
  }

  // Canonical URL
  if (currentUrl) {
    setLink('canonical', currentUrl);
  }

  // Open Graph
  setMeta('property', 'og:title', options.title);
  setMeta('property', 'og:description', options.description);
  setMeta('property', 'og:type', options.ogType || 'website');
  if (currentUrl) setMeta('property', 'og:url', currentUrl);
  setMeta('property', 'og:site_name', 'CardFlow Pro');

  if (options.ogImage) {
    setMeta('property', 'og:image', options.ogImage);
    setMeta('property', 'og:image:alt', options.title);
  }

  // Twitter Cards
  setMeta('name', 'twitter:card', options.ogImage ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', options.title);
  setMeta('name', 'twitter:description', options.description);
  if (options.ogImage) {
    setMeta('name', 'twitter:image', options.ogImage);
  }

  // JSON-LD Structured Data
  if (options.jsonLd) {
    let script = document.getElementById('seo-jsonld') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(options.jsonLd, null, 2);
  }
}

/**
 * Generates Schema.org JSON-LD ProfilePage & Person structure for a CardProfile
 */
export function generateCardJSONLD(card: CardProfile, currentUrl?: string): Record<string, any> {
  const socialArray = card.socialLinks ? Object.values(card.socialLinks).filter(Boolean) : [];
  const url = currentUrl || (typeof window !== 'undefined' ? `${window.location.origin}/card/${card.slug}` : `https://cardflowpro.com/card/${card.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'dateCreated': card.createdAt,
    'dateModified': card.updatedAt,
    'mainEntity': {
      '@type': 'Person',
      'name': card.name,
      'jobTitle': card.title,
      'worksFor': {
        '@type': 'Organization',
        'name': card.company,
      },
      'email': card.email,
      'telephone': card.phone,
      'url': url,
      'image': card.avatarUrl || card.bannerUrl,
      'description': card.tagline || card.bio,
      'knowsAbout': [card.businessCategory, 'Enterprise Solutions', 'Corporate Strategy'],
      ...(card.address ? {
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': card.address,
        }
      } : {}),
      ...(socialArray.length > 0 ? { 'sameAs': socialArray } : {}),
    }
  };
}

/**
 * Generates Schema.org JSON-LD WebApplication structure for the home app
 */
export function generatePlatformAppJSONLD(originUrl?: string): Record<string, any> {
  const url = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://cardflowpro.com');

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'CardFlow Pro - AI Digital Identity & Visiting Card Platform',
    'operatingSystem': 'All',
    'applicationCategory': 'BusinessApplication',
    'url': url,
    'description': 'AI-powered Digital Identity Platform for scanning physical visiting cards, AI OCR extraction, custom slug profile pages (/card/slug), downloadable vCards, QR analytics, CRM lead capture, AI bio generation, and trained AI chatbots.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    }
  };
}
