/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveView, ChatHistoryItem } from './components/Sidebar';
import { Header, GeminiModelType, ThinkingLevelType } from './components/Header';
import { ChatArea, Message } from './components/ChatArea';
import { VideoPlaceholder } from './components/VideoPlaceholder';
import { ImagesView } from './components/Views/ImagesView';
import { LibraryView } from './components/Views/LibraryView';
import { ProjectsView } from './components/Views/ProjectsView';
import { ExploreGptsView } from './components/Views/ExploreGptsView';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { AttachedItem } from './components/Composer';

export interface SavedConversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

function getChatGroup(timestamp: number): 'today' | 'yesterday' | 'previous7' {
  const now = new Date();
  const chatDate = new Date(timestamp);

  if (now.toDateString() === chatDate.toDateString()) return 'today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === chatDate.toDateString()) return 'yesterday';

  return 'previous7';
}

// Strict Prohibition of Gemini and Custom High-Traffic Error Message
export function formatOmniError(errorMsg?: string): string {
  if (!errorMsg) {
    return 'Omni AI is currently experiencing high traffic. Please switch to Omni Flash or try again later.';
  }

  const lower = errorMsg.toLowerCase();
  if (
    lower.includes('gemini') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('overload') ||
    lower.includes('unavailable')
  ) {
    return 'Omni AI is currently experiencing high traffic. Please switch to Omni Flash or try again later.';
  }

  return errorMsg.replace(/gemini/gi, 'Omni AI');
}

// Vibration API (navigator.vibrate) for subtle tactile notification upon response completion
export function triggerCompletionHaptic(): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      // Short subtle vibration (50ms)
      navigator.vibrate(50);
    }
  } catch (err) {
    // Graceful fallback if device lacks vibration hardware or permission
  }
}

// Strict Directives: Robust detection of Image Generation requests in Khmer and English
export function detectImageIntent(text: string, mode?: string): { isImage: boolean; cleanPrompt: string } {
  if (mode === 'image') return { isImage: true, cleanPrompt: text.trim() };

  const trimmed = text.trim();
  if (trimmed.startsWith('/image')) {
    const clean = trimmed.replace(/^\/image\s*/i, '').trim();
    return { isImage: true, cleanPrompt: clean || trimmed };
  }

  // Khmer image generation keywords
  const khmerImageKeywords = [
    'បង្កើតរូបភាព',
    'បង្កើតរូប',
    'គូររូបភាព',
    'គូររូប',
    'ចង់បានរូបភាព',
    'ចង់បានរូប',
    'សុំរូបភាព',
    'សុំរូប',
  ];

  for (const kw of khmerImageKeywords) {
    if (trimmed.includes(kw)) {
      const regex = new RegExp(`(?:សូម|ជួយ|សុំ|ចង់|ខ្ញុំចង់|ខ្ញុំចង់បាន)?\\s*${kw}\\s*(?:នៃ|អំពី|ឱ្យ|អោយ|ពី|ជូន|មួយ)?\\s*[:៖\\-]?\\s*(.*)$`, 'i');
      const match = trimmed.match(regex);
      const clean = (match && match[1]?.trim()) ? match[1].trim() : trimmed;
      return { isImage: true, cleanPrompt: clean || trimmed };
    }
  }

  // English image generation keywords
  const englishImageRegex = /^(?:please\s+|can\s+you\s+|could\s+you\s+|i\s+want\s+to\s+)?(?:generate|create|draw|paint|make|produce)\s+(?:an?\s+)?(?:image|picture|photo|illustration|artwork)\s*(?:of|about|showing|depicting)?\s*[:\-]?\s*(.*)$/i;
  const engMatch = trimmed.match(englishImageRegex);
  if (engMatch) {
    const clean = engMatch[1]?.trim();
    return { isImage: true, cleanPrompt: clean || trimmed };
  }

  if (/\b(generate image|create image|draw an image|draw a picture|paint a picture|make an image)\b/i.test(trimmed)) {
    const clean = trimmed.replace(/^(?:please\s+|can\s+you\s+)?(?:generate|create|draw|paint|make)\s+(?:an?\s+)?(?:image|picture)\s*(?:of|about)?\s*[:\-]?\s*/i, '').trim();
    return { isImage: true, cleanPrompt: clean || trimmed };
  }

  return { isImage: false, cleanPrompt: trimmed };
}

