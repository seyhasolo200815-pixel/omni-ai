import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

function formatGeminiError(err: any): string {
  const raw = err?.message || String(err || '');

  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'កូតាឥតគិតថ្លៃ (Free Tier Quota) របស់គណនី Gemini បានដល់កម្រិតកំណត់ (Rate Limit)។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។';
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
    return 'Google Gemini API Key មិនត្រឹមត្រូវឡើយ។ សូមពិនិត្យមើល API Key របស់អ្នកម្តងទៀតក្នុង Settings > Secrets។';
  }
  return raw.replace(/[\n\r]+/g, ' ').slice(0, 300) || 'មានបញ្ហាក្នុងការបង្កើតរូបភាព។';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    return res.status(500).json({
      error: true,
      message: 'Google Gemini API Key មិនទាន់ត្រូវបានកំណត់ឡើយ។',
    });
  }

  const { prompt, aspectRatio = '1:1', style = 'realistic', highQuality = false } = req.body || {};

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: true, message: 'សូមបញ្ចូលការពិពណ៌នារូបភាព (Prompt)។' });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const model = highQuality ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite-image';
  let styledPrompt = String(prompt).trim();
  if (style === 'cinematic') styledPrompt += ', cinematic lighting, 8k resolution, dramatic atmosphere';
  else if (style === 'anime') styledPrompt += ', beautiful anime illustration, vibrant colors';
  else if (style === '3d') styledPrompt += ', 3D render, octane render, soft lighting';
  else if (style === 'cyberpunk') styledPrompt += ', cyberpunk neon lights, futuristic city';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: styledPrompt }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any } },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    if (!imageUrl) {
      throw new Error('មិនបានទទួលរូបភាពពី Gemini API ឡើយ។');
    }

    return res.json({
      success: true,
      imageUrl,
      prompt: String(prompt).trim(),
      aspectRatio,
      model,
    });
  } catch (err: any) {
    return res.status(500).json({ error: true, message: formatGeminiError(err) });
  }
}
