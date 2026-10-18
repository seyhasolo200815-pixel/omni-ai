import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  const { operationName } = req.body || {};
  if (!operationName) {
    return res.status(400).json({ error: true, message: 'Operation name required' });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  try {
    const updated = await ai.operations.getVideosOperation({ operation: { name: operationName } as any });
    return res.json({ done: updated.done, error: updated.error });
  } catch (err: any) {
    return res.status(500).json({ error: true, message: err?.message || 'Error checking video status' });
  }
}
