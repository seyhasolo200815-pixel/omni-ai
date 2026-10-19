import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const config = {
  maxDuration: 60,
};

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
    return 'កូតាឥតគិតថ្លៃ (Free Tier Quota) របស់គណនី Gemini សម្រាប់ម៉ូដែល 3.8 Flash បានដល់កម្រិតកំណត់ប្រចាំថ្ងៃ (429 Rate Limit)។ សូមប្តូរទៅម៉ូដែល "Omni Flash (Gemini Flash-Lite)" នៅលើ Header ខាងលើ ដើម្បីបន្តការជជែកដោយសេរី ឬបន្ថែម Billing លើ Google Cloud Console។';
  }

  if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
    return 'Google Gemini API Key មិនត្រឹមត្រូវឡើយ។ សូមពិនិត្យមើល API Key របស់អ្នកម្តងទៀតក្នុង Secrets។';
  }

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

export default async function handler(req: any, res: any) {
  // Universal CORS
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
      message: 'API Key មិនទាន់ត្រូវបានកំណត់នៅក្នុង Environment Variables ឡើយ។ សូមប្រាកដថាអ្នកបានបន្ថែម GEMINI_API_KEY ឬ GOOGLE_API_KEY នៅក្នុង Vercel Project Settings > Environment Variables។',
    });
  }

  const {
    messages = [],
    model = '3.8-flash',
    thinkingLevel = 'high',
    stream = true,
  } = req.body || {};

  // Model selection: Primary Model vs Fallback Model
  let primaryModel = 'gemini-3.8-flash';
  let fallbackModel = 'gemini-3.1-flash-lite';

  if (model === 'omni-pro' || model === 'pro') {
    primaryModel = 'gemini-2.5-pro';
    fallbackModel = 'gemini-2.5-flash';
  } else if (model === 'omni-flash' || model === 'flash') {
    primaryModel = 'gemini-2.5-flash';
    fallbackModel = 'gemini-3.1-flash-lite';
  } else if (model === '3.5-flash-lite') {
    primaryModel = 'gemini-3.1-flash-lite';
    fallbackModel = 'gemini-2.5-flash';
  } else {
    // default: 3.8-flash (Omni Pro) with fallback to gemini-3.1-flash-lite (Omni Flash)
    primaryModel = 'gemini-3.8-flash';
    fallbackModel = 'gemini-3.1-flash-lite';
  }

  let level = ThinkingLevel.HIGH;
  if (thinkingLevel === 'low') {
    level = ThinkingLevel.LOW;
  } else if (thinkingLevel === 'medium') {
    level = ThinkingLevel.MEDIUM;
  } else {
    level = ThinkingLevel.HIGH;
  }

  const contents = messages.map((msg: any) => {
    const role = msg.sender === 'user' ? 'user' : 'model';
    const parts: any[] = [];

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
4. **Language & Excellence**: Respond in natural, grammatically refined Khmer (ភាសាខ្មែរ) when queried in Khmer, or in the language requested. For coding tasks, provide clean syntax-highlighted code blocks with explanatory comments.`;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const MAX_RETRIES = 3;
  const wantsJson = stream === false || req.headers.accept === 'application/json';

  // Mode A: JSON Non-streaming with Retry & Fallback
  if (wantsJson) {
    let currentModel = primaryModel;
    let hasSwitchedToFallback = false;
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

        return res.status(200).json({
          content: response.text || '',
          model: currentModel === fallbackModel ? 'Omni Flash' : 'Omni 5.5',
        });
      } catch (err: any) {
        attempt++;
        if (isOverloadedOr503(err)) {
          overloadCount++;
        }

        if (!hasSwitchedToFallback && (overloadCount >= 2 || attempt >= 2)) {
          console.warn(`[Vercel chat JSON] Fallback triggered to ${fallbackModel}`);
          hasSwitchedToFallback = true;
          currentModel = fallbackModel;
          continue;
        }

        if (attempt > MAX_RETRIES) {
          console.error('Gemini error after retries:', err);
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

  // Mode B: Server-Sent Events (SSE) Streaming with generateContentStream
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let currentModel = primaryModel;
  let hasSwitchedToFallback = false;
  let overloadCount = 0;
  let attempt = 0;
  let hasStreamedAnyChunks = false;

  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`[Vercel Stream] Starting generateContentStream with ${currentModel} (Attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

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
      const is503OrOverload = isOverloadedOr503(err);
      if (is503OrOverload) {
        overloadCount++;
      }

      console.warn(
        `[Vercel Stream] Error on attempt ${attempt}/${MAX_RETRIES} (Model: ${currentModel}, OverloadCount: ${overloadCount}):`,
        err?.message || err
      );

      if (hasStreamedAnyChunks) {
        sendSSE({
          type: 'error',
          message: formatGeminiError(err),
        });
        res.end();
        return;
      }

      // Requirement 2: Model Fallback Logic on Error 503 / Overload >= 2
      if (!hasSwitchedToFallback && (overloadCount >= 2 || attempt >= 2)) {
        hasSwitchedToFallback = true;
        const prevModel = currentModel;
        currentModel = fallbackModel;
        console.warn(`[Vercel Stream] Automatically switching from ${prevModel} to Fallback Model ${fallbackModel} due to Error 503 / Overload...`);

        sendSSE({
          type: 'thought',
          text: `\n\n⚠️ ប្រព័ន្ធបានរកឃើញបញ្ហា Error 503 / System Overloaded លើសពី ២ ដងលើម៉ូដែលគោល (Omni 5.5)។\n🔄 កំពុងប្តូរស្វ័យប្រវត្តិទៅប្រើម៉ូដែលបម្រុង (Omni Flash) ដើម្បីធានាការឆ្លើយតបដោយមិនដាច់ខាន...\n\n`,
        });

        continue;
      }

      if (attempt > MAX_RETRIES) {
        console.error(`[Vercel Stream] Max retries (${MAX_RETRIES}) reached. Aborting with error.`);
        sendSSE({
          type: 'error',
          message: formatGeminiError(err),
        });
        res.end();
        return;
      }

      // Requirement 1: Exponential Backoff (1s -> 2s -> 4s)
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`[Vercel Stream] Exponential Backoff: waiting ${delayMs}ms before retry ${attempt}/${MAX_RETRIES}...`);

      sendSSE({
        type: 'thought',
        text: `🔄 ប្រព័ន្ធជួបបញ្ហាឆ្លើយតប (Error 503 ឬ Overloaded)។ កំពុងរង់ចាំ និងព្យាយាមភ្ជាប់ឡើងវិញដោយស្វ័យប្រវត្តិ (Exponential Backoff: ${delayMs / 1000} វិនាទី - លើកទី ${attempt}/${MAX_RETRIES})...\n`,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
