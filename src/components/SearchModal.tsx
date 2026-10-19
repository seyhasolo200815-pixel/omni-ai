import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, ArrowRight } from 'lucide-react';
import { ChatHistoryItem } from './Sidebar';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (id: string) => void;
  chats?: ChatHistoryItem[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectChat,
  chats = [],
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200">
          <Search size={19} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ស្វែងរកការសន្ទនា..."
            className="flex-1 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded bg-zinc-100"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {query ? 'លទ្ធផលស្វែងរក' : 'ការសន្ទនាថ្មីៗ'}
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-0.5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectChat(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#f4f4f4] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare size={16} className="text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                    <span className="text-[13.5px] text-zinc-800 truncate">
                      {item.title}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-700 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400 text-xs">
              {chats.length === 0
                ? 'មិនទាន់មានប្រវត្តិជជែកសម្រាប់ការស្វែងរកទេ'
                : `រកមិនឃើញការសន្ទនាដែលត្រូវគ្នានឹង "${query}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
