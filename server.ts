import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  app.use(express.json({ limit: '30mb' }));

  // Environment Variable Check: supports GEMINI_API_KEY or API_KEY
  const getApiKey = () => process.env.GEMINI_API_KEY || process.env.API_KEY || '';

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

  // Chat Streaming Endpoint with robust error handling and fallback
  app.post('/api/chat', async (req, res) => {
    const apiKey = getApiKey();

    // 1. Verify API Key presence
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

    // Check if client requested JSON response instead of SSE
    const wantsJson = stream === false || req.headers.accept === 'application/json';

    // Map model selection
    // 3.8 Flash -> gemini-3.8-flash (High capability, deep reasoning & analysis)
    // 3.5 Flash-Lite -> gemini-3.1-flash-lite (Fast & lightweight)
    const selectedModel =
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
                data: att.data, // base64 string
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
4. **Language & Excellence**: Respond in natural, grammatically refined Khmer (ភាសាខ្មែរ) when queried in Khmer, or in the language requested. For coding tasks, provide clean syntax-highlighted code blocks with explanatory comments.`;

    const ai = getAiClient();

    // Mode A: Standard JSON Response (Robust fallback)
    if (wantsJson) {
      try {
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: level },
          },
        });

        return res.json({
          content: response.text || '',
          model: selectedModel,
        });
      } catch (err: any) {
        console.error('Non-streaming Gemini generation error:', err);
        return res.status(500).json({
          error: true,
          message: err.message || 'មានបញ្ហាក្នុងការទាក់ទងទៅ Google Gemini API។',
        });
      }
    }

    // Mode B: Server-Sent Events (SSE) Streaming
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/Cloud Run proxies
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders?.();

    const sendSSE = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: level,
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
        message: err.message || 'មានបញ្ហាក្នុងការទាញយកចម្លើយពី Google Gemini។ សូមព្យាយាមម្តងទៀត។',
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
