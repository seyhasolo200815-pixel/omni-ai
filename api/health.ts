export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.API_KEY);
  res.status(200).json({
    status: 'ok',
    hasApiKey: hasKey,
    platform: 'vercel',
  });
}
