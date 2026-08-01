export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  icon?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  category?: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  company: string;
  comment: string;
  rating: number;
  avatarUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  caption?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ConfidenceScore {
  overall: number;
  name: number;
  email: number;
  phone: number;
  company: number;
  website: number;
  address: number;
}

export interface CardProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  company: string;
  tagline?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  businessCategory: string;
  logoUrl?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  cardImageUrl?: string; // Original uploaded card image
  socialLinks: SocialLinks;
  primaryColor: string; // e.g. #2563eb
  secondaryColor: string; // e.g. #1e40af
  themeStyle: 'modern' | 'executive' | 'creative' | 'minimal' | 'luxury';
  bio: string;
  services: ServiceItem[];
  products: ProductItem[];
  testimonials: TestimonialItem[];
  gallery: GalleryItem[];
  faqs: FAQItem[];
  mapCoordinates?: {
    lat: number;
    lng: number;
    zoom: number;
  };
  confidenceScores: ConfidenceScore;
  viewsCount: number;
  qrScansCount: number;
  leadsCount: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
  aiChatEnabled: boolean;
}

export interface Lead {
  id: string;
  cardId: string;
  cardSlug: string;
  cardOwnerName: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  serviceInterest?: string;
  status: 'new' | 'contacted' | 'qualified' | 'archived';
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  cardId: string;
  eventType: 'page_view' | 'qr_scan' | 'vcard_download' | 'contact_click' | 'lead_submission';
  device: 'mobile' | 'desktop' | 'tablet';
  location: string;
  timestamp: string;
}

export interface OCRResult {
  name: string;
  title: string;
  company: string;
  tagline?: string;
  bio?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  businessCategory: string;
  socialLinks: SocialLinks;
  primaryColor: string;
  confidenceScores: ConfidenceScore;
  suggestedSlug: string;
  rawText?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
