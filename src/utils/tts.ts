/**
 * Omni AI Multi-Language Natural Speech Synthesis (TTS) Engine
 * 
 * Features:
 * - Proper text chunking into small, natural sentences/clauses
 * - Explicit language filtering (utterance.lang = 'km-KH' for Khmer)
 * - Strict prohibition of foreign/English voices on Khmer text to avoid weird accents
 * - Natural teacher-like prosody: warm lowered pitch (0.92) & smoothed rate (0.90 - 0.93)
 * - Chromium audio heartbeat to prevent browser speech timeout on long responses
 * - Complete start-to-finish queue management
 */

export interface TTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

export interface DetectedLang {
  code: string;       // BCP-47 language tag, e.g. km-KH, en-US
  primary: string;    // Language family prefix, e.g. km, en, zh
  displayName: string;
}

// 1. Text Cleaner: Strips markdown, URLs, code blocks, and formatting
export function cleanTextForTTS(rawText: string): string {
  if (!rawText) return '';

  return (
    rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images: ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
      // Replace links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove markdown headings
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold & italics markers
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove blockquotes and list bullets
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^\s*>\s*/gm, '')
      // Remove horizontal dividers
      .replace(/^---+$/gm, '')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Clean multiple whitespace and newlines
      .replace(/[\r\n]+/g, ' ។ ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// 2. Language Detector
export function detectContentLanguage(text: string): DetectedLang {
  if (!text) return { code: 'km-KH', primary: 'km', displayName: 'Khmer' };

  // Khmer Unicode: \u1780-\u17FF, \u19E0-\u19FF
  if (/[\u1780-\u17FF\u19E0-\u19FF]/.test(text)) {
    return { code: 'km-KH', primary: 'km', displayName: 'Khmer' };
  }

  // Chinese: \u4E00-\u9FFF
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return { code: 'zh-CN', primary: 'zh', displayName: 'Chinese' };
  }

  // Japanese: Hiragana / Katakana
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return { code: 'ja-JP', primary: 'ja', displayName: 'Japanese' };
  }

  // Korean: Hangul
  if (/[\uAC00-\uD7AF]/.test(text)) {
    return { code: 'ko-KR', primary: 'ko', displayName: 'Korean' };
  }

  // French accented characters
  if (/[éèêëàâôîïûùçœæ]/i.test(text) && /\b(le|la|les|un|une|des|est|dans|pour|avec|vous|nous)\b/i.test(text)) {
    return { code: 'fr-FR', primary: 'fr', displayName: 'French' };
  }

  // Spanish
  if (/[¿¡ñáéíóú]/i.test(text) && /\b(el|la|los|las|de|en|y|es|por|con|para)\b/i.test(text)) {
    return { code: 'es-ES', primary: 'es', displayName: 'Spanish' };
  }

  // German
  if (/[äöüß]/i.test(text) && /\b(der|die|das|und|ist|nicht|für|mit)\b/i.test(text)) {
    return { code: 'de-DE', primary: 'de', displayName: 'German' };
  }

  // Vietnamese
  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) {
    return { code: 'vi-VN', primary: 'vi', displayName: 'Vietnamese' };
  }

  return { code: 'en-US', primary: 'en', displayName: 'English' };
}

