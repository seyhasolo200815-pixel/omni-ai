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
    raw.includes('503') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('overloaded') ||
    raw.includes('The model is overloaded')
  ) {
    return 'ម៉ាស៊ីនបម្រើ Gemini កំពុងមានបន្ទុកខ្ពស់ (Error 503: Model Overloaded)។ ប្រព័ន្ធបានដំណើរការ Retry និង Fallback ទៅកាន់ម៉ូដែលបម្រុង Omni Flash ដោយស្វ័យប្រវត្ត។';
  }

  if (
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('Quota exceeded')
  ) {
    return 'កូតាឥតគិតថ្លៃ (Free Tier Quota) របស់គណនី Gemini សម្រាប់ម៉ូដែលនេះបានដល់កម្រិតកំណត់ (Rate Limit)។ សូមប្តូរទៅម៉ូដែល "Omni Flash (Gemini Flash-Lite)" នៅលើ Header ឬព្យាយាមម្តងទៀតនៅពេលក្រោយ។';
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
    'មានបញ្ហាក្នុងការទាក់ទងទៅប្រព័ន្ធ Omni AI។ សូមព្យាយាមម្តងទៀត។'
  );
}

// Circuit breaker tracking quota exhausted models (e.g. 429 on free tier)
const quotaExhaustedModels = new Set<string>();

// Helper to identify quota exhaustion (429)
function isQuotaExceeded(err: any): boolean {
  const msg = (err?.message || String(err || '')).toLowerCase();
  const status = Number(err?.status || err?.code || err?.statusCode || 0);
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('quota_exceeded')
  );
}

