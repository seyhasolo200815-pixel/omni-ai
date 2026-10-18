import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Camera,
  HardDrive,
  X,
  Globe,
  Sparkles,
  Video,
  Wand2
} from 'lucide-react';

export interface AttachedItem {
  id: string;
  name: string;
  type: 'file' | 'image';
  size?: string;
  mimeType?: string;
  data?: string; // Base64 representation for Gemini
}

interface ComposerProps {
  onSendMessage: (text: string, attachments: AttachedItem[], mode?: 'chat' | 'image' | 'video') => void;
  isInitialCentered?: boolean;
  disabled?: boolean;
  onOpenVideoStudio?: () => void;
  onOpenImageStudio?: () => void;
}

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
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'image' | 'video'>('chat');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Detect mode based on text prefix or manual selection
  useEffect(() => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed.startsWith('/image') || trimmed.startsWith('គូររូប') || trimmed.startsWith('បង្កើតរូបភាព')) {
      setActiveMode('image');
    } else if (trimmed.startsWith('/video') || trimmed.startsWith('បង្កើតវីដេអូ') || trimmed.startsWith('ធ្វើវីដេអូ')) {
      setActiveMode('video');
    }
  }, [text]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    onSendMessage(text.trim(), attachments, activeMode);
    setText('');
    setAttachments([]);
    setActiveMode('chat');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
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
            size: `${(file.size / 1024).toFixed(0)} KB`,
            mimeType: file.type || (type === 'image' ? 'image/png' : 'text/plain'),
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
    <div className="w-full max-w-[768px] mx-auto px-4">
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
        <div className="flex items-center gap-2 mb-1.5 px-2">
          {activeMode === 'image' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/80 shadow-2xs animate-in fade-in">
              <Sparkles size={12} className="text-blue-600" />
              <span>មុខងារបង្កើតរូបភាព (AI Image Mode)</span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('chat');
                  setText((prev) => prev.replace(/^គូររូប:\s*|^\/image\s*|^បង្កើតរូបភាព:\s*/, ''));
                }}
                className="ml-1 p-0.5 hover:text-blue-900"
              >
                <X size={11} />
              </button>
            </div>
          )}
          {activeMode === 'video' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200/80 shadow-2xs animate-in fade-in">
              <Video size={12} className="text-purple-600" />
              <span>មុខងារបង្កើតវីដេអូ (AI Video Mode - Google Veo)</span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('chat');
                  setText((prev) => prev.replace(/^បង្កើតវីដេអូ:\s*|^\/video\s*/, ''));
                }}
                className="ml-1 p-0.5 hover:text-purple-900"
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-[26px] bg-[#f4f4f4] border border-zinc-200/90 shadow-xs focus-within:border-zinc-300 focus-within:bg-white focus-within:shadow-md transition-all duration-150">
        {/* Attachments preview row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-1">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 shadow-2xs"
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
                  className="p-0.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Omni AI កំពុងឆ្លើយតប...'
                : activeMode === 'image'
                ? 'ពិពណ៌នារូបភាពដែលអ្នកចង់ឱ្យ AI គូរ (ឧ. ប្រាសាទអង្គរវត្តនាពេលថ្ងៃរះ)...'
                : activeMode === 'video'
                ? 'ពិពណ៌នាឈុតឆាកវីដេអូដែលអ្នកចង់ឱ្យ AI បង្កើត (ឧ. រថយន្តហោះក្នុងទីក្រុងពេលរាត្រី)...'
                : 'សួរ Omni AI អ្វីក៏បាន (ឬវាយ "គូររូប..." ឬ "បង្កើតវីដេអូ...")...'
            }
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-48 disabled:opacity-60 font-medium"
          />
        </div>

        {/* Bottom Bar: Action buttons */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left Actions: (+) Attachment Button & Web Search toggle */}
          <div className="flex items-center gap-1 relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-full transition-colors ${
                isMenuOpen
                  ? 'bg-zinc-300 text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
              title="ភ្ជាប់ឯកសារ រូបថត ឬបង្កើត Image/Video"
              aria-label="Attach"
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>

            {/* Attachment Dropdown Menu with Image & Video Generation */}
            {isMenuOpen && (
              <div className="absolute bottom-11 left-0 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 py-2 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100">
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
                    <div className="font-semibold text-zinc-900">បង្កើតវីដេអូ AI (Veo)</div>
                    <div className="text-[11px] text-zinc-500">បម្លែងអត្ថបទទៅជាវីដេអូ</div>
                  </div>
                </button>

                <div className="my-1.5 border-t border-zinc-100" />

                {/* 3. ភ្ជាប់ឯកសារ (Attach files) */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
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
                  onClick={() => {
                    imageInputRef.current?.click();
                  }}
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

            {/* Quick Action Chips */}
            <button
              type="button"
              onClick={selectImageMode}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeMode === 'image'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
              title="បង្កើតរូបភាព AI"
            >
              <Sparkles size={13} className={activeMode === 'image' ? 'text-white' : 'text-blue-600'} />
              <span className="hidden sm:inline">រូបភាព</span>
            </button>

            <button
              type="button"
              onClick={selectVideoMode}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeMode === 'video'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
              title="បង្កើតវីដេអូ AI"
            >
              <Video size={13} className={activeMode === 'video' ? 'text-white' : 'text-purple-600'} />
              <span className="hidden sm:inline">វីដេអូ</span>
            </button>

            {/* Search the web toggle pill */}
            <button
              type="button"
              onClick={() => setIsWebSearchActive(!isWebSearchActive)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                isWebSearchActive
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
              title="ស្វែងរកតាមគេហទំព័រ"
            >
              <Globe size={14} />
              <span>ស្វែងរក</span>
            </button>
          </div>

          {/* Right Actions: Voice Mic + Circular Send Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
              title={isRecording ? 'បញ្ឈប់ការថតសំឡេង' : 'បញ្ចូលសំឡេង'}
              aria-label="Voice input"
            >
              <Mic size={18} strokeWidth={1.8} />
            </button>

            {/* Circular Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
                canSend
                  ? 'bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-xs cursor-pointer'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
              title="ផ្ញើសារ"
              aria-label="Send message"
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="py-2 text-center text-[11px] text-zinc-400 tracking-tight select-none">
        Omni AI អាចមានកំហុស។ សូមផ្ទៀងផ្ទាត់ព័ត៌មានសំខាន់ៗ។
      </div>
    </div>
  );
};