// Strict Directives: Robust detection of Video Generation requests in Khmer and English
export function detectVideoIntent(text: string, mode?: string): { isVideo: boolean; cleanPrompt: string } {
  if (mode === 'video') return { isVideo: true, cleanPrompt: text.trim() };

  const trimmed = text.trim();
  if (trimmed.startsWith('/video')) {
    const clean = trimmed.replace(/^\/video\s*/i, '').trim();
    return { isVideo: true, cleanPrompt: clean || trimmed };
  }

  // Khmer video generation keywords
  const khmerVideoKeywords = [
    'បង្កើតវីដេអូ',
    'ធ្វើវីដេអូ',
    'ផលិតវីដេអូ',
    'ចង់បានវីដេអូ',
    'សុំវីដេអូ',
  ];

  for (const kw of khmerVideoKeywords) {
    if (trimmed.includes(kw)) {
      const regex = new RegExp(`(?:សូម|ជួយ|សុំ|ចង់|ខ្ញុំចង់|ខ្ញុំចង់បាន)?\\s*${kw}\\s*(?:នៃ|អំពី|ឱ្យ|អោយ|ពី|ជូន|មួយ)?\\s*[:៖\\-]?\\s*(.*)$`, 'i');
      const match = trimmed.match(regex);
      const clean = (match && match[1]?.trim()) ? match[1].trim() : trimmed;
      return { isVideo: true, cleanPrompt: clean || trimmed };
    }
  }

  // English video generation keywords
  const englishVideoRegex = /^(?:please\s+|can\s+you\s+|could\s+you\s+|i\s+want\s+to\s+)?(?:generate|create|make|produce|render)\s+(?:an?\s+)?(?:video|clip|animation)\s*(?:of|about|showing|depicting)?\s*[:\-]?\s*(.*)$/i;
  const engMatch = trimmed.match(englishVideoRegex);
  if (engMatch) {
    const clean = engMatch[1]?.trim();
    return { isVideo: true, cleanPrompt: clean || trimmed };
  }

  if (/\b(generate video|create video|make a video|render video)\b/i.test(trimmed)) {
    const clean = trimmed.replace(/^(?:please\s+|can\s+you\s+)?(?:generate|create|make)\s+(?:an?\s+)?(?:video|clip)\s*(?:of|about)?\s*[:\-]?\s*/i, '').trim();
    return { isVideo: true, cleanPrompt: clean || trimmed };
  }

  return { isVideo: false, cleanPrompt: trimmed };
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('3.5-flash-lite');
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevelType>('low');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dynamic conversations: empty initial state for new users, saved dynamically on chat
  const [conversations, setConversations] = useState<SavedConversation[]>(() => {
    try {
      const stored = localStorage.getItem('omni_saved_conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omni_saved_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to sync conversations to localStorage:', e);
    }
  }, [conversations]);

  // Synchronize current messages to active conversation
  useEffect(() => {
    if (!currentChatId || isTemporaryChat || messages.length === 0) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === currentChatId ? { ...c, messages } : c))
    );
  }, [messages, currentChatId, isTemporaryChat]);

  // Convert conversations to ChatHistoryItems with dynamic groups
  const chatHistoryItems: ChatHistoryItem[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    group: getChatGroup(c.createdAt),
  }));

  // Responsive sidebar collapse for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setActiveView('chat');
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    setActiveView('chat');
    const target = conversations.find((c) => c.id === id);
    if (target) {
      setMessages(target.messages);
    } else {
      setMessages([]);
    }
  };

  const handleDeleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Production-Ready Unified Message Handler (Text Chat + Image Generation + Video Generation)
  const handleSendMessage = async (
    text: string,
    attachments: AttachedItem[] = [],
    mode: 'chat' | 'image' | 'video' = 'chat'
  ) => {
    if (!text.trim() && attachments.length === 0) return;

    const trimmedText = text.trim();
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: trimmedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Strict Directives: Detect image and video generation intents
    const { isImage: isImageIntent, cleanPrompt: imagePrompt } = detectImageIntent(trimmedText, mode);
    const { isVideo: isVideoIntent, cleanPrompt: videoPrompt } = !isImageIntent
      ? detectVideoIntent(trimmedText, mode)
      : { isVideo: false, cleanPrompt: trimmedText };

    // Save and create conversation dynamically if starting a fresh chat
    if (!isTemporaryChat) {
      if (!currentChatId) {
        const newChatId = `chat_${Date.now()}`;
        setCurrentChatId(newChatId);

        let title = trimmedText.slice(0, 35);
        if (trimmedText.length > 35) title += '...';
        if (isImageIntent) {
          title = '🖼️ ' + (imagePrompt.slice(0, 28) || 'រូបភាព');
        } else if (isVideoIntent) {
          title = '🎬 ' + (videoPrompt.slice(0, 28) || 'វីដេអូ');
        }

        const newConv: SavedConversation = {
          id: newChatId,
          title: title || 'ការសន្ទនាថ្មី',
          createdAt: Date.now(),
          messages: updatedMessages,
        };
        setConversations((prev) => [newConv, ...prev]);
      }
    }

    const aiMessageId = Math.random().toString(36).substring(7);

    // Strict Language Directive: Prohibit Thai language recognition or generation
    const isThaiInput =
      /[\u0E00-\u0E7F]/.test(trimmedText) ||
      /(ភាសាថៃ|ភាសាសៀម|បកប្រែជាភាសាថៃ|បកប្រែជាថៃ|និយាយថៃ|រៀនថៃ|អក្សរថៃ|\bthai\s+language\b|\bin\s+thai\b|\bto\s+thai\b|\bspeak\s+thai\b|\btranslate\s+to\s+thai\b|\bwrite\s+in\s+thai\b)/i.test(trimmedText);

    if (isThaiInput) {
      const thaiRefusalMessage: Message = {
        id: aiMessageId,
        sender: 'system',
        content: 'ខ្ញុំមិនចេះភាសាថៃទេ',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationType: 'text',
      };
      setMessages((prev) => [...prev, thaiRefusalMessage]);
      return;
    }

    // -------------------------------------------------------------------------
    // Route 1: Image Generation Intent (Strict Directives: Produce Actual Image)
    // -------------------------------------------------------------------------
    if (isImageIntent) {
      const cleanPrompt = imagePrompt || trimmedText;

      const systemPlaceholder: Message = {
        id: aiMessageId,
        sender: 'system',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
        generationType: 'image',
      };

      setMessages((prev) => [...prev, systemPlaceholder]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanPrompt,
            aspectRatio: '1:1',
            style: 'realistic',
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error || !data.imageUrl) {
          throw new Error(data.message || 'មិនអាចបង្កើតរូបភាពបានទេ។');
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: `នេះជារូបភាពដែល Omni AI បានបង្កើតជូនអ្នកតាមការពិពណ៌នា៖ **"${cleanPrompt}"**`,
                  generatedImage: {
                    url: data.imageUrl,
                    prompt: cleanPrompt,
                    aspectRatio: data.aspectRatio || '1:1',
                  },
                  isStreaming: false,
                  generationType: 'image',
                }
              : m
          )
        );
        triggerCompletionHaptic();
      } catch (err: any) {
        console.error('Image generation error in chat:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: formatOmniError(err?.message),
                  error: true,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Route 2: Video Generation Intent (Strict Directives: Produce Actual Video)
    // -------------------------------------------------------------------------
    if (isVideoIntent) {
      const cleanPrompt = videoPrompt || trimmedText;

      const systemPlaceholder: Message = {
        id: aiMessageId,
        sender: 'system',
        content: `ម៉ាស៊ីន Omni Video Studio កំពុង Render វីដេអូតាមការពិពណ៌នារបស់អ្នក...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationType: 'video',
        generatedVideo: {
          prompt: cleanPrompt,
          status: 'generating',
          aspectRatio: '16:9',
        },
      };

      setMessages((prev) => [...prev, systemPlaceholder]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanPrompt,
            aspectRatio: '16:9',
            resolution: '720p',
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.message || 'មិនអាចចាប់ផ្តើមបង្កើតវីដេអូបានទេ។');
        }

        const operationName = data.operationName;

        // Poll video operation status
        let isDone = false;
        let attempts = 0;
        while (!isDone && attempts < 25) {
          await new Promise((r) => setTimeout(r, 6000));
          attempts++;

          const pollRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });

          const pollData = await pollRes.json();
          if (pollData.done) {
            isDone = true;
            break;
          }
          if (pollData.error) {
            throw new Error(pollData.error.message || 'បរាជ័យក្នុងការ Render វីដេអូ');
          }
        }

        const videoDownloadUrl = `/api/video-download?operationName=${encodeURIComponent(operationName)}`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: `នេះជាវីដេអូដែល Omni AI បានបង្កើតជូនអ្នក៖ **"${cleanPrompt}"**`,
                  generatedVideo: {
                    url: videoDownloadUrl,
                    prompt: cleanPrompt,
                    status: 'ready',
                    aspectRatio: '16:9',
                  },
                }
              : m
          )
        );
        triggerCompletionHaptic();
      } catch (err: any) {
        console.warn('Video generation error/demo fallback in chat:', err);
        const errMsg = err?.message || '';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content:
                    errMsg.includes('Quota') ||
                    errMsg.includes('429') ||
                    errMsg.includes('403') ||
                    errMsg.toLowerCase().includes('gemini')
                      ? 'Omni AI is currently experiencing high traffic. Please switch to Omni Flash or try again later.'
                      : `មានបញ្ហាក្នុងការបង្កើតវីដេអូ៖ ${formatOmniError(errMsg)}`,
                  generatedVideo: {
                    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    prompt: cleanPrompt,
                    status: 'ready',
                    aspectRatio: '16:9',
                  },
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Route 3: Standard Conversational Streaming Chat with Gemini 3.8 / 3.5
    // -------------------------------------------------------------------------
    const systemPlaceholder: Message = {
      id: aiMessageId,
      sender: 'system',
      content: '',
      thought: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      generationType: 'text',
    };

    setMessages((prev) => [...prev, systemPlaceholder]);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s safety timeout

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          thinkingLevel: thinkingLevel,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.message) {
            errorMsg = errData.message;
          }
        } catch {
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response stream is unavailable');
      }

      let accumulatedText = '';
      let accumulatedThought = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'chunk' && event.text) {
                accumulatedText += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: accumulatedText, isStreaming: true }
                      : m
                  )
                );
              } else if (event.type === 'thought' && event.text) {
                accumulatedThought += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, thought: accumulatedThought, isStreaming: true }
                      : m
                  )
                );
              } else if (event.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, isStreaming: false } : m
                  )
                );
              } else if (event.type === 'error') {
                const errMsg = formatOmniError(event.message);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          content: errMsg,
                          error: true,
                          isStreaming: false,
                        }
                      : m
                  )
                );
                return;
              }
            } catch (err) {
              console.warn('Could not parse SSE line:', line, err);
            }
          }
        }
      }

      // API Response Handler: Check if response contains image generation action JSON or image URL
      const jsonActionMatch = accumulatedText.match(/\{[\s\S]*?"action"\s*:\s*"(?:dalle\.text2im|dalle|generate_image|image)"[\s\S]*?\}/i);
      if (jsonActionMatch) {
        try {
          const parsed = JSON.parse(jsonActionMatch[0]);
          const promptToDraw = parsed.prompt || parsed.prompt_text || parsed.description;
          const directUrl = parsed.url || parsed.imageUrl || parsed.image_url;

          if (directUrl) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? {
                      ...m,
                      content: `នេះជារូបភាពដែល Omni AI បានបង្កើតជូនអ្នក៖`,
                      generatedImage: {
                        url: directUrl,
                        prompt: promptToDraw || 'AI Generated Image',
                        aspectRatio: '1:1',
                      },
                      isStreaming: false,
                      generationType: 'image',
                    }
                  : m
              )
            );
          } else if (promptToDraw) {
            fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: promptToDraw, aspectRatio: '1:1' }),
            })
              .then((r) => r.json())
              .then((imgData) => {
                if (imgData.imageUrl) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMessageId
                        ? {
                            ...m,
                            content: `នេះជារូបភាពដែល Omni AI បានបង្កើតជូនអ្នកតាមការពិពណ៌នា៖ **"${promptToDraw}"**`,
                            generatedImage: {
                              url: imgData.imageUrl,
                              prompt: promptToDraw,
                              aspectRatio: imgData.aspectRatio || '1:1',
                            },
                            isStreaming: false,
                            generationType: 'image',
                          }
                        : m
                    )
                  );
                }
              })
              .catch(() => {});
          }
        } catch {}
      } else {
        const mdImgMatch = accumulatedText.match(/!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/i);
        if (mdImgMatch) {
          const alt = mdImgMatch[1] || 'AI Generated Image';
          const url = mdImgMatch[2];
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? {
                    ...m,
                    content: accumulatedText.replace(mdImgMatch[0], '').trim(),
                    generatedImage: {
                      url,
                      prompt: alt,
                      aspectRatio: '1:1',
                    },
                    isStreaming: false,
                    generationType: 'image',
                  }
                : m
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === aiMessageId ? { ...m, isStreaming: false } : m))
      );
      triggerCompletionHaptic();
    } catch (primaryError: any) {
      console.warn('Streaming failed, attempting JSON fallback...', primaryError);

      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages,
            model: selectedModel,
            thinkingLevel: thinkingLevel,
            stream: false,
          }),
        });

        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          let content = data.content || 'មិនមានចម្លើយត្រឡប់មកវិញ។';
          if (data.error || /gemini|quota|429|503|overload/i.test(content)) {
            content = formatOmniError(content);
          }

          // Check if JSON response contained dalle/image action
          const jsonActionMatch = content.match(/\{[\s\S]*?"action"\s*:\s*"(?:dalle\.text2im|dalle|generate_image|image)"[\s\S]*?\}/i);
          if (jsonActionMatch) {
            try {
              const parsed = JSON.parse(jsonActionMatch[0]);
              const promptToDraw = parsed.prompt || parsed.prompt_text || parsed.description;
              const directUrl = parsed.url || parsed.imageUrl || parsed.image_url;

              if (directUrl) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          content: `នេះជារូបភាពដែល Omni AI បានបង្កើតជូនអ្នក៖`,
                          generatedImage: {
                            url: directUrl,
                            prompt: promptToDraw || 'AI Generated Image',
                            aspectRatio: '1:1',
                          },
                          isStreaming: false,
                          generationType: 'image',
                        }
                      : m
                  )
                );
                return;
              } else if (promptToDraw) {
                const imgRes = await fetch('/api/generate-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: promptToDraw, aspectRatio: '1:1' }),
                });
                const imgData = await imgRes.json();
                if (imgData.imageUrl) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMessageId
                        ? {
                            ...m,
                            content: `នេះជារូបភាពដែល Omni AI បានបង្កើតជូនអ្នកតាមការពិពណ៌នា៖ **"${promptToDraw}"**`,
                            generatedImage: {
                              url: imgData.imageUrl,
                              prompt: promptToDraw,
                              aspectRatio: imgData.aspectRatio || '1:1',
                            },
                            isStreaming: false,
                            generationType: 'image',
                          }
                        : m
                    )
                  );
                  return;
                }
              }
            } catch {}
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? {
                    ...m,
                    content,
                    isStreaming: false,
                    error: false,
                  }
                : m
            )
          );
          triggerCompletionHaptic();
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }

      const isTimeout = primaryError?.name === 'AbortError';
      const displayMsg = isTimeout
        ? 'ការតភ្ជាប់លើសពេលវេលាកំណត់ (Timeout)។ សូមព្យាយាមម្តងទៀត។'
        : formatOmniError(primaryError?.message);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                content: displayMsg,
                error: true,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    const lastUserIdx = messages.map((m) => m.sender).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      const lastUserMsg = messages[lastUserIdx];
      const priorMessages = messages.slice(0, lastUserIdx);
      setMessages(priorMessages);
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 font-sans">
      {/* 1. Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
        }}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        chats={chatHistoryItems}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Main Top Header with Gemini Model and Thinking Level */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          thinkingLevel={thinkingLevel}
          onSelectThinkingLevel={setThinkingLevel}
          isTemporaryChat={isTemporaryChat}
          onToggleTemporaryChat={() => setIsTemporaryChat(!isTemporaryChat)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'chat' && (
            <ChatArea
              messages={messages}
              onSendMessage={handleSendMessage}
              onRegenerate={messages.length > 1 ? handleRegenerate : undefined}
              isLoading={isLoading}
              selectedModelName={
                selectedModel === '3.8-flash' ? 'Omni 5.5' : 'Omni Flash'
              }
              onOpenVideoStudio={() => setActiveView('video')}
              onOpenImageStudio={() => setActiveView('images')}
            />
          )}

          {activeView === 'video' && (
            <VideoPlaceholder onBackToChat={handleNewChat} />
          )}

          {activeView === 'images' && (
            <ImagesView onBackToChat={handleNewChat} />
          )}

          {activeView === 'library' && (
            <LibraryView onBackToChat={handleNewChat} />
          )}

          {activeView === 'projects' && (
            <ProjectsView onBackToChat={handleNewChat} />
          )}

          {activeView === 'explore_gpts' && (
            <ExploreGptsView
              onBackToChat={handleNewChat}
              onSelectGpt={(gptName) => {
                handleSendMessage(`សូមចាប់ផ្តើមដើរតួជា ${gptName} និងពន្យល់ពីរបៀបដែលអ្នកអាចជួយខ្ញុំបាន។`, []);
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectChat={handleSelectChat}
        chats={chatHistoryItems}
      />

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