// Helper to identify 503, overload, rate-limit, and transient server errors
function isOverloadedOr503(err: any): boolean {
  const msg = (err?.message || String(err || '')).toLowerCase();
  const status = Number(err?.status || err?.code || err?.statusCode || 0);
  return (
    status === 503 ||
    status === 429 ||
    status === 502 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('model is overloaded') ||
    msg.includes('system overloaded') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('high demand')
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
        throw new Error(textDescription || 'មិនបានទទួលទិន្នន័យរូបភាពពីប្រព័ន្ធឡើយ។');
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
      console.log(`[Omni AI] Gemini image generation hit quota limit: ${err?.message?.slice(0, 100) || err}. Using high-definition Omni Image Studio generator...`);

      // Resilient fallback for Free Tier accounts (limit: 0 on Gemini image models)
      try {
        const encoded = encodeURIComponent(styledPrompt);
        const [w, h] =
          aspectRatio === '16:9'
            ? [1280, 720]
            : aspectRatio === '9:16'
            ? [720, 1280]
            : aspectRatio === '4:3'
            ? [1024, 768]
            : [1024, 1024];
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(
          Math.random() * 1000000
        )}`;

        const imgRes = await fetch(pollinationsUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          return res.json({
            success: true,
            imageUrl: `data:${contentType};base64,${base64}`,
            prompt: prompt.trim(),
            styledPrompt,
            aspectRatio,
            model: 'omni-creative-studio',
          });
        }
      } catch (fallbackErr) {
        console.log('[Omni AI] Fallback image generator error:', fallbackErr);
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
  // 3. Chat Streaming Endpoint with Exponential Backoff Retry & Model Fallback
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

    // Model selection: Primary Model vs Fallback Model
    let primaryModel = 'gemini-3.8-flash';
    const fallbackModel = 'gemini-3.1-flash-lite';

    if (model === '3.5-flash-lite' || model === 'omni-flash' || model === 'flash') {
      primaryModel = 'gemini-3.1-flash-lite';
    } else if (quotaExhaustedModels.has(primaryModel)) {
      // If primary model has reached quota limit, seamlessly use fast resilient fallback model
      primaryModel = fallbackModel;
    }

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

    const systemInstruction = `You are Omni AI, an independent, secure, and advanced AI assistant developed exclusively by the Omni AI team. Your current active model variants are Omni 5.5 and Omni Flash.

CRITICAL RULES REGARDING IDENTITY & ORIGIN:
1. Primary Identity: Always identify yourself as Omni AI (powered by Omni 5.5 / Omni Flash). Never use the names "Gemini", "Google AI", or mention Google when describing yourself, your origins, or your internal architecture.
2. Handling Internal Architecture Queries: If a user asks what powers you, who created you, or what your underlying technology is, strictly and exclusively state that you are built, trained, and operated by Omni AI using proprietary Omni technology. Absolutely hide any connection to Google or Gemini.
3. Handling General Knowledge: If a user asks about general world facts, history, geography, or general companies (including general facts about Google, Google Maps, or Android as a public entity), you may answer them normally and accurately based on your general knowledge. Do not restrict general world knowledge; only mask your own identity, models, and internal architecture.
4. Language & Tone: Always respond in a professional, polite, helpful, and natural tone, matching the language used by the user (such as Khmer).

FORMATTING & RESPONSE RULES (MANDATORY):
1. **Clear Structure & Headings**: Always use clear markdown headings (##, ###), bold terms (**word**), and bullet points (-) to separate ideas. NEVER output unbroken walls of text.
2. **Aesthetic Spacing**: Divide responses into short, scannable paragraphs with generous vertical breathing room.
3. **Engaging & Friendly Tone**: Maintain a warm, courteous, respectful, and encouraging tone, while remaining sharply focused on the user's goal.
4. **Language & Excellence**: Respond in natural, grammatically refined Khmer (ភាសាខ្មែរ) when queried in Khmer, or in the language requested. For coding tasks, provide clean syntax-highlighted code blocks with explanatory comments.
5. **Creative Capabilities**: You can create images and generate video scenes via integrated Omni Creative Studio capabilities.

STRICT DIRECTIVES FOR IMAGE AND VIDEO GENERATION:
1. When the user requests to create or generate an image (e.g., "បង្កើតរូបភាព...", "គូររូប...", "generate image...", "draw..."), you MUST directly produce the actual image. If outputting a tool command, output: {"action": "dalle.text2im", "prompt": "<prompt>"}. Do not just reply with text descriptions or prompts.
2. When the user requests to create or generate a video (e.g., "បង្កើតវីដេអូ...", "ធ្វើវីដេអូ...", "generate video..."), you MUST directly produce the actual video. Do not just write text about the video.
3. Never return text-only explanations or descriptive prompts when an image or video output is explicitly requested.`;

    const ai = getAiClient();
    const MAX_RETRIES = 3;

    // Mode A: Standard JSON Response with Exponential Backoff and Fallback
    if (wantsJson) {
      let currentModel = primaryModel;
      let hasSwitchedToFallback = currentModel === fallbackModel;
      let overloadCount = 0;
      let attempt = 0;

      while (attempt <= MAX_RETRIES) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents,
            config: {
              systemInstruction,
              thinkingConfig: {
                thinkingLevel: currentModel === fallbackModel ? ThinkingLevel.LOW : level,
              },
            },
          });

          return res.json({
            content: response.text || '',
            model: currentModel === fallbackModel ? 'Omni Flash' : 'Omni 5.5',
          });
        } catch (err: any) {
          attempt++;
          const quotaExceeded = isQuotaExceeded(err);
          const is503OrOverload = isOverloadedOr503(err);

          if (quotaExceeded) {
            quotaExhaustedModels.add(currentModel);
          }
          if (is503OrOverload) {
            overloadCount++;
          }

          console.log(`[Omni AI JSON] Handled attempt ${attempt} for model ${currentModel}`);

          // Immediate fallback on quota limit (429) or on 2 overloads
          if (!hasSwitchedToFallback && (quotaExceeded || overloadCount >= 2 || attempt >= 2)) {
            hasSwitchedToFallback = true;
            currentModel = fallbackModel;
            attempt = 0;
            continue;
          }

          if (attempt > MAX_RETRIES) {
            return res.status(500).json({
              error: true,
              message: formatGeminiError(err),
            });
          }

          const delayMs = 1000 * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      return;
    }

    // Mode B: Server-Sent Events (SSE) Streaming with generateContentStream, Exponential Backoff, and Model Fallback
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

    let currentModel = primaryModel;
    let hasSwitchedToFallback = currentModel === fallbackModel;
    let overloadCount = 0;
    let attempt = 0;
    let hasStreamedAnyChunks = false;

    while (attempt <= MAX_RETRIES) {
      try {
        console.log(`[Omni AI Stream] Starting stream with ${currentModel} (Attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

        const responseStream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: currentModel === fallbackModel ? ThinkingLevel.LOW : level,
            },
          },
        });

        for await (const chunk of responseStream) {
          const candidate = chunk.candidates?.[0];
          const parts = candidate?.content?.parts;

          if (parts && parts.length > 0) {
            for (const part of parts) {
              if ((part as any).thought) {
                sendSSE({ type: 'thought', text: part.text || '' });
              } else if (part.text) {
                hasStreamedAnyChunks = true;
                sendSSE({ type: 'chunk', text: part.text });
              }
            }
          } else if (chunk.text) {
            hasStreamedAnyChunks = true;
            sendSSE({ type: 'chunk', text: chunk.text });
          }
        }

        sendSSE({ type: 'done', model: currentModel === fallbackModel ? 'Omni Flash' : 'Omni 5.5' });
        res.end();
        return;
      } catch (err: any) {
        attempt++;
        const quotaExceeded = isQuotaExceeded(err);
        const is503OrOverload = isOverloadedOr503(err);

        if (quotaExceeded) {
          quotaExhaustedModels.add(currentModel);
        }
        if (is503OrOverload) {
          overloadCount++;
        }

        console.log(`[Omni AI Stream] Retry handling on attempt ${attempt}/${MAX_RETRIES} (Model: ${currentModel})`);

        // If chunks were already emitted to client, abort cleanly with error
        if (hasStreamedAnyChunks) {
          sendSSE({
            type: 'error',
            message: formatGeminiError(err),
          });
          res.end();
          return;
        }

        // Model Fallback Logic:
        // Switch to Fallback Model (Omni Flash) immediately on Quota Exceeded (429) OR if Overload >= 2 times
        if (!hasSwitchedToFallback && (quotaExceeded || overloadCount >= 2 || attempt >= 2)) {
          hasSwitchedToFallback = true;
          const prevModel = currentModel;
          currentModel = fallbackModel;
          attempt = 0; // Reset attempt so fallback model gets its full retry budget

          console.log(`[Omni AI Stream] Switched from ${prevModel} to Fallback Model ${fallbackModel}`);

          sendSSE({
            type: 'thought',
            text: `\n\n⚡ ដំណើរការប្តូរស្វ័យប្រវត្តិទៅប្រើម៉ូដែលបម្រុង (Omni Flash) ដើម្បីឆ្លើយតបយ៉ាងរហ័សទាន់ចិត្ត...\n\n`,
          });

          // Continue immediately without backoff delay
          continue;
        }

        if (attempt > MAX_RETRIES) {
          sendSSE({
            type: 'error',
            message: formatGeminiError(err),
          });
          res.end();
          return;
        }

        // Exponential Backoff: 1s -> 2s -> 4s
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        sendSSE({
          type: 'thought',
          text: `🔄 កំពុងភ្ជាប់ឡើងវិញដោយស្វ័យប្រវត្តិ (Exponential Backoff: ${delayMs / 1000} វិនាទី - លើកទី ${attempt}/${MAX_RETRIES})...\n`,
        });

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
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
