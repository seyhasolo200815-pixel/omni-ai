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
  AlertCircle,
  Download,
  Maximize2,
  Play,
  Pause,
  Video,
  Film,
  X,
  Share2
} from 'lucide-react';
import { marked } from 'marked';
import { Composer, AttachedItem } from './Composer';
import { OmniLogo } from './OmniLogo';

export interface GeneratedImageData {
  url: string;
  prompt: string;
  aspectRatio?: string;
}

export interface GeneratedVideoData {
  url?: string;
  operationName?: string;
  prompt: string;
  aspectRatio?: string;
  status: 'generating' | 'ready' | 'error';
  error?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'system';
  content: string;
  thought?: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: boolean;
  attachments?: AttachedItem[];
  generatedImage?: GeneratedImageData;
  generatedVideo?: GeneratedVideoData;
  generationType?: 'text' | 'image' | 'video';
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string, attachments: AttachedItem[], mode?: 'chat' | 'image' | 'video') => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  selectedModelName?: string;
  onOpenVideoStudio?: () => void;
  onOpenImageStudio?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  onRegenerate,
  isLoading = false,
  selectedModelName = 'Omni 5.5',
  onOpenVideoStudio,
  onOpenImageStudio,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [openThoughts, setOpenThoughts] = useState<Record<string, boolean>>({});
  const [activeModalImage, setActiveModalImage] = useState<GeneratedImageData | null>(null);
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      {isEmpty ? (
        /* Empty Welcome Screen: Spacious, centered, minimalist */
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-4xl mx-auto -mt-6">
          {/* Centered Omni Logo & Welcome Heading */}
          <div className="text-center mb-6 select-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center mx-auto mb-4 shadow-md border border-indigo-900/40">
              <OmniLogo size={36} />
            </div>
            <h1 className="text-[28px] md:text-[34px] font-bold text-black tracking-tight leading-snug">
              តើថ្ងៃនេះខ្ញុំអាចជួយអ្វីអ្នកបានខ្លះ?
            </h1>
          </div>

          {/* Centered Composer */}
          <div className="w-full">
            <Composer
              onSendMessage={onSendMessage}
              isInitialCentered={true}
              disabled={isLoading}
              onOpenVideoStudio={onOpenVideoStudio}
              onOpenImageStudio={onOpenImageStudio}
            />
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
                        <div className="bg-[#f0f0f2] text-black font-semibold rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed shadow-2xs inline-block text-left break-words">
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
                    /* System / Omni AI Message Row */
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
                      onOpenImageModal={(data) => setActiveModalImage(data)}
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Fixed Composer */}
          <div className="w-full bg-white pt-2 border-t border-transparent">
            <Composer
              onSendMessage={onSendMessage}
              isInitialCentered={false}
              disabled={isLoading}
              onOpenVideoStudio={onOpenVideoStudio}
              onOpenImageStudio={onOpenImageStudio}
            />
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {activeModalImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-xs font-semibold">រូបភាពបង្កើតដោយ Omni AI</span>
                {activeModalImage.aspectRatio && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 font-mono">
                    {activeModalImage.aspectRatio}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeModalImage.url}
                  download="omni-ai-image.png"
                  className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>ទាញយករូបភាព</span>
                </a>
                <button
                  onClick={() => setActiveModalImage(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900/50">
              <img
                src={activeModalImage.url}
                alt={activeModalImage.prompt}
                className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>

            {activeModalImage.prompt && (
              <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 text-zinc-300 text-xs font-medium">
                <span className="text-zinc-500 font-normal">Prompt: </span>
                {activeModalImage.prompt}
              </div>
            )}
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
  onOpenImageModal: (data: GeneratedImageData) => void;
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
  onOpenImageModal,
}) => {
  const isImageGen = msg.generationType === 'image' || !!msg.generatedImage;
  const isVideoGen = msg.generationType === 'video' || !!msg.generatedVideo;

  // Show thinking indicator only while waiting for initial content
  const isThinkingOnly = msg.isStreaming && !msg.content && !msg.thought && !msg.generatedImage && !msg.generatedVideo;

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
                <span className="text-xs font-semibold text-zinc-800">
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

        {/* Initial Thinking Indicator */}
        {isThinkingOnly && (
          <div className="flex items-center gap-2.5 py-1 text-zinc-900 text-xs font-semibold">
            <OmniLogo size={18} animated={true} className="shrink-0" />
            <div className="flex items-center gap-1.5">
              <span>
                {isImageGen
                  ? 'Omni AI កំពុងគូររូបភាព...'
                  : isVideoGen
                  ? 'Omni AI កំពុងបង្កើតវីដេអូ...'
                  : 'Omni AI កំពុងគិត'}
              </span>
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
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{msg.content}</span>
          </div>
        )}

        {/* Generated Image Card */}
        {msg.generatedImage && (
          <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-sm max-w-lg">
            <div className="relative group cursor-pointer" onClick={() => onOpenImageModal(msg.generatedImage!)}>
              <img
                src={msg.generatedImage.url}
                alt={msg.generatedImage.prompt}
                className="w-full h-auto object-cover max-h-[450px]"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenImageModal(msg.generatedImage!);
                  }}
                  className="p-2.5 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-105"
                  title="ពង្រីកពេញអេក្រង់"
                >
                  <Maximize2 size={16} />
                </button>
                <a
                  href={msg.generatedImage.url}
                  download="omni-ai-image.png"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-105"
                  title="ទាញយករូបភាព"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>

            <div className="p-3 border-t border-zinc-100 bg-[#fafafa] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                  <Sparkles size={12} />
                  <span>Omni Image</span>
                </span>
                <span className="text-zinc-600 truncate">{msg.generatedImage.prompt}</span>
              </div>
              <a
                href={msg.generatedImage.url}
                download="omni-ai-image.png"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-[11px] font-semibold transition-colors shrink-0"
              >
                <Download size={12} />
                <span>ទាញយក</span>
              </a>
            </div>
          </div>
        )}

        {/* Generated Video Card */}
        {msg.generatedVideo && (
          <VideoMessageCard videoData={msg.generatedVideo} />
        )}

        {/* Rendered Markdown Text */}
        {!msg.error && msg.content && (
          <div className="relative">
            <div
              className="text-[15.5px] leading-relaxed text-zinc-900 font-medium prose prose-zinc max-w-none break-words"
              dangerouslySetInnerHTML={{
                __html: marked.parse(msg.content),
              }}
            />
            {msg.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-blue-600 ml-1 animate-pulse align-middle rounded-xs" />
            )}
          </div>
        )}

        {/* Actions underneath AI response */}
        {!msg.isStreaming && !msg.error && (msg.content || msg.generatedImage || msg.generatedVideo) && (
          <div className="flex items-center gap-2 pt-1 text-zinc-500 text-xs">
            {msg.content && (
              <button
                onClick={onCopy}
                className="p-1.5 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1 font-medium"
                title="ចម្លងចម្លើយ"
              >
                {isCopied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-[11px] text-emerald-600 font-semibold">បានចម្លង</span>
                  </>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}

            {msg.content && (
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
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1 font-medium"
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

// Interactive Video Message Player Card
const VideoMessageCard: React.FC<{ videoData: GeneratedVideoData }> = ({ videoData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  if (videoData.status === 'generating') {
    return (
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 p-5 max-w-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center animate-pulse">
            <Film size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-900">
              ម៉ាស៊ីន Omni Video Studio កំពុង Render វីដេអូ...
            </div>
            <div className="text-xs text-zinc-600">
              ដំណើរការ Text-to-Video គុណភាពខ្ពស់ 1080p
            </div>
          </div>
        </div>

        <div className="w-full bg-purple-200/60 rounded-full h-1.5 overflow-hidden mb-3">
          <div className="bg-purple-600 h-full w-2/3 animate-[pulse_1.5s_infinite]" />
        </div>

        <p className="text-xs text-zinc-700 italic font-medium">
          "{videoData.prompt}"
        </p>
      </div>
    );
  }

  if (videoData.status === 'error') {
    return (
      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2.5 max-w-lg">
        <AlertCircle size={16} className="text-red-600 shrink-0" />
        <span>{videoData.error || 'មានបញ្ហាក្នុងការបង្កើតវីដេអូ'}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-black shadow-md max-w-lg">
      <div className="relative group aspect-video bg-black flex items-center justify-center">
        {videoData.url ? (
          <video
            ref={videoRef}
            src={videoData.url}
            className="w-full h-full object-contain"
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="text-white text-xs flex items-center gap-2">
            <Video size={16} />
            <span>វីដេអូកំពុងរៀបចំ...</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-200">
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="inline-flex items-center gap-1 font-semibold text-purple-400">
            <Video size={13} />
            <span>Omni Video</span>
          </span>
          <span className="text-zinc-400 truncate">{videoData.prompt}</span>
        </div>
        {videoData.url && (
          <a
            href={videoData.url}
            download="omni-ai-video.mp4"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors shrink-0"
          >
            <Download size={12} />
            <span>ទាញយក MP4</span>
          </a>
        )}
      </div>
    </div>
  );
};
