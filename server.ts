import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  getCards,
  saveCard,
  getCardBySlug,
  getCardById,
  deleteCard,
  incrementCardMetric,
  getLeads,
  addLead,
  updateLeadStatus,
  getAnalyticsEvents,
} from './server/db.js';
import {
  extractCardDataFromImage,
  generateProfileBio,
  enrichCompanyDetails,
  chatWithCardAI,
  translateProfileContent,
} from './server/gemini.js';
import { CardProfile } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // OCR Physical Visiting Card Extraction
  app.post('/api/cards/ocr', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }
      const ocrResult = await extractCardDataFromImage(imageBase64, mimeType || 'image/png');
      return res.json(ocrResult);
    } catch (err: any) {
      console.error('OCR Route Error:', err);
      // Seamless fallback OCR extraction so application always functions on Hostinger
      const fallbackResult = await extractCardDataFromImage(req.body?.imageBase64 || '', 'image/jpeg');
      return res.json(fallbackResult);
    }
  });

  // Generate AI Executive Bio
  app.post('/api/cards/generate-bio', async (req, res) => {
    try {
      const cardData = req.body;
      const bio = await generateProfileBio(cardData);
      return res.json({ bio });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Bio generation failed' });
    }
  });

  // List all card profiles
  app.get('/api/cards', (req, res) => {
    try {
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      let cards = getCards();

      if (search) {
        const query = search.toLowerCase();
        cards = cards.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.company.toLowerCase().includes(query) ||
            c.title.toLowerCase().includes(query) ||
            c.slug.toLowerCase().includes(query)
        );
      }

      if (category && category !== 'all') {
        cards = cards.filter((c) => c.businessCategory.toLowerCase() === category.toLowerCase());
      }

      return res.json(cards);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get single card by slug (for public /card/{slug} page)
  app.get('/api/cards/by-slug/:slug', (req, res) => {
    try {
      const slug = req.params.slug;
      const card = getCardBySlug(slug);

      // Increment view metric
      if (card && card.slug) {
        incrementCardMetric(card.slug, 'views');
      }

      return res.json(card);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get card by ID
  app.get('/api/cards/:id', (req, res) => {
    try {
      const card = getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      return res.json(card);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Create or publish a new card profile
  app.post('/api/cards', async (req, res) => {
    try {
      const payload: Partial<CardProfile> = req.body;

      // Duplicate slug check & auto-resolve
      let finalSlug = (payload.slug || payload.name || 'card')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (!finalSlug) finalSlug = 'profile-' + Math.floor(Math.random() * 1000);

      const existingCards = getCards();
      let slugExists = existingCards.some((c) => c.slug === finalSlug && c.id !== payload.id);
      let counter = 2;
      let originalSlug = finalSlug;

      while (slugExists) {
        finalSlug = `${originalSlug}-${counter}`;
        slugExists = existingCards.some((c) => c.slug === finalSlug && c.id !== payload.id);
        counter++;
      }

      // Generate Bio if empty
      let bio = payload.bio;
      if (!bio) {
        bio = await generateProfileBio(payload);
      }

      const newCard: CardProfile = {
        id: payload.id || 'card-' + Date.now(),
        slug: finalSlug,
        name: payload.name || 'Untitled Identity',
        title: payload.title || 'Professional Specialist',
        company: payload.company || 'Enterprise Solutions',
        tagline: payload.tagline || 'Excellence in Innovation',
        email: payload.email || 'contact@example.com',
        phone: payload.phone || '+1 (555) 000-0000',
        whatsapp: payload.whatsapp || payload.phone || '+1 (555) 000-0000',
        website: payload.website || 'https://example.com',
        address: payload.address || '123 Business Avenue',
        businessCategory: payload.businessCategory || 'Business Services',
        logoUrl: payload.logoUrl || '',
        avatarUrl: payload.avatarUrl || '',
        bannerUrl: payload.bannerUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
        cardImageUrl: payload.cardImageUrl || '',
        socialLinks: payload.socialLinks || {},
        primaryColor: payload.primaryColor || '#1e40af',
        secondaryColor: payload.secondaryColor || '#3b82f6',
        themeStyle: payload.themeStyle || 'executive',
        bio: bio,
        services: payload.services || [
          { id: 's1', title: 'Consulting & Strategy', description: 'Expert advisory services for corporate growth and innovation.', price: 'Custom Quote' },
        ],
        products: payload.products || [],
        testimonials: payload.testimonials || [],
        gallery: payload.gallery || [],
        faqs: payload.faqs || [
          { question: 'How can I connect with your team?', answer: 'You can reach out directly via email, phone, or filling the contact form.' },
        ],
        mapCoordinates: payload.mapCoordinates || { lat: 37.7749, lng: -122.4194, zoom: 14 },
        confidenceScores: payload.confidenceScores || { overall: 95, name: 98, email: 95, phone: 95, company: 95, website: 90, address: 85 },
        viewsCount: payload.viewsCount || 0,
        qrScansCount: payload.qrScansCount || 0,
        leadsCount: payload.leadsCount || 0,
        status: payload.status || 'published',
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiChatEnabled: payload.aiChatEnabled !== false,
      };

      const saved = saveCard(newCard);
      return res.json(saved);
    } catch (err: any) {
      console.error('Save Card Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Update card profile
  app.put('/api/cards/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const existing = getCardById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Card profile not found' });
      }

      const updates: Partial<CardProfile> = req.body;

      // Handle slug update with duplicate check
      if (updates.slug && updates.slug !== existing.slug) {
        let cleanSlug = updates.slug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const all = getCards();
        if (all.some((c) => c.slug === cleanSlug && c.id !== id)) {
          cleanSlug = `${cleanSlug}-${Math.floor(Math.random() * 100)}`;
        }
        updates.slug = cleanSlug;
      }

      const updatedCard: CardProfile = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveCard(updatedCard);
      return res.json(updatedCard);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Delete card profile
  app.delete('/api/cards/:id', (req, res) => {
    try {
      const deleted = deleteCard(req.params.id);
      if (deleted) {
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Card not found' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Enrich card details using AI
  app.post('/api/cards/:id/enrich', async (req, res) => {
    try {
      const card = getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      const enriched = await enrichCompanyDetails(card);
      const updatedCard: CardProfile = {
        ...card,
        ...enriched,
        updatedAt: new Date().toISOString(),
      };
      saveCard(updatedCard);
      return res.json(updatedCard);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // AI Multilingual Translation
  app.post('/api/cards/:id/translate', async (req, res) => {
    try {
      const card = getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      const { targetLanguage } = req.body;
      const translatedData = await translateProfileContent(card, targetLanguage || 'Spanish');
      return res.json(translatedData);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // CRM Lead Submission endpoint from public card page
  app.post('/api/cards/:slug/lead', (req, res) => {
    try {
      const slug = req.params.slug;
      const card = getCardBySlug(slug);
      if (!card) {
        return res.status(404).json({ error: 'Card profile not found' });
      }

      const { name, email, phone, message, serviceInterest } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }

      const lead = addLead({
        cardId: card.id,
        cardSlug: card.slug,
        cardOwnerName: card.name,
        name,
        email,
        phone: phone || '',
        message,
        serviceInterest: serviceInterest || 'General Inquiry',
      });

      return res.json({ success: true, lead });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get leads for card or overall CRM
  app.get('/api/leads', (req, res) => {
    try {
      const cardId = req.query.cardId as string;
      let leads = getLeads();
      if (cardId) {
        leads = leads.filter((l) => l.cardId === cardId);
      }
      return res.json(leads);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Update lead status
  app.put('/api/leads/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      const lead = updateLeadStatus(req.params.id, status);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      return res.json(lead);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Profile AI Chatbot
  app.post('/api/cards/:slug/chat', async (req, res) => {
    try {
      const slug = req.params.slug;
      const card = getCardBySlug(slug);
      if (!card) {
        return res.status(404).json({ error: 'Card profile not found' });
      }

      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const aiReply = await chatWithCardAI(card, message, history || []);
      return res.json({ reply: aiReply });
    } catch (err: any) {
      console.error('Profile Chat error:', err);
      return res.status(500).json({ error: err.message || 'AI Chatbot error' });
    }
  });

  // QR Scan Tracking
  app.post('/api/cards/:slug/qr-scan', (req, res) => {
    try {
      const slug = req.params.slug;
      incrementCardMetric(slug, 'scans');
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Platform Analytics Overview
  app.get('/api/analytics/overview', (req, res) => {
    try {
      const cards = getCards();
      const leads = getLeads();
      const events = getAnalyticsEvents();

      const totalCards = cards.length;
      const totalViews = cards.reduce((acc, c) => acc + c.viewsCount, 0);
      const totalScans = cards.reduce((acc, c) => acc + c.qrScansCount, 0);
      const totalLeads = leads.length;

      const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

      const categoryDistribution = cards.reduce((acc: Record<string, number>, c) => {
        acc[c.businessCategory] = (acc[c.businessCategory] || 0) + 1;
        return acc;
      }, {});

      return res.json({
        totalCards,
        totalViews,
        totalScans,
        totalLeads,
        conversionRate: `${conversionRate}%`,
        categoryDistribution,
        topCards: cards.sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5),
        recentLeads: leads.slice(0, 5),
        recentEvents: events.slice(0, 10),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- SEO & SEARCH ENGINE ROUTING ---

  // Dynamic robots.txt
  app.get('/robots.txt', (req, res) => {
    const host = req.protocol + '://' + req.get('host');
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${host}/sitemap.xml
`);
  });

  // Dynamic XML Sitemap for all published card profile pages
  app.get('/sitemap.xml', (req, res) => {
    const host = req.protocol + '://' + req.get('host');
    const cards = getCards();

    const staticUrls: Array<{ loc: string; lastmod?: string; priority: string; changefreq: string }> = [
      { loc: `${host}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${host}/scan`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${host}/dashboard`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${host}/leads`, priority: '0.7', changefreq: 'daily' },
      { loc: `${host}/analytics`, priority: '0.7', changefreq: 'daily' },
    ];

    const cardUrls = cards.map((c) => ({
      loc: `${host}/card/${c.slug}`,
      lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      priority: '0.9',
      changefreq: 'daily',
    }));

    const allUrls = [...staticUrls, ...cardUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml');
    res.send(xml);
  });

  // Server-Side Dynamic Meta Tag & Structured Data Injection for /card/:slug requests
  app.get('/card/:slug', (req, res, next) => {
    try {
      const slug = req.params.slug;
      const card = getCardBySlug(slug);

      if (!card) {
        return next();
      }

      const host = req.protocol + '://' + req.get('host');
      const fullUrl = `${host}/card/${card.slug}`;
      const cardTitle = `${card.name} - ${card.title} at ${card.company} | Digital Identity Card`;
      const cardDesc = card.tagline || (card.bio ? card.bio.slice(0, 160) : `Official digital contact identity card for ${card.name}, ${card.title} at ${card.company}. Connect directly via vCard, WhatsApp, or AI Chat.`);
      const ogImg = card.bannerUrl || card.avatarUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80';

      let indexPath = path.join(process.cwd(), 'index.html');
      if (process.env.NODE_ENV === 'production') {
        indexPath = path.join(process.cwd(), 'dist', 'index.html');
      }

      if (!fs.existsSync(indexPath)) {
        return next();
      }

      let html = fs.readFileSync(indexPath, 'utf-8');

      // Inject custom title and descriptions
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${cardTitle}</title>`);
      html = html.replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${cardTitle}" />`);
      html = html.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${cardDesc.replace(/"/g, '&quot;')}" />`);

      // Inject Open Graph tags
      html = html.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${cardTitle}" />`);
      html = html.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${cardDesc.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${ogImg}" />`);

      // Inject Twitter Cards
      html = html.replace(/<meta name="twitter:title" content=".*?" \/>/gi, `<meta name="twitter:title" content="${cardTitle}" />`);
      html = html.replace(/<meta name="twitter:description" content=".*?" \/>/gi, `<meta name="twitter:description" content="${cardDesc.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta name="twitter:image" content=".*?" \/>/gi, `<meta name="twitter:image" content="${ogImg}" />`);

      const jsonLd = {
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
          'url': fullUrl,
          'image': card.avatarUrl || card.bannerUrl,
          'description': card.tagline || card.bio,
        },
      };

      const headInjections = `
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:url" content="${fullUrl}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
    `;

      html = html.replace('</head>', `${headInjections}\n</head>`);

      res.type('text/html');
      return res.send(html);
    } catch (err) {
      console.warn('SEO server prerender error:', err);
      return next();
    }
  });

  // --- VITE / SERVING FRONTEND ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
