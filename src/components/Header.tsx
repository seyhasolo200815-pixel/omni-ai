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
  Brain,
  Sliders
} from 'lucide-react';

export type GeminiModelType = '3.8-flash' | '3.5-flash-lite';
export type ThinkingLevelType = 'low' | 'medium' | 'high';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedModel: GeminiModelType;
  onSelectModel: (model: GeminiModelType) => void;
  thinkingLevel: ThinkingLevelType;
  onSelectThinkingLevel: (level: ThinkingLevelType) => void;
  isTemporaryChat: boolean;
  onToggleTemporaryChat: () => void;
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
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [thinkingDropdownOpen, setThinkingDropdownOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const thinkingDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (thinkingDropdownRef.current && !thinkingDropdownRef.current.contains(e.target as Node)) {
        setThinkingDropdownOpen(false);
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
      subtitle: 'ម៉ូដែលគោល (Active Model)',
      desc: 'ម៉ូដែលឆ្លាតវៃកម្រិតខ្ពស់បំផុត បំពាក់នូវសមត្ថភាពគិតវិភាគស៊ីជម្រៅ ការដោះស្រាយបញ្ហា និងការសរសេរកូដស្មុគស្មាញ (ស្វ័យប្រវត្តិ Fallback បើជួបបន្ទុកខ្ពស់)',
      icon: Sparkles,
    },
    '3.5-flash-lite': {
      name: 'Omni Flash',
      subtitle: 'ម៉ូដែលល្បឿនលឿន (Fast & Resilient)',
      desc: 'ម៉ូដែលល្បឿនលឿនទាន់ចិត្ត និងមានស្ថិរភាពខ្ពស់ ឆ្លើយតបភ្លាមៗដោយគ្មានការរង់ចាំ និងជាម៉ូដែលបម្រុងស្វ័យប្រវត្តិ',
      icon: Zap,
    },
  };

  const thinkingLabels: Record<ThinkingLevelType, { label: string; desc: string }> = {
    high: {
      label: 'ខ្ពស់ (High)',
      desc: 'គិតស៊ីជម្រៅ និងជាក់លាក់ខ្ពស់',
    },
    medium: {
      label: 'មធ្យម (Medium)',
      desc: 'ល្បឿន និងភាពត្រឹមត្រូវសមតុល្យ',
    },
    low: {
      label: 'ទាប (Low)',
      desc: 'ឆ្លើយតបលឿនបំផុត',
    },
  };

  const handleShareClick = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2200);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3.5 bg-white border-b border-[#ececec]">
      {/* Left zone: Sidebar toggle + Model Selector + Thinking Level Selector */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-[#ececec] rounded-lg transition-colors shrink-0"
          title={isSidebarOpen ? 'បិទរបារចំហៀង' : 'បើករបារចំហៀង'}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={19} strokeWidth={1.8} />
        </button>

        {!isSidebarOpen && (
          <button
            onClick={onNewChat}
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-[#ececec] rounded-lg transition-colors hidden sm:flex shrink-0"
            title="ជជែកថ្មី"
          >
            <SquarePen size={19} strokeWidth={1.8} />
          </button>
        )}

        {/* 1. Model Selector Dropdown */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => {
              setModelDropdownOpen(!modelDropdownOpen);
              setThinkingDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-[#ececec] text-zinc-800 transition-colors group cursor-pointer"
          >
            <span className="font-semibold text-[14px] sm:text-[15.5px] text-zinc-900 tracking-tight">
              {modelConfigs[selectedModel].name}
            </span>
            <ChevronDown
              size={15}
              className={`text-zinc-400 group-hover:text-zinc-700 transition-transform duration-200 ${
                modelDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-zinc-200 p-2 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                ជ្រើសរើសម៉ូដែល OMNI AI
              </div>

              {/* 3.8 Flash */}
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
                    <span className="font-semibold text-zinc-900">3.8 Flash</span>
                    {selectedModel === '3.8-flash' && (
                      <Check size={16} className="text-zinc-900 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11.5px] text-zinc-500 font-normal mt-0.5">
                    សម្រាប់ការឆ្លើយតបកម្រិតខ្ពស់ និងការវិភាគស៊ីជម្រៅ
                  </div>
                </div>
              </button>

              {/* 3.5 Flash-Lite */}
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
                    <span className="font-semibold text-zinc-900">3.5 Flash-Lite</span>
                    {selectedModel === '3.5-flash-lite' && (
                      <Check size={16} className="text-zinc-900 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11.5px] text-zinc-500 font-normal mt-0.5">
                    សម្រាប់ល្បឿនលឿន និងសន្សំសំចៃ
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 2. Thinking Level Control */}
        <div className="relative" ref={thinkingDropdownRef}>
          <button
            onClick={() => {
              setThinkingDropdownOpen(!thinkingDropdownOpen);
              setModelDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-medium transition-colors"
            title="កំណត់កម្រិតនៃការគិតរបស់ AI (Thinking Level)"
          >
            <Brain size={14} className="text-zinc-600 shrink-0" />
            <span className="hidden sm:inline">កម្រិតគិត:</span>
            <span className="text-zinc-900 font-semibold">
              {thinkingLevel === 'high' ? 'ខ្ពស់' : thinkingLevel === 'medium' ? 'មធ្យម' : 'ទាប'}
            </span>
            <ChevronDown size={13} className="text-zinc-400" />
          </button>

          {thinkingDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-zinc-200 p-2 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                កម្រិតនៃការគិត (THINKING LEVEL)
              </div>

              {/* High */}
              <button
                onClick={() => {
                  onSelectThinkingLevel('high');
                  setThinkingDropdownOpen(false);
                }}
                className={`w-full flex items-start gap-2.5 p-2 rounded-xl transition-colors text-left ${
                  thinkingLevel === 'high'
                    ? 'bg-[#f4f4f4] text-zinc-950 font-medium'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">ខ្ពស់ (High)</span>
                    {thinkingLevel === 'high' && <Check size={15} className="text-zinc-900" />}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {thinkingLabels.high.desc}
                  </div>
                </div>
              </button>

              {/* Medium */}
              <button
                onClick={() => {
                  onSelectThinkingLevel('medium');
                  setThinkingDropdownOpen(false);
                }}
                className={`w-full flex items-start gap-2.5 p-2 rounded-xl transition-colors text-left ${
                  thinkingLevel === 'medium'
                    ? 'bg-[#f4f4f4] text-zinc-950 font-medium'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">មធ្យម (Medium)</span>
                    {thinkingLevel === 'medium' && <Check size={15} className="text-zinc-900" />}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {thinkingLabels.medium.desc}
                  </div>
                </div>
              </button>

              {/* Low */}
              <button
                onClick={() => {
                  onSelectThinkingLevel('low');
                  setThinkingDropdownOpen(false);
                }}
                className={`w-full flex items-start gap-2.5 p-2 rounded-xl transition-colors text-left ${
                  thinkingLevel === 'low'
                    ? 'bg-[#f4f4f4] text-zinc-950 font-medium'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">ទាប (Low)</span>
                    {thinkingLevel === 'low' && <Check size={15} className="text-zinc-900" />}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                    {thinkingLabels.low.desc}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {isTemporaryChat && (
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 rounded-md border border-amber-200">
            <Clock size={12} />
            ជជែកបណ្តោះអាសន្ន
          </span>
        )}
      </div>

      {/* Right zone: Temporary chat toggle & Share */}
      <div className="flex items-center gap-1.5 relative">
        <button
          onClick={onToggleTemporaryChat}
          className={`p-2 rounded-lg transition-colors ${
            isTemporaryChat
              ? 'text-amber-700 bg-amber-100/70 hover:bg-amber-100'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-[#ececec]'
          }`}
          title={isTemporaryChat ? 'បិទការជជែកបណ្តោះអាសន្ន' : 'បើកការជជែកបណ្តោះអាសន្ន'}
        >
          <Clock size={18} strokeWidth={1.8} />
        </button>

        <button
          onClick={handleShareClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec] rounded-lg text-xs font-medium transition-colors"
          title="ចែករំលែកការសន្ទនា"
        >
          <Share2 size={16} strokeWidth={1.8} />
          <span className="hidden sm:inline">ចែករំលែក</span>
        </button>

        {shareToast && (
          <div className="absolute right-0 top-12 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in duration-150">
            តំណភ្ជាប់ត្រូវបានចម្លង!
          </div>
        )}
      </div>
    </header>
  );
};
