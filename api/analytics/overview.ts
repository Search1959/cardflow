import { INITIAL_CARDS } from '../../src/lib/initialCards.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const totalCards = INITIAL_CARDS.length;
  const totalViews = INITIAL_CARDS.reduce((acc, c) => acc + c.viewsCount, 0);
  const totalScans = INITIAL_CARDS.reduce((acc, c) => acc + c.qrScansCount, 0);
  const totalLeads = 32;

  return res.status(200).json({
    totalCards,
    totalViews,
    totalScans,
    totalLeads,
    conversionRate: '4.8%',
    categoryDistribution: {
      'IT Services & Software': 1,
      'Design & Branding': 1,
      'Real Estate & Properties': 1,
      'Finance & Venture Capital': 1,
    },
    topCards: INITIAL_CARDS,
    recentLeads: [],
    recentEvents: [],
  });
}
