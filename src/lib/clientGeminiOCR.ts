import { OCRResult } from '../types.js';

const PROMPT = `You are an expert OCR, Visual Identity, and Entity Extraction AI system. Analyze this image, which may contain a visiting card, business card, shop signboard, store banner, office plaque, school/institution board, or commercial signage.
The image may be a high-resolution file upload, an outdoor photo, a camera snapshot, or a photo where a person is holding a card or pointing at a sign board.

YOUR TASK:
1. Detect and locate the main entity or subject in the image (visiting card, shop signboard, store banner, office plaque, or business signage).
2. Read and extract ALL printed text with high precision. If text is tilted, angled, outdoors, or mirrored (from a front camera), mentally adjust and extract the correct readable text.
3. Extract exact details into structured fields:
   - "name": Individual's full name if printed, OR the main establishment/school/store/institution name (e.g., "Jayaswal Vidya Mandir" or "Srikrishna Jayaswal Databya Aushadhalay").
   - "title": Individual's job title/designation if printed, OR the subtitle / institution type / department (e.g., "Govt. Sponsored High School for Boys & Girls" or "Databya Aushadhalay").
   - "company": Organization / Company / Establishment / School / Store Name (e.g., "Jayaswal Vidya Mandir" or "Srikrishna Jayaswal Databya Aushadhalay").
   - "tagline": Slogan, motto, operating schedule, or timing (e.g., "Monday to Saturday 6 P.M. to 8 P.M." or "Govt. Sponsored High School").
   - "email": Exact printed email or empty string.
   - "phone": Exact printed phone number(s) or empty string.
   - "whatsapp": Exact printed WhatsApp or phone number or empty string.
   - "website": Exact printed website URL or empty string.
   - "address": Full street address printed on card or sign board (e.g., "172/A, Vivekananda Road, Kolkata - 700 006").
   - "businessCategory": Categorize appropriately (e.g., "Education & Academics", "Healthcare & Medical", "IT Services & Software", "Retail & Storefront", "Consulting", "Real Estate", "Legal", "Services", "Travel & Tourism", etc.).
   - "primaryColor": Hex color code matching card or signboard design (e.g., #1d4ed8, #b91c1c).
   - "suggestedSlug": Lowercase kebab-case slug generated from the name or company/institution.
4. IMPORTANT: Extract ONLY text actually visible in the image.
5. CRITICAL: Do NOT invent, fabricate, or hallucinate false placeholder data like "John Doe" or "+1 555 000 0000". If a field is not printed or visible, set it to an empty string "".

Return ONLY a single valid JSON object matching this structure:
{
  "name": "Exact Printed Name or Establishment Name",
  "title": "Exact Printed Title/Role or Subtitle/Type",
  "company": "Exact Printed Company or Institution Name",
  "tagline": "Printed tagline, slogan, or timings/schedule",
  "email": "Exact Printed Email or empty string",
  "phone": "Exact Printed Phone or empty string",
  "whatsapp": "Exact Printed WhatsApp/phone or empty string",
  "website": "Exact Printed Website URL or empty string",
  "address": "Exact Printed Address or empty string",
  "businessCategory": "Categorize appropriately e.g. Education & Academics, Healthcare & Medical, IT Services & Software, Retail & Storefront, Consulting, etc.",
  "socialLinks": {
    "linkedin": "LinkedIn profile URL if printed",
    "twitter": "Twitter/X handle if printed",
    "instagram": "Instagram handle if printed"
  },
  "primaryColor": "Hex color code matching design e.g. #1e40af",
  "confidenceScores": {
    "overall": 95,
    "name": 95,
    "email": 95,
    "phone": 95,
    "company": 95,
    "website": 90,
    "address": 90
  },
  "suggestedSlug": "lowercase-kebab-case-slug"
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

    const rawName = (parsed.name || '').trim();
    const rawCompany = (parsed.company || '').trim();
    const name = rawName || rawCompany || 'Digital Identity Card';
    const company = rawCompany || rawName || 'Organization';
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
