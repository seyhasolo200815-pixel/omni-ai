import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

function formatGeminiError(err: any): string {
  const raw = err?.message || String(err || '');
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'កូតាឥតគិតថ្លៃ (Free Tier Quota) របស់គណនី Gemini បានដល់កម្រិតកំណត់ (Rate Limit)។';
  }
  return raw.replace(/[\n\r]+/g, ' ').slice(0, 300) || 'មានបញ្ហាក្នុងការបង្កើតវីដេអូ។';
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

  const { prompt, aspectRatio = '16:9', resolution = '720p', imageBytes, mimeType = 'image/png' } = req.body || {};

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  try {
    const payload: any = {
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt || 'A cinematic scene',
      config: {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    };

    if (imageBytes) {
      payload.image = { imageBytes, mimeType };
    }

    const operation = await ai.models.generateVideos(payload);
    return res.json({
      success: true,
      operationName: operation.name,
      prompt,
      aspectRatio,
      resolution,
    });
  } catch (err: any) {
    return res.status(500).json({ error: true, message: formatGeminiError(err) });
  }
}
