import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  // Universal CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    return res.status(500).json({
      error: true,
      message: 'Google Gemini API Key មិនទាន់ត្រូវបានកំណត់នៅក្នុង Environment Variables (GEMINI_API_KEY ឬ API_KEY) ឡើយ។',
    });
  }

  const {
    messages = [],
    model = '3.8-flash',
    thinkingLevel = 'high',
    stream = true,
  } = req.body || {};

  const selectedModel =
    model === '3.5-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

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

  const systemInstruction = `You are Omni AI, a world-class artificial intelligence assistant powered by Google Gemini.
You possess the complete cognitive, analytical, programming, problem-solving, and creative capabilities of Google Gemini.

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

  const wantsJson = stream === false || req.headers.accept === 'application/json';

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

      return res.status(200).json({
        content: response.text || '',
        model: selectedModel,
      });
    } catch (err: any) {
      console.error('Gemini error:', err);
      return res.status(500).json({
        error: true,
        message: err.message || 'មានបញ្ហាក្នុងការទាក់ទងទៅ Google Gemini API។',
      });
    }
  }

  // Streaming SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
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
    console.error('Streaming error on Vercel:', err);
    sendSSE({
      type: 'error',
      message: err.message || 'មានបញ្ហាក្នុងការទាញយកចម្លើយពី Google Gemini។',
    });
    res.end();
  }
}
