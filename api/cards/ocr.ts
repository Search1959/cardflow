import { GoogleGenAI } from '@google/genai';

const PROMPT = `You are an expert OCR and Digital Identity AI system. Analyze this visiting card / business card image.
The image may be a high-resolution file upload, a camera snapshot, or a webcam photo where a person is holding a card in their hand.

YOUR TASK:
1. Locate the visiting card within the image.
2. Read and extract ALL printed text on the card with high precision. If text is tilted, angled, or mirrored (from a front camera), mentally adjust and extract the correct readable text.
3. Extract exact details: Name, Job Title, Company/Organization Name, Email, Phone, WhatsApp, Website, Address, Tagline/Slogan, Business Category, and Brand Primary Hex Color.
4. IMPORTANT: Extract ONLY the text actually printed on the card.
5. CRITICAL: Do NOT invent, fabricate, or hallucinate false data or dummy placeholders like "John Doe", "contact@business.com", "Corporate Enterprise", or "+1 (555) 000-0000".
6. If a specific field is not printed or not visible on the card, set it to an empty string "".

Return ONLY a single valid JSON object matching this structure:
{
  "name": "Exact Printed Name or empty string",
  "title": "Exact Printed Title/Role or empty string",
  "company": "Exact Printed Company Name or empty string",
  "tagline": "Printed tagline or empty string",
  "email": "Exact Printed Email or empty string",
  "phone": "Exact Printed Phone or empty string",
  "whatsapp": "Exact Printed WhatsApp or phone or empty string",
  "website": "Exact Printed Website URL or empty string",
  "address": "Exact Printed Address or empty string",
  "businessCategory": "Categorize appropriately (e.g. 'IT Services & Software', 'Consulting', 'Real Estate', 'Healthcare', 'Legal', 'Services', 'Travel & Tourism', etc.)",
  "socialLinks": {
    "linkedin": "LinkedIn profile URL if printed",
    "twitter": "Twitter/X handle if printed",
    "instagram": "Instagram handle if printed"
  },
  "primaryColor": "Hex color code matching card design e.g. #1e40af",
  "confidenceScores": {
    "overall": 95,
    "name": 95,
    "email": 95,
    "phone": 95,
    "company": 95,
    "website": 90,
    "address": 90
  },
  "suggestedSlug": "lowercase-kebab-case-name-or-company"
}`;

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on Vercel deployment' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '').trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    const name = (parsed.name || '').trim();
    const company = (parsed.company || '').trim();
    const title = (parsed.title || '').trim();
    const email = (parsed.email || '').trim();
    const phone = (parsed.phone || '').trim();

    const slugSource = name || company || 'card-profile';
    const cleanSlug = (parsed.suggestedSlug || slugSource.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');

    return res.json({
      name: name,
      title: title,
      company: company,
      tagline: (parsed.tagline || '').trim(),
      email: email,
      phone: phone,
      whatsapp: (parsed.whatsapp || phone || '').trim(),
      website: (parsed.website || '').trim(),
      address: (parsed.address || '').trim(),
      businessCategory: parsed.businessCategory || 'IT Services & Software',
      socialLinks: parsed.socialLinks || {},
      primaryColor: parsed.primaryColor || '#1d4ed8',
      confidenceScores: parsed.confidenceScores || {
        overall: 90,
        name: name ? 95 : 40,
        email: email ? 95 : 40,
        phone: phone ? 95 : 40,
        company: company ? 95 : 40,
        website: 80,
        address: 80,
      },
      suggestedSlug: cleanSlug,
      rawText: text,
    });
  } catch (err: any) {
    console.error('Vercel OCR Handler Error:', err);
    return res.status(500).json({ error: err.message || 'OCR Extraction failed on server' });
  }
}
