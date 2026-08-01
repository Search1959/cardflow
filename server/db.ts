import fs from 'fs';
import path from 'path';
import { CardProfile, Lead, AnalyticsEvent } from '../src/types.js';
import { generateCardFromSlug } from '../src/lib/globalSync.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INITIAL_CARDS: CardProfile[] = [
  {
    id: 'card-1',
    slug: 'arun-shaw',
    name: 'Arun Shaw',
    title: 'Founder & Managing Director',
    company: 'Apex Digital Solutions',
    tagline: 'Transforming Enterprise Cloud & AI Infrastructure',
    email: 'arun.shaw@apexdigital.in',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    website: 'https://apexdigital.in',
    address: 'Suite 402, Cyber Tower, HiTech City, Hyderabad, India',
    businessCategory: 'IT Services & Software',
    logoUrl: '',
    avatarUrl: '',
    bannerUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    cardImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/arunshaw',
      twitter: 'https://twitter.com/arunshaw_tech',
      github: 'https://github.com/arunshaw',
      whatsapp: 'https://wa.me/919876543210'
    },
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    themeStyle: 'executive',
    bio: 'Arun Shaw is a visionary technology executive with 15+ years of experience spearheading enterprise AI adoption, multi-cloud strategy, and high-scale software architectures. Having built solutions for Fortune 500 companies, Arun empowers modern enterprises to automate operations and scale seamlessly.',
    services: [
      { id: 's1', title: 'Enterprise AI & LLM Deployment', description: 'Custom fine-tuned Gemini model integrations, RAG architectures, and agentic workflows for enterprise operations.', price: 'Starting at $2,500' },
      { id: 's2', title: 'Cloud Infrastructure Architecture', description: 'Scalable AWS & Google Cloud infrastructure design with Kubernetes, zero-downtime deployment, and security hardening.', price: 'Starting at $1,800' },
      { id: 's3', title: 'Digital Identity Consulting', description: 'Enterprise identity verification systems, OAuth integrations, and secure single sign-on implementations.', price: 'Custom Quote' }
    ],
    products: [
      { id: 'p1', name: 'Apex AI Suite', description: 'Complete SaaS toolkit for automated document processing and intelligent workflow orchestration.', price: '$499/mo', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', category: 'Software' },
      { id: 'p2', name: 'CardFlow Enterprise SDK', description: 'On-premise visiting card scanner and digital card creation engine with custom domain routing.', price: '$1,200/yr', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', category: 'SDK' }
    ],
    testimonials: [
      { id: 't1', author: 'Vikram Malhotra', role: 'CTO', company: 'Nexus Global', comment: 'Arun transformed our entire cloud operations in record time. His deep expertise in AI integration gave us a huge competitive edge.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { id: 't2', author: 'Priya Sundaram', role: 'VP of Product', company: 'InnoTech Labs', comment: 'Working with Arun and his team was seamless. Outstanding attention to detail and high-availability design.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' }
    ],
    gallery: [
      { id: 'g1', title: 'Tech Leadership Summit Keynote', imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80', caption: 'Speaking on Enterprise Generative AI' },
      { id: 'g2', title: 'Apex Digital Headquarters', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', caption: 'Our Innovation Hub in Hyderabad' }
    ],
    faqs: [
      { question: 'What industries do you specialize in?', answer: 'We specialize in Fintech, HealthTech, Enterprise SaaS, and E-commerce scaling.' },
      { question: 'How can I schedule a consultation call?', answer: 'Fill out the contact form below or connect directly via WhatsApp to book a 30-minute discovery session.' }
    ],
    mapCoordinates: { lat: 17.4483, lng: 78.3808, zoom: 15 },
    confidenceScores: { overall: 98, name: 99, email: 98, phone: 97, company: 99, website: 96, address: 95 },
    viewsCount: 1420,
    qrScansCount: 380,
    leadsCount: 28,
    status: 'published',
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-07-20T14:30:00Z',
    aiChatEnabled: true
  },
  {
    id: 'card-2',
    slug: 'sarah-chen',
    name: 'Sarah Chen',
    title: 'Lead UX/UI & Brand Architect',
    company: 'Lumina Creative Studio',
    tagline: 'Crafting Iconic Digital Brands & Human-Centric Experiences',
    email: 'sarah@luminastudio.co',
    phone: '+1 (415) 890-3412',
    whatsapp: '+14158903412',
    website: 'https://luminastudio.co',
    address: '742 Market St, San Francisco, CA 94103, USA',
    businessCategory: 'Design & Branding',
    logoUrl: '',
    avatarUrl: '',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    cardImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahchendesign',
      instagram: 'https://instagram.com/lumina_design',
      twitter: 'https://twitter.com/sarah_ux'
    },
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    themeStyle: 'creative',
    bio: 'Sarah Chen is an award-winning creative director with a passion for minimalistic aesthetics and intuitive UI systems. Having redesigned products used by over 10M active users, she leads Lumina Studio in creating memorable digital brand identities.',
    services: [
      { id: 's1', title: 'Full Brand Identity System', description: 'Logo design, typography guidelines, brand strategy, color systems, and UI design token setup.', price: '$3,800' },
      { id: 's2', title: 'Mobile & Web App Redesign', description: 'End-to-end UX audit, interactive Figma prototypes, and sleek React Tailwind UI components.', price: '$4,500' }
    ],
    products: [
      { id: 'p1', name: 'Design System Kit 2026', description: 'Component library with 200+ accessible UI elements for Figma and React.', price: '$149', imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80', category: 'Templates' }
    ],
    testimonials: [
      { id: 't1', author: 'Marcus Vance', role: 'CEO', company: 'Vance Real Estate', comment: 'Sarah created a brand identity that instantly resonated with our luxury high-net-worth clients. Absolutely brilliant!', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' }
    ],
    gallery: [
      { id: 'g1', title: 'Neobanking Mobile App Design', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', caption: 'Clean financial dashboard' }
    ],
    faqs: [
      { question: 'How long does a full brand design take?', answer: 'Typical brand design engagements range between 2 to 4 weeks.' }
    ],
    mapCoordinates: { lat: 37.7879, lng: -122.4032, zoom: 15 },
    confidenceScores: { overall: 96, name: 98, email: 97, phone: 96, company: 97, website: 95, address: 92 },
    viewsCount: 980,
    qrScansCount: 210,
    leadsCount: 19,
    status: 'published',
    createdAt: '2026-06-20T12:00:00Z',
    updatedAt: '2026-07-18T16:00:00Z',
    aiChatEnabled: true
  },
  {
    id: 'card-3',
    slug: 'marcus-vance',
    name: 'Marcus Vance',
    title: 'Principal Broker & Luxury Estate Advisor',
    company: 'Vance Luxury Estates',
    tagline: 'Exclusive Properties & High-Yield Real Estate Investments',
    email: 'marcus@vanceluxury.com',
    phone: '+1 (310) 555-0199',
    whatsapp: '+13105550199',
    website: 'https://vanceluxury.com',
    address: '9601 Wilshire Blvd, Beverly Hills, CA 90210',
    businessCategory: 'Real Estate & Properties',
    logoUrl: '',
    avatarUrl: '',
    bannerUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    cardImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/marcusvance',
      instagram: 'https://instagram.com/marcusvance_estates',
      youtube: 'https://youtube.com/vanceluxury'
    },
    primaryColor: '#7c3aed',
    secondaryColor: '#6d28d9',
    themeStyle: 'luxury',
    bio: 'Marcus Vance has closed over $500M in luxury residential transactions across Los Angeles and Miami. Specializing in off-market estates and prime commercial holdings, Marcus delivers tailored acquisition and portfolio growth strategies.',
    services: [
      { id: 's1', title: 'Luxury Estate Representation', description: 'White-glove marketing and buyer representation for properties valued over $5M.', price: 'Commission Based' },
      { id: 's2', title: 'Off-Market Portfolio Sourcing', description: 'Discreet acquisition of high-profile off-market estates and developmental plots.', price: 'Private Advisory' }
    ],
    products: [
      { id: 'p1', name: 'Bel-Air Skyline Villa', description: '6-Bed, 8-Bath Architectural Masterpiece with Infinity Pool & Panoramic Ocean Views.', price: '$18,500,000', imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80', category: 'Listing' }
    ],
    testimonials: [
      { id: 't1', author: 'David Kim', role: 'Managing Partner', company: 'Apex Capital', comment: 'Marcus sourced our Beverly Hills commercial property completely off-market. Unmatched discretion and market knowledge.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' }
    ],
    gallery: [
      { id: 'g1', title: 'Bel-Air Skyline Villa', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', caption: 'Sunset view over infinity pool' }
    ],
    faqs: [
      { question: 'Do you work with international investors?', answer: 'Yes, we manage acquisitions for client portfolios globally with tax and legal advisory partners.' }
    ],
    mapCoordinates: { lat: 34.0669, lng: -118.4004, zoom: 15 },
    confidenceScores: { overall: 99, name: 99, email: 99, phone: 99, company: 98, website: 98, address: 97 },
    viewsCount: 2150,
    qrScansCount: 540,
    leadsCount: 42,
    status: 'published',
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-07-21T11:00:00Z',
    aiChatEnabled: true
  }
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    cardId: 'card-1',
    cardSlug: 'arun-shaw',
    cardOwnerName: 'Arun Shaw',
    name: 'Rajesh Sharma',
    email: 'rajesh.s@techcorp.in',
    phone: '+91 98111 22334',
    message: 'Hi Arun, we need help migrating our monolithic CRM to cloud microservices and implementing a Gemini RAG search assistant.',
    serviceInterest: 'Enterprise AI & LLM Deployment',
    status: 'new',
    createdAt: '2026-07-22T10:15:00Z'
  },
  {
    id: 'lead-2',
    cardId: 'card-1',
    cardSlug: 'arun-shaw',
    cardOwnerName: 'Arun Shaw',
    name: 'Elena Rostova',
    email: 'elena@rostovahealth.com',
    phone: '+1 (212) 555-8900',
    message: 'Interested in the Apex AI Suite trial for document parsing in healthcare workflows.',
    serviceInterest: 'Apex AI Suite',
    status: 'contacted',
    createdAt: '2026-07-21T14:40:00Z'
  },
  {
    id: 'lead-3',
    cardId: 'card-2',
    cardSlug: 'sarah-chen',
    cardOwnerName: 'Sarah Chen',
    name: 'Michael Chang',
    email: 'm.chang@strideventures.com',
    phone: '+1 (415) 300-9122',
    message: 'Looking for a full design refresh for our venture fund portal and brand portfolio.',
    serviceInterest: 'Full Brand Identity System',
    status: 'new',
    createdAt: '2026-07-22T09:05:00Z'
  }
];

// Memory cache layer to protect against ephemeral filesystem wipes on server restarts
let memoryCardsCache: CardProfile[] | null = null;

// Helper functions for filesystem persistence
export function getCards(): CardProfile[] {
  if (memoryCardsCache && memoryCardsCache.length > 0) {
    return memoryCardsCache;
  }
  if (!fs.existsSync(CARDS_FILE)) {
    try {
      fs.writeFileSync(CARDS_FILE, JSON.stringify(INITIAL_CARDS, null, 2));
    } catch (e) {
      console.warn('Could not write INITIAL_CARDS file:', e);
    }
    memoryCardsCache = [...INITIAL_CARDS];
    return INITIAL_CARDS;
  }
  try {
    const raw = fs.readFileSync(CARDS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    memoryCardsCache = parsed;
    return parsed;
  } catch {
    memoryCardsCache = [...INITIAL_CARDS];
    return INITIAL_CARDS;
  }
}

export function saveCards(cards: CardProfile[]): void {
  memoryCardsCache = cards;
  try {
    fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
  } catch (e) {
    console.warn('Could not write cards file to disk:', e);
  }
}

export function getCardBySlug(slug: string): CardProfile {
  const cards = getCards();
  const cleanSlug = slug
    .replace(/^\/*(card\/)*/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .trim();

  const matched = cards.find(
    (c) =>
      c.slug.toLowerCase() === cleanSlug ||
      cleanSlug.startsWith(c.slug.toLowerCase()) ||
      c.slug.toLowerCase().startsWith(cleanSlug)
  );

  if (matched) return matched;

  // Auto-generate profile dynamically so any slug / card page works seamlessly
  const autoCard = generateCardFromSlug(cleanSlug);
  saveCard(autoCard);
  return autoCard;
}

export function getCardById(id: string): CardProfile | undefined {
  const cards = getCards();
  return cards.find((c) => c.id === id);
}

export function saveCard(card: CardProfile): CardProfile {
  const cards = getCards();
  const index = cards.findIndex((c) => c.id === card.id);
  if (index >= 0) {
    cards[index] = { ...card, updatedAt: new Date().toISOString() };
  } else {
    cards.unshift(card);
  }
  saveCards(cards);
  return card;
}

export function deleteCard(idOrSlug: string): boolean {
  const cards = getCards();
  const cleanKey = idOrSlug.toLowerCase().trim();
  const filtered = cards.filter((c) => c.id !== idOrSlug && c.slug.toLowerCase() !== cleanKey);
  if (filtered.length < cards.length) {
    saveCards(filtered);
    return true;
  }
  return false;
}

export function incrementCardMetric(slug: string, metric: 'views' | 'scans'): void {
  const cards = getCards();
  const card = cards.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  if (card) {
    if (metric === 'views') card.viewsCount += 1;
    if (metric === 'scans') card.qrScansCount += 1;
    card.updatedAt = new Date().toISOString();
    saveCards(cards);
    logAnalyticsEvent({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      cardId: card.id,
      eventType: metric === 'views' ? 'page_view' : 'qr_scan',
      device: Math.random() > 0.5 ? 'mobile' : 'desktop',
      location: 'San Francisco, US',
      timestamp: new Date().toISOString()
    });
  }
}

// Leads helpers
export function getLeads(): Lead[] {
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(INITIAL_LEADS, null, 2));
    return INITIAL_LEADS;
  }
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return INITIAL_LEADS;
  }
}

export function saveLeads(leads: Lead[]): void {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

export function addLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead {
  const leads = getLeads();
  const newLead: Lead = {
    ...leadData,
    id: 'lead-' + Date.now(),
    status: 'new',
    createdAt: new Date().toISOString()
  };
  leads.unshift(newLead);
  saveLeads(leads);

  // Update card's lead count
  const card = getCardById(leadData.cardId);
  if (card) {
    card.leadsCount += 1;
    saveCard(card);
  }

  logAnalyticsEvent({
    id: 'evt-' + Date.now(),
    cardId: leadData.cardId,
    eventType: 'lead_submission',
    device: 'mobile',
    location: 'United States',
    timestamp: new Date().toISOString()
  });

  return newLead;
}

export function updateLeadStatus(id: string, status: Lead['status']): Lead | null {
  const leads = getLeads();
  const lead = leads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    saveLeads(leads);
    return lead;
  }
  return null;
}

// Analytics logging
export function logAnalyticsEvent(evt: AnalyticsEvent): void {
  let events: AnalyticsEvent[] = [];
  if (fs.existsSync(ANALYTICS_FILE)) {
    try {
      events = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    } catch {
      events = [];
    }
  }
  events.unshift(evt);
  if (events.length > 500) events = events.slice(0, 500);
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(events, null, 2));
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  if (!fs.existsSync(ANALYTICS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
