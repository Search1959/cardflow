export interface BannerPreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'tech-code',
    name: 'Tech & Software AI',
    category: 'IT Services & Software',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tech-circuit',
    name: 'Cloud & Infrastructure',
    category: 'IT Services & Software',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'creative-liquid',
    name: 'Creative Studio & Design',
    category: 'Design & Branding',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'real-estate-sky',
    name: 'Real Estate & Architecture',
    category: 'Real Estate & Properties',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'finance-corporate',
    name: 'Finance & Legal Advisory',
    category: 'Legal & Advisory',
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'healthcare-blue',
    name: 'Healthcare & Medical',
    category: 'Healthcare & Wellness',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'marketing-stage',
    name: 'Marketing & Events',
    category: 'Marketing & Advertising',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'education-library',
    name: 'Education & Research',
    category: 'Education & Training',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'restaurant-cozy',
    name: 'Food & Hospitality',
    category: 'Food, Dining & Hospitality',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'industrial-engineering',
    name: 'Manufacturing & Industry',
    category: 'Manufacturing & Industrial',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'executive-gradient',
    name: 'Executive Dark Blue',
    category: 'Executive',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
  },
];

export function getBannerForCategory(category?: string, title?: string): string {
  if (!category && !title) {
    return BANNER_PRESETS[0].url;
  }

  const catLower = (category || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  if (catLower.includes('software') || catLower.includes('it') || catLower.includes('tech') || titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('cto')) {
    return BANNER_PRESETS[0].url;
  }
  if (catLower.includes('design') || catLower.includes('branding') || catLower.includes('art') || titleLower.includes('designer') || titleLower.includes('creative')) {
    return BANNER_PRESETS[2].url;
  }
  if (catLower.includes('estate') || catLower.includes('property') || catLower.includes('architect') || titleLower.includes('realtor') || titleLower.includes('architect')) {
    return BANNER_PRESETS[3].url;
  }
  if (catLower.includes('legal') || catLower.includes('advisory') || catLower.includes('finance') || catLower.includes('consult') || titleLower.includes('lawyer') || titleLower.includes('advocate')) {
    return BANNER_PRESETS[4].url;
  }
  if (catLower.includes('health') || catLower.includes('medical') || catLower.includes('wellness') || titleLower.includes('doctor') || titleLower.includes('physician')) {
    return BANNER_PRESETS[5].url;
  }
  if (catLower.includes('market') || catLower.includes('event') || catLower.includes('media')) {
    return BANNER_PRESETS[6].url;
  }
  if (catLower.includes('educat') || catLower.includes('school') || catLower.includes('train')) {
    return BANNER_PRESETS[7].url;
  }
  if (catLower.includes('food') || catLower.includes('dining') || catLower.includes('hotel') || catLower.includes('restaurant') || catLower.includes('chef')) {
    return BANNER_PRESETS[8].url;
  }
  if (catLower.includes('manufactur') || catLower.includes('industrial') || catLower.includes('auto')) {
    return BANNER_PRESETS[9].url;
  }

  return BANNER_PRESETS[10].url;
}
