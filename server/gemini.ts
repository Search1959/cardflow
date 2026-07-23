import { GoogleGenAI, Type } from '@google/genai';
import { CardProfile, OCRResult } from '../src/types.js';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Perform multi-modal OCR extraction on an uploaded visiting card photo.
 */
export async function extractCardDataFromImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<OCRResult> {
  const ai = getGeminiClient();

  const prompt = `You are an expert OCR and Digital Identity AI system. Analyze this visiting card image in detail.
Look carefully at all text on the card regardless of lighting, angle, or if someone is holding the card.
Extract all printed contact details, company information, job title, social handles, addresses, and primary branding color.

Return ONLY a single valid JSON object matching this structure:
{
  "name": "Extracted Full Name",
  "title": "Extracted Job Title or Role",
  "company": "Extracted Company / Organization Name",
  "tagline": "Extracted Tagline or Slogan if present",
  "email": "Extracted Email Address",
  "phone": "Extracted Phone or Mobile Number",
  "whatsapp": "Extracted WhatsApp number or phone number",
  "website": "Extracted Website URL starting with https:// or http://",
  "address": "Extracted Physical Business Address",
  "businessCategory": "Categorize appropriately (e.g. 'IT Services & Software', 'Consulting', 'Real Estate', 'Healthcare', 'Legal', 'Manufacturing', 'Retail', 'Education', 'Services')",
  "socialLinks": {
    "linkedin": "LinkedIn profile/company URL if printed",
    "twitter": "Twitter/X handle or URL if printed",
    "instagram": "Instagram handle or URL if printed",
    "github": "GitHub profile if printed"
  },
  "primaryColor": "Hex color code matching card branding e.g. #1e40af",
  "confidenceScores": {
    "overall": 95,
    "name": 95,
    "email": 95,
    "phone": 95,
    "company": 95,
    "website": 90,
    "address": 90
  },
  "suggestedSlug": "lowercase-kebab-case-name"
}

IMPORTANT RULES:
1. Extract the EXACT text printed on the card. Do NOT invent generic placeholder text like "Card Holder", "John Doe", or "Global Innovations".
2. If a field is not present on the card, set it to an empty string "".
3. Ensure phone numbers, email addresses, and names are extracted accurately from the image.`;

  // Strip base64 prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '').trim();
  const validMime = mimeType && mimeType.includes('/') ? mimeType : 'image/jpeg';

  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: validMime,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '{}';
        let cleanText = text.trim();

        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?/gi, '').replace(/```$/g, '').trim();
        }
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanText = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanText);

        const name = parsed.name || 'Card Profile';
        const company = parsed.company || 'Business Identity';
        const email = parsed.email || '';
        const phone = parsed.phone || '';

        return {
          name: name,
          title: parsed.title || '',
          company: company,
          tagline: parsed.tagline || '',
          email: email,
          phone: phone,
          whatsapp: parsed.whatsapp || phone,
          website: parsed.website || '',
          address: parsed.address || '',
          businessCategory: parsed.businessCategory || 'Business Services',
          socialLinks: parsed.socialLinks || {},
          primaryColor: parsed.primaryColor || '#2563eb',
          confidenceScores: parsed.confidenceScores || {
            overall: 90,
            name: name ? 95 : 50,
            email: email ? 95 : 50,
            phone: phone ? 95 : 50,
            company: company ? 95 : 50,
            website: 80,
            address: 80,
          },
          suggestedSlug: (parsed.suggestedSlug || (name || 'profile').toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, ''),
          rawText: text,
        };
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');

        if (isQuota) {
          // Wait 3 seconds before next attempt
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          // Break attempt loop to try next model if it wasn't a rate limit
          break;
        }
      }
    }
  }

  // Format clean error message if all retries failed
  const errStr = lastError?.message || String(lastError);
  if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota exceeded')) {
    throw new Error('Gemini AI API rate limit reached (Free Quota Exceeded). Please wait ~15-20 seconds and click "Extract Contact Info" again, or fill in card details manually.');
  }

  throw new Error(`Failed to extract card details: ${errStr}`);
}

/**
 * Generate AI Biography for profile
 */
export async function generateProfileBio(cardData: Partial<CardProfile>): Promise<string> {
  const ai = getGeminiClient();
  const prompt = `Write a polished, professional 2-paragraph executive biography for a digital identity profile page.
Name: ${cardData.name}
Title: ${cardData.title}
Company: ${cardData.company}
Business Category: ${cardData.businessCategory}
Tagline: ${cardData.tagline || ''}

The bio should highlight key leadership strengths, strategic vision, commitment to client success, and industry impact. Write in 3rd person. Do not include markdown headers or greetings.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });
    return response.text?.trim() || `${cardData.name} is an experienced ${cardData.title} at ${cardData.company}.`;
  } catch (err) {
    console.error('Bio generation error:', err);
    return `${cardData.name} is a dedicated ${cardData.title} at ${cardData.company}, specializing in ${cardData.businessCategory}.`;
  }
}

/**
 * Enrich card with AI generated products, services, FAQs, and taglines based on company/website
 */
