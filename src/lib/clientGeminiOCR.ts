import { OCRResult } from '../types.js';

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

/**
 * Attempts direct client-side Gemini Vision API OCR call if a Gemini API key is available in client environment
 */
export async function tryDirectClientGeminiOCR(base64Image: string): Promise<OCRResult | null> {
  const metaEnv = (import.meta as any).env || {};
  const apiKey =
    metaEnv.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    return null;
  }

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '').trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
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
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Direct client Gemini API returned status ${res.status}`);
      return null;
    }

    const json = await res.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) return null;

    const cleanText = candidate.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    const name = (parsed.name || '').trim();
    const company = (parsed.company || '').trim();
    const title = (parsed.title || '').trim();
    const email = (parsed.email || '').trim();
    const phone = (parsed.phone || '').trim();

    const slugSource = name || company || 'card-profile';
    const cleanSlug = (parsed.suggestedSlug || slugSource.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');

    return {
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
      rawText: candidate,
    };
  } catch (err) {
    console.warn('Direct client Gemini API OCR failed:', err);
    return null;
  }
}
