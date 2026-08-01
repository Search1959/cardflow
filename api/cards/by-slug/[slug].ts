import { INITIAL_CARDS } from '../../../src/lib/initialCards.js';
import { generateCardFromSlug } from '../../../src/lib/globalSync.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const slugParam = (req.query?.slug as string) || '';
  if (!slugParam) {
    return res.status(400).json({ error: 'Slug parameter is required' });
  }

  const cleanSlug = slugParam
    .replace(/^\/*(card\/)*/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .trim();

  // Match initial sample cards first
  const matched = INITIAL_CARDS.find(
    (c) =>
      c.slug.toLowerCase() === cleanSlug ||
      cleanSlug.startsWith(c.slug.toLowerCase()) ||
      c.slug.toLowerCase().startsWith(cleanSlug)
  );

  if (matched) {
    return res.status(200).json(matched);
  }

  // Fallback auto-generated rich card profile for any custom slug
  const autoCard = generateCardFromSlug(cleanSlug);
  return res.status(200).json(autoCard);
}
