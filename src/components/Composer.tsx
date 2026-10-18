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
  Globe
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
  onSendMessage: (text: string, attachments: AttachedItem[]) => void;
  isInitialCentered?: boolean;
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isInitialCentered = false,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachedItem[]>([]);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap at 200px
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
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
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
            placeholder={disabled ? 'Omni AI កំពុងឆ្លើយតប...' : 'សួរ Omni AI អ្វីក៏បាន...'}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-48 disabled:opacity-60"
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
              title="ភ្ជាប់ឯកសារ ឬរូបថត"
              aria-label="Attach"
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>

            {/* Attachment Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute bottom-11 left-0 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100">
                {/* 1. ភ្ជាប់ឯកសារ (Attach files) */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">ភ្ជាប់ឯកសារ</div>
                    <div className="text-[11px] text-zinc-400">PDF, Word, Code, etc.</div>
                  </div>
                </button>

                {/* 2. ផ្ទុករូបថតឡើង (Upload photos) */}
                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">ផ្ទុករូបថតឡើង</div>
                    <div className="text-[11px] text-zinc-400">JPG, PNG, WebP</div>
                  </div>
                </button>

                {/* 3. កាមេរ៉ា (Camera) */}
                <button
                  type="button"
                  onClick={triggerCamera}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <Camera size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">ថតរូបភ្លាមៗ</div>
                    <div className="text-[11px] text-zinc-400">ប្រើប្រាស់កាមេរ៉ា</div>
                  </div>
                </button>

                {/* 4. Google Drive (Cloud storage) */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">Google Drive</div>
                    <div className="text-[11px] text-zinc-400">ភ្ជាប់ឯកសារ</div>
                  </div>
                </button>
              </div>
            )}

            {/* Search the web toggle pill */}
            <button
              type="button"
              onClick={() => setIsWebSearchActive(!isWebSearchActive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                isWebSearchActive
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
              title="ស្វែងរកតាមគេហទំព័រ"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">ស្វែងរក</span>
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
