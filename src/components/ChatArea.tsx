import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Brain,
  AlertCircle
} from 'lucide-react';
import { marked } from 'marked';
import { Composer, AttachedItem } from './Composer';
import { OmniLogo } from './OmniLogo';

export interface Message {
  id: string;
  sender: 'user' | 'system';
  content: string;
  thought?: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: boolean;
  attachments?: AttachedItem[];
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string, attachments: AttachedItem[]) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  selectedModelName?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  onRegenerate,
  isLoading = false,
  selectedModelName = 'Gemini 3.8 Flash',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [openThoughts, setOpenThoughts] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message or stream chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleThought = (id: string) => {
    setOpenThoughts((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? true : !prev[id],
    }));
  };

  const isEmpty = messages.length === 0;

  // Quick suggestion prompts for user testing
  const suggestions = [
    {
      title: 'វិភាគកូដ React & TypeScript',
      prompt: 'សូមពន្យល់ពីគន្លឹះ Optimize Performance ក្នុង React 19 និង TypeScript ជាមួយនឹងកូដគំរូ',
    },
    {
      title: 'សរសេរអត្ថបទទីផ្សារ (Copywriting)',
      prompt: 'សូមជួយសរសេរ Copywriting ទាក់ទាញសម្រាប់យុទ្ធនាការបើកលក់ផលិតផលបច្ចេកវិទ្យាថ្មីជាភាសាខ្មែរ',
    },
    {
      title: 'ដោះស្រាយ និងពន្យល់បញ្ហាស្មុគស្មាញ',
      prompt: 'តើ Google Gemini ដំណើរការ Thinking Process យ៉ាងដូចម្តេចដើម្បីវិភាគបញ្ហាស្មុគស្មាញ?',
    },
    {
      title: 'រៀបចំយុទ្ធសាស្ត្រអាជីវកម្ម',
      prompt: 'សូមរៀបចំផែនការអាជីវកម្ម Digital Startup នៅកម្ពុជាសម្រាប់រយៈពេល ១ ឆ្នាំដំបូង',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      {isEmpty ? (
        /* Empty Welcome Screen: Spacious, centered, minimalist with quick prompts */
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-4xl mx-auto -mt-6">
          {/* Centered Omni Logo & Welcome Heading */}
          <div className="text-center mb-7 select-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center mx-auto mb-4 shadow-md border border-indigo-900/40">
              <OmniLogo size={36} />
            </div>
            <h1 className="text-[28px] md:text-[34px] font-bold text-black tracking-tight leading-snug">
              តើថ្ងៃនេះខ្ញុំអាចជួយអ្វីអ្នកបានខ្លះ?
            </h1>
            <p className="text-xs text-zinc-600 mt-1.5 font-medium">
              ដំណើរការដោយខួរក្បាលឆ្លាតវៃពិតប្រាកដរបស់ Google {selectedModelName}
            </p>
          </div>

          {/* Centered Composer */}
          <div className="w-full">
            <Composer onSendMessage={onSendMessage} isInitialCentered={true} disabled={isLoading} />
          </div>

          {/* Clean Suggestion Cards */}
          <div className="w-full max-w-[768px] grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 px-4">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(sug.prompt, [])}
                className="p-3 text-left border border-zinc-300 rounded-2xl hover:border-zinc-400 hover:bg-[#f8f8fa] transition-all group shadow-2xs"
              >
                <div className="text-[13.5px] font-bold text-black group-hover:text-black truncate">
                  {sug.title}
                </div>
                <div className="text-[12px] text-zinc-600 font-normal line-clamp-1 mt-0.5">
                  {sug.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Active Conversation Flow */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-[768px] mx-auto space-y-7">
              {messages.map((msg) => (
                <div key={msg.id} className="group">
                  {msg.sender === 'user' ? (
                    /* User Message Row */
                    <div className="flex justify-end">
                      <div className="max-w-[85%] md:max-w-[75%] space-y-2">
                        {/* Attachments if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end mb-1">
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="px-3 py-1.5 bg-[#f0f0f2] border border-zinc-300 rounded-xl text-xs text-zinc-900 font-medium flex items-center gap-1.5"
                              >
                                {att.type === 'image' && att.data ? (
                                  <img
                                    src={`data:${att.mimeType || 'image/png'};base64,${att.data}`}
                                    alt={att.name}
                                    className="w-5 h-5 rounded object-cover"
                                  />
                                ) : null}
                                <span className="max-w-[150px] truncate">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* User Message Bubble */}
                        <div className="bg-[#f0f0f2] text-black font-medium rounded-[20px] px-4 py-2.5 text-[15.5px] leading-relaxed shadow-2xs inline-block text-left break-words">
                          {msg.content}
                        </div>

                        {/* Hover Actions */}
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-400 pr-1">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="p-1 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
                            title="ចម្លងអត្ថបទ"
                          >
                            {copiedId === msg.id ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* System / Omni AI Message Row with Fluid Typing Effect */
                    <AssistantMessageItem
                      key={msg.id}
                      msg={msg}
                      isThoughtOpen={!!openThoughts[msg.id]}
                      onToggleThought={() => toggleThought(msg.id)}
                      onCopy={() => handleCopy(msg.content, msg.id)}
                      isCopied={copiedId === msg.id}
                      onSpeak={() => handleSpeak(msg.content, msg.id)}
                      isSpeaking={speakingId === msg.id}
                      onRegenerate={onRegenerate}
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Fixed Composer */}
          <div className="w-full bg-white pt-2 border-t border-transparent">
            <Composer onSendMessage={onSendMessage} isInitialCentered={false} disabled={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

interface AssistantMessageItemProps {
  msg: Message;
  isThoughtOpen: boolean;
  onToggleThought: () => void;
  onCopy: () => void;
  isCopied: boolean;
  onSpeak: () => void;
  isSpeaking: boolean;
  onRegenerate?: () => void;
}

const AssistantMessageItem: React.FC<AssistantMessageItemProps> = ({
  msg,
  isThoughtOpen,
  onToggleThought,
  onCopy,
  isCopied,
  onSpeak,
  isSpeaking,
  onRegenerate,
}) => {
  // Fluid typing effect state
  const [displayedText, setDisplayedText] = useState(msg.content || '');
  const targetTextRef = useRef(msg.content || '');
  targetTextRef.current = msg.content || '';

  // Typewriter interpolator
  useEffect(() => {
    if (!msg.isStreaming) {
      setDisplayedText(msg.content || '');
      return;
    }

    // High frequency ticker (~60 updates/sec)
    const interval = setInterval(() => {
      const target = targetTextRef.current;
      setDisplayedText((prev) => {
        if (prev.length >= target.length) {
          return target;
        }
        // Adaptive step: smooth character-by-character rollout
        const diff = target.length - prev.length;
        const step = diff > 90 ? 12 : diff > 40 ? 6 : diff > 15 ? 3 : 1;
        return target.slice(0, prev.length + step);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [msg.isStreaming]);

  const isThinkingOnly = msg.isStreaming && !displayedText && !msg.thought;

  return (
    <div className="flex items-start gap-3.5">
      {/* Omni AI Avatar - Clean borderless/subtle container with official colorful Logo */}
      <div className="w-7 h-7 rounded-full bg-white border border-zinc-200/90 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
        <OmniLogo size={20} />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Thinking Accordion (Collapsible) */}
        {msg.thought && (
          <div className="border border-zinc-200/90 rounded-xl overflow-hidden bg-[#fafafa]">
            <button
              onClick={onToggleThought}
              className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-zinc-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-purple-600" />
                <span className="text-xs font-medium text-zinc-700">
                  ដំណើរការគិត (Thinking Process)
                </span>
                {msg.isStreaming && !msg.content && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                )}
              </div>
              {isThoughtOpen ? (
                <ChevronDown size={14} className="text-zinc-400" />
              ) : (
                <ChevronRight size={14} className="text-zinc-400" />
              )}
            </button>

            {isThoughtOpen && (
              <div className="px-3.5 py-2.5 text-xs text-zinc-800 border-t border-zinc-200/60 bg-white leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                {msg.thought}
              </div>
            )}
          </div>
        )}

        {/* Initial Thinking Indicator: Omni Logo + Bouncing Typing Dots (No Black Circle!) */}
        {isThinkingOnly && (
          <div className="flex items-center gap-2.5 py-1 text-zinc-800 text-xs font-medium">
            <OmniLogo size={18} animated={true} className="shrink-0" />
            <div className="flex items-center gap-1.5">
              <span>Omni AI កំពុងគិត</span>
              <span className="inline-flex items-center gap-1 ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
              </span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {msg.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{msg.content}</span>
          </div>
        )}

        {/* Rendered Markdown with Fluid Typing Animation & Blinking Cursor */}
        {!msg.error && displayedText && (
          <div className="relative">
            <div
              className="text-[15.5px] leading-relaxed text-zinc-900 prose prose-zinc max-w-none break-words"
              dangerouslySetInnerHTML={{
                __html: marked.parse(displayedText),
              }}
            />
            {msg.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-blue-600 ml-1 animate-pulse align-middle rounded-xs" />
            )}
          </div>
        )}

        {/* Actions underneath AI response (Visible after streaming completes) */}
        {!msg.isStreaming && !msg.error && msg.content && (
          <div className="flex items-center gap-2 pt-1 text-zinc-400 text-xs">
            <button
              onClick={onCopy}
              className="p-1.5 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1"
              title="ចម្លងចម្លើយ"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-medium">បានចម្លង</span>
                </>
              ) : (
                <Copy size={14} />
              )}
            </button>

            <button
              onClick={onSpeak}
              className={`p-1.5 rounded-lg transition-colors ${
                isSpeaking
                  ? 'text-blue-600 bg-blue-50'
                  : 'hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title={isSpeaking ? 'បញ្ឈប់ការអាន' : 'អានឮៗ'}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1"
                title="បង្កើតចម្លើយឡើងវិញ"
              >
                <RotateCw size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