// 3. Proper Text Chunking: Splits long paragraphs into small, easily digestable sentences
export function chunkTextForTTS(text: string, isKhmer: boolean): string[] {
  if (!text) return [];

  // Split primary boundaries: Khmer full-stops (។, ៕, ៖) and standard sentence delimiters (. ! ? \n)
  const primaryDelimiters = isKhmer
    ? /(?<=[។៕៖.!?\n])/
    : /(?<=[.!?\n])/;

  const rawParagraphs = text.split(primaryDelimiters);
  const chunks: string[] = [];

  // Optimal length: 70-90 characters ensures smooth, unclipped browser speech
  const maxChunkLength = isKhmer ? 80 : 110;

  for (const raw of rawParagraphs) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChunkLength) {
      chunks.push(trimmed);
      continue;
    }

    // Long clause: gently break at secondary pauses (commas, semicolons, spaces)
    const secondaryDelimiters = isKhmer
      ? /(?<=[,; \t])/
      : /(?<=[,;:\t]|\s+)/;

    const parts = trimmed.split(secondaryDelimiters);
    let currentChunk = '';

    for (const part of parts) {
      if (!part) continue;

      if ((currentChunk + part).length > maxChunkLength && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = part;
      } else {
        currentChunk += part;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks.filter((c) => c.length > 0);
}

// 4. Voice Selection with Strict Khmer Language Isolation
export function selectTeacherVoice(
  voices: SpeechSynthesisVoice[],
  detected: DetectedLang
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  const primary = detected.primary.toLowerCase();
  const code = detected.code.toLowerCase();

  // Look for voices explicitly matched to the language
  const matching = voices.filter(
    (v) =>
      v.lang.toLowerCase() === code ||
      v.lang.toLowerCase().startsWith(primary) ||
      (primary === 'km' && (v.name.toLowerCase().includes('khmer') || v.name.toLowerCase().includes('cambodia')))
  );

  if (matching.length > 0) {
    // Priority: Natural / Neural / Teacher-like voice
    const naturalVoice = matching.find((v) =>
      /natural|neural|online|enhanced|premium|teacher|sreymom|piseth/i.test(v.name)
    );
    return naturalVoice || matching[0];
  }

  // CRITICAL RULE: For Khmer text, NEVER assign an English or foreign voice!
  // Assigning an English voice causes the browser to read Khmer in an English accent.
  // Leaving voice undefined lets the OS use its native Khmer language engine cleanly.
  if (primary === 'km') {
    return undefined;
  }

  // For English / Western languages, pick a warm natural voice
  const langMatching = voices.filter((v) => v.lang.toLowerCase().startsWith(primary));
  if (langMatching.length > 0) {
    const natural = langMatching.find((v) =>
      /natural|neural|online|enhanced|samantha|serena|jenny|guy|karen|victoria/i.test(v.name)
    );
    return natural || langMatching[0];
  }

  return undefined;
}

// 5. Global State & Heartbeat to fix Chromium 15s pause bug
let isCancelled = false;
let heartbeatInterval: any = null;

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }
  }, 9000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export function stopSpeech(): void {
  isCancelled = true;
  stopHeartbeat();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Play full message smoothly, gently, and completely from start to finish
 * using small sentence chunking, explicit utterance.lang = 'km-KH', and teacher prosody.
 */
export function playTeacherSpeech(text: string, options: TTSOptions = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.('Speech synthesis not supported');
    return;
  }

  stopSpeech();
  isCancelled = false;

  const cleaned = cleanTextForTTS(text);
  if (!cleaned) {
    options.onEnd?.();
    return;
  }

  const detected = detectContentLanguage(cleaned);
  const isKhmer = detected.primary === 'km';
  const chunks = chunkTextForTTS(cleaned, isKhmer);

  if (chunks.length === 0) {
    options.onEnd?.();
    return;
  }

  const startPlayback = () => {
    if (isCancelled) return;

    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = selectTeacherVoice(voices, detected);

    let currentIndex = 0;
    options.onStart?.();
    startHeartbeat();

    const speakNextChunk = () => {
      if (isCancelled) {
        stopHeartbeat();
        options.onEnd?.();
        return;
      }

      if (currentIndex >= chunks.length) {
        stopHeartbeat();
        options.onEnd?.();
        return;
      }

      const chunkText = chunks[currentIndex];
      currentIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);

      // Explicit language filtering
      utterance.lang = isKhmer ? 'km-KH' : detected.code;

      // Assign voice only if a compatible voice exists (strictly no English voice for Khmer)
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      // Natural Teacher Prosody:
      // Lowered pitch (0.92) gives gentle, calm warmth rather than robotic high tones
      utterance.pitch = 0.92;

      // Smoothed rate: 0.90 for Khmer and 0.93 for English gives articulate, teacher-like pacing
      utterance.rate = isKhmer ? 0.90 : 0.93;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (!isCancelled) {
          // Subtle breathing pause (120ms) between chunks for organic flow
          setTimeout(speakNextChunk, 120);
        }
      };

      utterance.onerror = (e) => {
        console.warn('TTS chunk note:', e);
        if (!isCancelled) {
          // Seamlessly proceed to the next sentence
          setTimeout(speakNextChunk, 80);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  };

  // Wait for voices to load if needed
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      startPlayback();
    };
    setTimeout(() => {
      if (!isCancelled) startPlayback();
    }, 120);
  } else {
    startPlayback();
  }
}
