import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Camera,
  X,
  Sparkles,
  Video
} from 'lucide-react';

export interface AttachedItem {
  id: string;
  name: string;
  type: 'file' | 'image';
  size?: string;
  mimeType?: string;
  data?: string; // Base64 representation
}

interface ComposerProps {
  onSendMessage: (text: string, attachments: AttachedItem[], mode?: 'chat' | 'image' | 'video') => void;
  isInitialCentered?: boolean;
  disabled?: boolean;
  onOpenVideoStudio?: () => void;
  onOpenImageStudio?: () => void;
}

// Custom Audio / Voice Waveform Icon (Modern 4-bar soundwave design)
const AudioVoiceIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="9" width="2.5" height="6" rx="1.25" />
    <rect x="8" y="5" width="2.5" height="14" rx="1.25" />
    <rect x="13" y="3" width="2.5" height="18" rx="1.25" />
    <rect x="18" y="7" width="2.5" height="10" rx="1.25" />
  </svg>
);

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isInitialCentered = false,
  disabled = false,
  onOpenVideoStudio,
  onOpenImageStudio,
}) => {
  const [text, setText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachedItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'image' | 'video'>('chat');
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Detect mode based on text prefix or manual selection
  useEffect(() => {
    const trimmed = text.trim().toLowerCase();
    if (
      trimmed.startsWith('/image') ||
      trimmed.startsWith('គូររូប') ||
      trimmed.startsWith('បង្កើតរូបភាព')
    ) {
      setActiveMode('image');
    } else if (
      trimmed.startsWith('/video') ||
      trimmed.startsWith('បង្កើតវីដេអូ') ||
      trimmed.startsWith('ធ្វើវីដេអូ')
    ) {
      setActiveMode('video');
    }
  }, [text]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech Recognition (Speech-to-Text) handler
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isRecording) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'km-KH';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition notice:', e);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        return () => {
          try {
            recognition.stop();
          } catch {}
        };
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsRecording(false);
      }
    }
  }, [isRecording]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendingRef = useRef(false);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || disabled || isSendingRef.current) return;
    isSendingRef.current = true;
    setTimeout(() => {
      isSendingRef.current = false;
    }, 450);

    onSendMessage(text.trim(), attachments, activeMode);
    setText('');
    setAttachments([]);
    setActiveMode('chat');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleVoiceModeClick = () => {
    if (isVoiceModeActive) {
      setIsVoiceModeActive(false);
      setIsRecording(false);
      setVoiceToast('មុខងារសន្ទនាជាសំឡេងត្រូវបានបិទ');
    } else {
      setIsVoiceModeActive(true);
      setIsRecording(true);
      setVoiceToast('មុខងារសន្ទនាជាសំឡេងត្រូវបានបើក៖ សូមនិយាយទៅកាន់ Omni AI');
    }
    setTimeout(() => setVoiceToast(null), 3000);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'file' | 'image'
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems: AttachedItem[] = [];
      for (const file of Array.from(files)) {
        try {
          const base64 = await readFileAsBase64(file);
          newItems.push({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            mimeType: file.type,
            data: base64,
          });
        } catch (err) {
          console.error('Failed to read file', err);
        }
      }
      setAttachments((prev) => [...prev, ...newItems]);
      setIsMenuOpen(false);
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerCamera = () => {
    setIsMenuOpen(false);
    imageInputRef.current?.click();
  };

  const selectImageMode = () => {
    setIsMenuOpen(false);
    setActiveMode('image');
    if (!text.startsWith('គូររូប:')) {
      setText('គូររូប: ');
    }
    textareaRef.current?.focus();
  };

  const selectVideoMode = () => {
    setIsMenuOpen(false);
    setActiveMode('video');
    if (!text.startsWith('បង្កើតវីដេអូ:')) {
      setText('បង្កើតវីដេអូ: ');
    }
    textareaRef.current?.focus();
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <div className="w-full max-w-[768px] mx-auto px-4 pb-3">
      {/* Hidden file inputs for functional upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, 'file')}
        className="hidden"
        multiple
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
        multiple
      />

      {/* Mode Badge indicator if active */}
      {activeMode !== 'chat' && (
        <div className="flex items-center gap-2 mb-2 px-2">
          {activeMode === 'image' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/80 shadow-2xs animate-in fade-in">
              <Sparkles size={13} className="text-blue-600" />
              <span>មុខងារបង្កើតរូបភាព (AI Image Mode)</span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('chat');
                  setText((prev) => prev.replace(/^គូររូប:\s*|^\/image\s*|^បង្កើតរូបភាព:\s*/, ''));
                }}
                className="ml-1 p-0.5 hover:text-blue-900 rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {activeMode === 'video' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200/80 shadow-2xs animate-in fade-in">
              <Video size={13} className="text-purple-600" />
              <span>មុខងារបង្កើតវីដេអូ (Omni Video Mode)</span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('chat');
                  setText((prev) => prev.replace(/^បង្កើតវីដេអូ:\s*|^\/video\s*/, ''));
                }}
                className="ml-1 p-0.5 hover:text-purple-900 rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attachments preview row floating above */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-3">
          {attachments.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white border border-zinc-200 rounded-full text-xs text-zinc-800 shadow-2xs animate-in fade-in"
            >
              {item.type === 'image' ? (
                <ImageIcon size={14} className="text-blue-500 shrink-0" />
              ) : (
                <FileText size={14} className="text-zinc-600 shrink-0" />
              )}
              <span className="max-w-[140px] truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(item.id)}
                className="p-0.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Pill-Shaped Floating Bar */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#f4f4f4] hover:bg-[#efefef] border border-zinc-200/90 shadow-sm hover:shadow-md focus-within:border-zinc-300 focus-within:bg-white focus-within:shadow-md transition-all duration-200">
        {/* Far Left: (+) Attachment & Action Button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isMenuOpen
                ? 'bg-zinc-300 text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/80'
            }`}
            title="ភ្ជាប់ឯកសារ រូបថត ឬបង្កើត Image/Video"
            aria-label="Add attachment or action"
          >
            <Plus size={19} strokeWidth={2.2} />
          </button>

          {/* Attachment Dropdown Menu with Image & Video Generation */}
          {isMenuOpen && (
            <div className="absolute bottom-12 sm:bottom-14 left-0 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 py-2 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100">
              {/* 1. បង្កើតរូបភាព AI (Image Generation) */}
              <button
                type="button"
                onClick={selectImageMode}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-800 hover:bg-blue-50/80 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">បង្កើតរូបភាព AI</div>
                  <div className="text-[11px] text-zinc-500">គូររូបភាពតាមការពិពណ៌នា</div>
                </div>
              </button>

              {/* 2. បង្កើតវីដេអូ AI (Video Generation) */}
              <button
                type="button"
                onClick={selectVideoMode}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-800 hover:bg-purple-50/80 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Video size={16} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">បង្កើតវីដេអូ AI (Omni Video)</div>
                  <div className="text-[11px] text-zinc-500">បម្លែងអត្ថបទទៅជាវីដេអូ</div>
                </div>
              </button>

              <div className="my-1.5 border-t border-zinc-100" />

              {/* 3. ភ្ជាប់ឯកសារ (Attach files) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="font-medium text-zinc-900">ភ្ជាប់ឯកសារ</div>
                  <div className="text-[11px] text-zinc-400">PDF, Word, Code, etc.</div>
                </div>
              </button>

              {/* 4. ផ្ទុករូបថតឡើង (Upload photos) */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <div className="font-medium text-zinc-900">ផ្ទុករូបថតឡើង</div>
                  <div className="text-[11px] text-zinc-400">JPG, PNG, WebP</div>
                </div>
              </button>

              {/* 5. កាមេរ៉ា (Camera) */}
              <button
                type="button"
                onClick={triggerCamera}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                  <Camera size={16} />
                </div>
                <div>
                  <div className="font-medium text-zinc-900">ថតរូបភ្លាមៗ</div>
                  <div className="text-[11px] text-zinc-400">ប្រើប្រាស់កាមេរ៉ា</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Center: Input area with placeholder 'សួរ Omni AI' */}
        <div className="flex-1 min-w-0 flex items-center px-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="សួរ Omni AI"
            className="w-full resize-none bg-transparent text-[15px] sm:text-[15.5px] leading-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-36 py-1 font-normal"
          />
        </div>

        {/* Far Right: Neatly aligned Microphone Icon & Custom Audio/Voice Button */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 1. Microphone Icon */}
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/80'
            }`}
            title={isRecording ? 'បញ្ឈប់ការថតសំឡេង' : 'បញ្ចូលសំឡេង (Voice input)'}
            aria-label="Microphone input"
          >
            <Mic size={18} strokeWidth={1.8} />
          </button>

          {/* 2. Custom Audio / Voice Waveform Button */}
          <button
            type="button"
            onClick={handleVoiceModeClick}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVoiceModeActive
                ? 'bg-blue-600 text-white shadow-sm animate-pulse'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/80'
            }`}
            title="សន្ទនាជាសំឡេង (Omni Voice Mode)"
            aria-label="Audio/Voice mode"
          >
            <AudioVoiceIcon size={18} />
          </button>

          {/* 3. Send Button (Transitions in when text or attachments are present) */}
          {canSend && (
            <button
              type="button"
              onClick={handleSend}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black hover:bg-zinc-800 text-white transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 animate-in fade-in zoom-in-90 duration-150 ml-0.5"
              title="ផ្ញើសារ (Send)"
              aria-label="Send message"
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* Voice feedback toast */}
      {voiceToast && (
        <div className="mt-2 text-center text-xs text-zinc-600 font-medium animate-in fade-in slide-in-from-bottom-1 duration-150">
          {voiceToast}
        </div>
      )}
    </div>
  );
};
