import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to format Gemini API errors into clean, friendly single-line messages in Khmer
function formatGeminiError(err: any): string {
  const raw = err?.message || String(err || '');

  if (
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('Quota exceeded')
  ) {
    return 'កូតាឥតគិតថ្លៃ (Free Tier Quota) របស់គណនី Gemini សម្រាប់ម៉ូដែលនេះបានដល់កម្រិតកំណត់ (Rate Limit)។ សូមប្តូរទៅម៉ូដែល "3.5 Flash-Lite" នៅលើ Header ឬព្យាយាមម្តងទៀតនៅពេលក្រោយ។';
  }

  if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
    return 'Google Gemini API Key មិនត្រឹមត្រូវឡើយ។ សូមពិនិត្យមើល API Key របស់អ្នកម្តងទៀតក្នុង Settings > Secrets។';
  }

  if (raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
    return 'គណនីរបស់អ្នកមិនមានសិទ្ធិចូលប្រើប្រាស់ម៉ូដែលនេះទេ (ទាមទារ Billing / Paid tier លើ Google Cloud Console)។';
  }

  // Attempt to parse nested JSON error if present
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return String(parsed.error.message).replace(/[\n\r]+/g, ' ').slice(0, 300);
    }
  } catch {}

  return (
    raw.replace(/[\n\r]+/g, ' ').slice(0, 300) ||
    'មានបញ្ហាក្នុងការទាក់ទងទៅ Google Gemini API។ សូមព្យាយាមម្តងទៀត។'
  );
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  // CORS middleware for iframe, preview, and production Cloud Run domains
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));

  // Environment Variable Check: supports GEMINI_API_KEY, API_KEY, GOOGLE_API_KEY, etc.
  const getApiKey = () =>
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  // Shared Gemini client instance
  const getAiClient = () => {
    const key = getApiKey();
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const hasKey = !!getApiKey();
    res.json({
      status: 'ok',
      hasApiKey: hasKey,
      env: process.env.NODE_ENV || 'development',
      port,
    });
  });

  // ----------------------------------------------------
  // 1. Image Generation Endpoint (gemini-3.1-flash-lite-image)
  // ----------------------------------------------------
  app.post('/api/generate-image', async (req, res) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: true,
        message: 'Google Gemini API Key មិនទាន់ត្រូវបានកំណត់នៅក្នុង Environment Variables ឡើយ។',
      });
    }

    const {
      prompt,
      aspectRatio = '1:1',
      style = 'realistic',
      highQuality = false,
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: true,
        message: 'សូមបញ្ចូលការពិពណ៌នារូបភាព (Prompt) ដែលអ្នកចង់បង្កើត។',
      });
    }

    const ai = getAiClient();
    const model = highQuality ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite-image';

    // Enhance prompt with style cue if requested
    let styledPrompt = prompt.trim();
    if (style === 'cinematic') {
      styledPrompt += ', cinematic lighting, 8k resolution, dramatic atmosphere, photorealistic film still';
    } else if (style === 'anime') {
      styledPrompt += ', beautiful anime aesthetic, vibrant colors, detailed illustration, studio ghibli style';
    } else if (style === '3d') {
      styledPrompt += ', 3D render, octane render, unreal engine 5, detailed textures, soft studio lighting';
    } else if (style === 'oil') {
      styledPrompt += ', rich oil painting on textured canvas, impressionistic brush strokes, artistic masterpiece';
    } else if (style === 'cyberpunk') {
      styledPrompt += ', futuristic cyberpunk city style, neon lights, highly detailed, sci-fi concept art';
    }

    try {
      console.log(`[Omni AI] Generating image with model: ${model}, aspect: ${aspectRatio}...`);
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: styledPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let imageUrl = '';
      let textDescription = '';

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textDescription += part.text;
        }
      }

      if (!imageUrl) {
        throw new Error(textDescription || 'មិនបានទទួលរូបភាពពី Gemini API ឡើយ។');
      }

      return res.json({
        success: true,
        imageUrl,
        prompt: prompt.trim(),
        styledPrompt,
        aspectRatio,
        model,
        textDescription,
      });
    } catch (err: any) {
      console.error('Image generation error:', err);

      // Automatic fallback to gemini-3.1-flash-lite-image if nano banana was attempted
      if (model !== 'gemini-3.1-flash-lite-image') {
        try {
          console.warn('[Omni AI] Falling back to gemini-3.1-flash-lite-image for image generation...');
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [{ text: styledPrompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio as any } },
          });

          for (const part of fallbackRes.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              return res.json({
                success: true,
                imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                prompt: prompt.trim(),
                aspectRatio,
                model: 'gemini-3.1-flash-lite-image',
              });
            }
          }
        } catch (fbErr) {
          console.error('Fallback image generation failed:', fbErr);
        }
      }

      return res.status(500).json({
        error: true,
        message: formatGeminiError(err),
      });
    }
  });

  // ----------------------------------------------------
  // 2. Video Generation Endpoints (Veo veo-3.1-lite-generate-preview)
  // ----------------------------------------------------
  app.post('/api/generate-video', async (req, res) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: true,
        message: 'Google Gemini API Key មិនទាន់ត្រូវបានកំណត់ឡើយ។',
      });
    }

    const {
      prompt,
      aspectRatio = '16:9',
      resolution = '720p',
      imageBytes,
      mimeType = 'image/png',
    } = req.body;

    if (!prompt && !imageBytes) {
      return res.status(400).json({
        error: true,
        message: 'សូមបញ្ចូលការពិពណ៌នាវីដេអូ (Prompt) ឬរូបភាពចាប់ផ្តើម។',
      });
    }

    const ai = getAiClient();

    try {
      console.log(`[Omni AI] Initiating video generation with Veo... Prompt: ${prompt}`);
      const payload: any = {
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt || 'A cinematic high quality scene',
        config: {
          numberOfVideos: 1,
          resolution: resolution === '1080p' ? '1080p' : '720p',
          aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
        },
      };

      if (imageBytes) {
        payload.image = {
          imageBytes,
          mimeType,
        };
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
      console.error('Video generation initiation error:', err);
      return res.status(500).json({
        error: true,
        message: formatGeminiError(err),
      });
    }
  });

  app.post('/api/video-status', async (req, res) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: true, message: 'API Key missing' });
    }

    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: true, message: 'Operation name is required' });
    }

    const ai = getAiClient();

    try {
      const op = { name: operationName };
      const updated = await ai.operations.getVideosOperation({ operation: op as any });

      return res.json({
        done: updated.done,
        error: updated.error,
      });
    } catch (err: any) {
      console.error('Video status polling error:', err);
      return res.status(500).json({
        error: true,
        message: formatGeminiError(err),
      });
    }
  });

  app.all('/api/video-download', async (req, res) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: true, message: 'API Key missing' });
    }

    const operationName = req.query.operationName || req.body.operationName;
    if (!operationName) {
      return res.status(400).json({ error: true, message: 'Operation name is required' });
    }

    const ai = getAiClient();

    try {
      const op = { name: String(operationName) };
      const updated = await ai.operations.getVideosOperation({ operation: op as any });

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: true, message: 'Video URI not found or video is still processing.' });
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });

      if (!videoRes.ok) {
        throw new Error(`Failed to fetch video stream from storage (${videoRes.status})`);
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline; filename="omni-ai-video.mp4"');

      const arrayBuffer = await videoRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('Video download error:', err);
      return res.status(500).json({
        error: true,
        message: formatGeminiError(err),
      });
    }
  });

  // ----------------------------------------------------
  // 3. Chat Streaming Endpoint with Gemini Reasoning
  // ----------------------------------------------------
  app.post('/api/chat', async (req, res) => {
    const apiKey = getApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: true,
        message: 'Google Gemini API Key មិនទាន់ត្រូវបានកំណត់នៅក្នុង Environment Variables (GEMINI_API_KEY ឬ API_KEY) ឡើយ។ សូមពិនិត្យមើលការកំណត់ Settings > Secrets។',
      });
    }

    const {
      messages = [],
      model = '3.8-flash',
      thinkingLevel = 'high',
      stream = true,
    } = req.body;

    const wantsJson = stream === false || req.headers.accept === 'application/json';

    // Map model selection
    let selectedModel =
      model === '3.5-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

    // Map thinking level
    let level = ThinkingLevel.HIGH;
    if (thinkingLevel === 'low') {
      level = ThinkingLevel.LOW;
    } else if (thinkingLevel === 'medium') {
      level = ThinkingLevel.MEDIUM;
    } else {
      level = ThinkingLevel.HIGH;
    }

    // Build conversation contents array
    const contents = messages.map((msg: any) => {
      const role = msg.sender === 'user' ? 'user' : 'model';
      const parts: any[] = [];

      // Add attachments if present (images or files)
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data,
              },
            });
          } else if (att.name) {
            parts.push({
              text: `[ឯកសារភ្ជាប់: ${att.name}]`,
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return { role, parts };
    });

    // System instruction empowering Omni AI
    const systemInstruction = `You are Omni AI, a world-class artificial intelligence assistant powered by Google Gemini.
You possess the complete cognitive, analytical, programming, problem-solving, and creative capabilities of Google Gemini.

FORMATTING & RESPONSE RULES (MANDATORY):
1. **Clear Structure & Headings**: Always use clear markdown headings (##, ###), bold terms (**word**), and bullet points (-) to separate ideas. NEVER output unbroken walls of text.
2. **Aesthetic Spacing**: Divide responses into short, scannable paragraphs with generous vertical breathing room.
3. **Engaging & Friendly Tone**: Maintain a warm, courteous, respectful, and encouraging tone, while remaining sharply focused on the user's goal.
4. **Language & Excellence**: Respond in natural, grammatically refined Khmer (ភាសាខ្មែរ) when queried in Khmer, or in the language requested. For coding tasks, provide clean syntax-highlighted code blocks with explanatory comments.
5. **Creative Capabilities**: You can create images and generate video scenes via Google Gemini models (gemini-3.1-flash-lite-image and veo-3.1-lite-generate-preview).`;

    const ai = getAiClient();

    // Mode A: Standard JSON Response
    if (wantsJson) {
      try {
        let response;
        try {
          response = await ai.models.generateContent({
            model: selectedModel,
            contents,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: level },
            },
          });
        } catch (jsonErr: any) {
          const rawMsg = String(jsonErr?.message || '');
          if (
            (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) &&
            selectedModel === 'gemini-3.8-flash'
          ) {
            console.warn('[Omni AI] Falling back to 3.5-flash-lite in JSON mode...');
            selectedModel = 'gemini-3.1-flash-lite';
            response = await ai.models.generateContent({
              model: selectedModel,
              contents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              },
            });
          } else {
            throw jsonErr;
          }
        }

        return res.json({
          content: response.text || '',
          model: selectedModel,
        });
      } catch (err: any) {
        console.error('Non-streaming Gemini generation error:', err);
        return res.status(500).json({
          error: true,
          message: formatGeminiError(err),
        });
      }
    }

    // Mode B: Server-Sent Events (SSE) Streaming
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders?.();

    const sendSSE = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      let responseStream;

      try {
        responseStream = await ai.models.generateContentStream({
          model: selectedModel,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: level,
            },
          },
        });
      } catch (initialErr: any) {
        const rawErr = String(initialErr?.message || '');
        if (
          (rawErr.includes('429') || rawErr.includes('RESOURCE_EXHAUSTED') || rawErr.includes('Quota exceeded')) &&
          selectedModel === 'gemini-3.8-flash'
        ) {
          console.warn('[Omni AI] 3.8-flash quota exceeded. Switching to 3.5-flash-lite automatically...');
          sendSSE({
            type: 'thought',
            text: '⚠️ ម៉ូដែល Gemini 3.8 Flash បានដល់កម្រិតកំណត់កូតាឥតគិតថ្លៃប្រចាំថ្ងៃ។ ប្រព័ន្ធកំពុងប្តូរទៅម៉ូដែល Gemini 3.5 Flash-Lite ដោយស្វ័យប្រវត្ត...\n\n',
          });
          selectedModel = 'gemini-3.1-flash-lite';
          responseStream = await ai.models.generateContentStream({
            model: selectedModel,
            contents,
            config: {
              systemInstruction,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            },
          });
        } else {
          throw initialErr;
        }
      }

      for await (const chunk of responseStream) {
        const candidate = chunk.candidates?.[0];
        const parts = candidate?.content?.parts;

        if (parts && parts.length > 0) {
          for (const part of parts) {
            if ((part as any).thought) {
              sendSSE({ type: 'thought', text: part.text || '' });
            } else if (part.text) {
              sendSSE({ type: 'chunk', text: part.text });
            }
          }
        } else if (chunk.text) {
          sendSSE({ type: 'chunk', text: chunk.text });
        }
      }

      sendSSE({ type: 'done' });
      res.end();
    } catch (err: any) {
      console.error('Streaming Gemini generation error:', err);
      sendSSE({
        type: 'error',
        message: formatGeminiError(err),
      });
      res.end();
    }
  });

  // Production vs Development Serving
  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexPath);
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (isProduction && hasDist) {
    console.log(`[Production Mode] Serving static build from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    console.log(`[Development Mode] Mounting Vite middlewares...`);
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Omni AI server running on http://0.0.0.0:${port} (Port ${port})`);
  });
}

// Graceful error recovery
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer();
