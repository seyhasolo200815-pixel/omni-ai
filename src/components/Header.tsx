import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  SquarePen,
  ChevronDown,
  Check,
  Share2,
  Sparkles,
  Zap,
  Clock,
  MoreHorizontal,
  Settings
} from 'lucide-react';

export type OmniModelType = '3.8-flash' | '3.5-flash-lite';
export type GeminiModelType = OmniModelType;
export type ThinkingLevelType = 'low' | 'medium' | 'high';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedModel: OmniModelType;
  onSelectModel: (model: OmniModelType) => void;
  thinkingLevel: ThinkingLevelType;
  onSelectThinkingLevel: (level: ThinkingLevelType) => void;
  isTemporaryChat: boolean;
  onToggleTemporaryChat: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onNewChat,
  selectedModel,
  onSelectModel,
  thinkingLevel,
  onSelectThinkingLevel,
  isTemporaryChat,
  onToggleTemporaryChat,
  onOpenSettings,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modelConfigs: Record<
    GeminiModelType,
    { name: string; subtitle: string; desc: string; icon: any }
  > = {
    '3.8-flash': {
      name: 'Omni 5.5',
      subtitle: 'ម៉ូដែលឆ្លាតវៃកម្រិតខ្ពស់ (Flagship)',
      desc: 'សម្រាប់ការវិភាគស៊ីជម្រៅ និងការឆ្លើយតបកម្រិតខ្ពស់',
      icon: Sparkles,
    },
    '3.5-flash-lite': {
      name: 'Omni Flash',
      subtitle: 'ម៉ូដែលល្បឿនលឿន (Fast & Resilient)',
      desc: 'ឆ្លើយតបភ្លាមៗ ល្បឿនលឿនទាន់ចិត្ត និងមានស្ថិរភាពខ្ពស់',
      icon: Zap,
    },
  };

  const handleShareClick = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2200);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-4 bg-white border-b border-[#ececec]">
      {/* 1. Left: Sidebar Toggle Button */}
      <div className="flex items-center min-w-[80px] sm:min-w-[120px] justify-start">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-[#ececec] rounded-lg transition-colors shrink-0"
          title={isSidebarOpen ? 'បិទរបារចំហៀង' : 'បើករបារចំហៀង'}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={19} strokeWidth={1.8} />
        </button>
      </div>

      {/* 2. Center: Model Selector showing 'Omni Flash' or 'Omni 5.5' with neat dropdown arrow */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => {
              setModelDropdownOpen(!modelDropdownOpen);
              setMoreMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#ececec] text-zinc-800 transition-colors group cursor-pointer"
            aria-label="ជ្រើសរើសម៉ូដែល"
          >
            <span className="font-semibold text-[15px] sm:text-[16px] text-zinc-900 tracking-tight">
              {modelConfigs[selectedModel].name}
            </span>
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`text-zinc-400 group-hover:text-zinc-700 transition-transform duration-200 ${
                modelDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-76 sm:w-84 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-2 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ជ្រើសរើសម៉ូដែល OMNI AI
              </div>

              {/* Omni 5.5 */}
              <button
                onClick={() => {
                  onSelectModel('3.8-flash');
                  setModelDropdownOpen(false);
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-colors text-left ${
                  selectedModel === '3.8-flash'
                    ? 'bg-[#f4f4f4] text-zinc-950 font-medium'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <div className="p-1.5 bg-zinc-100 rounded-lg shrink-0 mt-0.5 text-zinc-800">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">Omni 5.5</span>
                    {selectedModel === '3.8-flash' && (
                      <Check size={16} className="text-zinc-900 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11.5px] text-zinc-500 font-normal mt-0.5">
                    {modelConfigs['3.8-flash'].desc}
                  </div>
                </div>
              </button>

              {/* Omni Flash */}
              <button
                onClick={() => {
                  onSelectModel('3.5-flash-lite');
                  setModelDropdownOpen(false);
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-colors text-left ${
                  selectedModel === '3.5-flash-lite'
                    ? 'bg-[#f4f4f4] text-zinc-950 font-medium'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <div className="p-1.5 bg-zinc-100 rounded-lg shrink-0 mt-0.5 text-zinc-800">
                  <Zap size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">Omni Flash</span>
                    {selectedModel === '3.5-flash-lite' && (
                      <Check size={16} className="text-zinc-900 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11.5px] text-zinc-500 font-normal mt-0.5">
                    {modelConfigs['3.5-flash-lite'].desc}
                  </div>
                </div>
              </button>

              {/* Divider & Thinking Level Selection */}
              <div className="h-px bg-zinc-200/70 my-1.5" />
              <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>កម្រិតនៃការគិត (Thinking Level)</span>
                <span className="text-zinc-700 font-medium lowercase">
                  {thinkingLevel === 'high' ? 'ខ្ពស់' : thinkingLevel === 'medium' ? 'មធ្យម' : 'ទាប'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100/80 rounded-xl mt-1">
                {(['low', 'medium', 'high'] as ThinkingLevelType[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onSelectThinkingLevel(lvl)}
                    className={`py-1 text-xs rounded-lg font-medium transition-all ${
                      thinkingLevel === lvl
                        ? 'bg-white text-zinc-950 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {lvl === 'high' ? 'ខ្ពស់' : lvl === 'medium' ? 'មធ្យម' : 'ទាប'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: Pill-shaped container holding pen/edit icon + three-dots menu icon (...) */}
      <div className="flex items-center min-w-[80px] sm:min-w-[120px] justify-end relative">
        <div className="inline-flex items-center gap-0.5 p-1 bg-[#f4f4f4] hover:bg-[#ececec] rounded-full border border-zinc-200/70 transition-colors shadow-2xs">
          {/* Pen / Edit Icon (New chat) */}
          <button
            onClick={onNewChat}
            className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-white rounded-full transition-all"
            title="ជជែកថ្មី (New Chat)"
            aria-label="New Chat"
          >
            <SquarePen size={16} strokeWidth={1.8} />
          </button>

          {/* Three-dots menu icon (...) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => {
                setMoreMenuOpen(!moreMenuOpen);
                setModelDropdownOpen(false);
              }}
              className={`p-1.5 rounded-full transition-all ${
                moreMenuOpen
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white'
              }`}
              title="ជម្រើសបន្ថែម"
              aria-label="More Options"
            >
              <MoreHorizontal size={17} strokeWidth={1.8} />
            </button>

            {moreMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-150">
                {/* Temporary Chat Toggle */}
                <button
                  onClick={() => {
                    onToggleTemporaryChat();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock
                      size={16}
                      className={isTemporaryChat ? 'text-amber-600' : 'text-zinc-500'}
                    />
                    <span className="text-zinc-800">ការជជែកបណ្តោះអាសន្ន</span>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      isTemporaryChat
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {isTemporaryChat ? 'បើក' : 'បិទ'}
                  </span>
                </button>

                {/* Share Option */}
                <button
                  onClick={() => {
                    handleShareClick();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors text-left"
                >
                  <Share2 size={16} className="text-zinc-500" />
                  <span className="text-zinc-800">ចែករំលែកការសន្ទនា</span>
                </button>

                {/* Settings Option */}
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors text-left"
                  >
                    <Settings size={16} className="text-zinc-500" />
                    <span className="text-zinc-800">ការកំណត់ (Settings)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Temporary Chat badge if active */}
        {isTemporaryChat && (
          <span className="absolute -bottom-5 right-1 hidden sm:inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            បណ្តោះអាសន្ន
          </span>
        )}

        {shareToast && (
          <div className="absolute right-0 top-12 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in duration-150 z-50">
            តំណភ្ជាប់ត្រូវបានចម្លង!
          </div>
        )}
      </div>
    </header>
  );
};