export async function enrichCompanyDetails(card: CardProfile): Promise<Partial<CardProfile>> {
  const ai = getGeminiClient();
  const prompt = `You are a corporate branding and marketing consultant AI.
Enrich the digital profile for:
Name: ${card.name}
Title: ${card.title}
Company: ${card.company}
Website: ${card.website}
Category: ${card.businessCategory}

Generate the following in JSON format:
{
  "tagline": "Catchy 6-10 word value proposition tagline",
  "bio": "2 paragraph executive summary",
  "suggestedServices": [
    { "title": "Service Name 1", "description": "Concise service summary", "price": "e.g. Starting at $500" },
    { "title": "Service Name 2", "description": "Concise service summary", "price": "Custom Quote" }
  ],
  "suggestedProducts": [
    { "name": "Product 1", "description": "Key feature description", "price": "$199", "category": "Core Product" }
  ],
  "faqs": [
    { "question": "Frequently asked question 1?", "answer": "Clear professional answer." },
    { "question": "Frequently asked question 2?", "answer": "Clear professional answer." }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text || '{}');
    return {
      tagline: parsed.tagline || card.tagline,
      bio: parsed.bio || card.bio,
      services: parsed.suggestedServices
        ? parsed.suggestedServices.map((s: any, idx: number) => ({ ...s, id: 's-enrich-' + idx }))
        : card.services,
      products: parsed.suggestedProducts
        ? parsed.suggestedProducts.map((p: any, idx: number) => ({ ...p, id: 'p-enrich-' + idx }))
        : card.products,
      faqs: parsed.faqs || card.faqs,
    };
  } catch (err) {
    console.error('Enrichment error:', err);
    return {};
  }
}

/**
 * AI Chatbot for Profile trained strictly on Card Profile details
 */
export async function chatWithCardAI(card: CardProfile, userMessage: string, history: { role: string; text: string }[] = []): Promise<string> {
  const ai = getGeminiClient();

  const systemInstruction = `You are the official AI Assistant for ${card.name}, ${card.title} at ${card.company}.
You represent ${card.name} on their public digital profile (/card/${card.slug}).
Answer visitors' questions accurately, professionally, and politely based STRICTLY on the information below:

Owner Name: ${card.name}
Role/Title: ${card.title}
Company: ${card.company}
Tagline: ${card.tagline || 'N/A'}
Email: ${card.email}
Phone: ${card.phone}
WhatsApp: ${card.whatsapp || card.phone}
Website: ${card.website}
Address: ${card.address}
Category: ${card.businessCategory}

Biography:
${card.bio}

Services Offered:
${card.services.map((s) => `- ${s.title}: ${s.description} (${s.price || 'Contact for pricing'})`).join('\n')}

Products Offered:
${card.products.map((p) => `- ${p.name}: ${p.description} - Price: ${p.price}`).join('\n')}

Frequently Asked Questions:
${card.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n')}

INSTRUCTIONS:
1. Speak warmly in the 1st person or on behalf of ${card.name} ("Thank you for reaching out! I can certainly help you with...").
2. Encourage the user to leave a message in the contact form or download the vCard if they want to collaborate or book a service.
3. If asked about something outside the profile information, politely state that you can take their message through the contact form or connect them via WhatsApp (${card.whatsapp || card.phone}).`;

  try {
    const formattedHistory = history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      config: {
        systemInstruction,
      },
    });

    return response.text || `Thank you for asking! Please feel free to reach out to ${card.name} directly at ${card.email} or submit a inquiry below.`;
  } catch (err) {
    console.error('AI Profile Chat error:', err);
    return `Hello! I'm ${card.name}'s virtual assistant. You can reach out directly via email at ${card.email} or WhatsApp at ${card.whatsapp || card.phone}. How else can I assist you?`;
  }
}

/**
 * AI Multilingual Translation for Public Profile Page
 */
export async function translateProfileContent(card: CardProfile, targetLanguage: string): Promise<Partial<CardProfile>> {
  const ai = getGeminiClient();
  const prompt = `Translate the text fields of this digital business profile into ${targetLanguage}.
Keep proper names, phone numbers, and URLs unchanged.

Input fields:
- tagline: "${card.tagline || ''}"
- bio: "${card.bio}"
- services: ${JSON.stringify(card.services.map((s) => ({ id: s.id, title: s.title, description: s.description, price: s.price })))}
- products: ${JSON.stringify(card.products.map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price })))}
- faqs: ${JSON.stringify(card.faqs)}

Return JSON with translated fields matching the schema:
{
  "tagline": "translated tagline",
  "bio": "translated bio",
  "services": [{ "id": "s1", "title": "...", "description": "...", "price": "..." }],
  "products": [{ "id": "p1", "name": "...", "description": "...", "price": "..." }],
  "faqs": [{ "question": "...", "answer": "..." }]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text || '{}');
    return {
      tagline: parsed.tagline || card.tagline,
      bio: parsed.bio || card.bio,
      services: parsed.services || card.services,
      products: parsed.products || card.products,
      faqs: parsed.faqs || card.faqs,
    };
  } catch (err) {
    console.error('Translation error:', err);
    return {};
  }
}
