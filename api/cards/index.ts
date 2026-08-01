import { INITIAL_CARDS } from '../../src/lib/initialCards.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const search = ((req.query?.search as string) || '').toLowerCase();
    const category = ((req.query?.category as string) || '').toLowerCase();

    let cards = INITIAL_CARDS;
    if (search) {
      cards = cards.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.company.toLowerCase().includes(search) ||
          c.title.toLowerCase().includes(search) ||
          c.slug.toLowerCase().includes(search)
      );
    }
    if (category && category !== 'all') {
      cards = cards.filter((c) => c.businessCategory.toLowerCase() === category);
    }

    return res.status(200).json(cards);
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    let finalSlug = (payload.slug || payload.name || 'card')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!finalSlug) finalSlug = 'profile-' + Date.now();

    const newCard = {
      ...payload,
      id: payload.id || 'card-' + Date.now(),
      slug: finalSlug,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json(newCard);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
