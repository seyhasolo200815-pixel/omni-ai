import React from 'react';
import { Video, Film, Sparkles, Wand2, ArrowLeft, Layers, Sliders } from 'lucide-react';

interface VideoPlaceholderProps {
  onBackToChat: () => void;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ onBackToChat }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto w-full">
        {/* Back button */}
        <button
          onClick={onBackToChat}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span>ត្រឡប់ទៅការជជែក (Back to Chat)</span>
        </button>

        {/* Header section */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium mb-4">
            <Video size={14} className="text-zinc-700" />
            <span>Omni Video Studio</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-500">ដំណាក់កាលអភិវឌ្ឍន៍</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight mb-3">
            បង្កើតវីដេអូ AI ជាមួយ Omni Studio
          </h1>
          <p className="text-zinc-600 text-[15px] leading-relaxed max-w-2xl">
            ស្ទូឌីយោបង្កើត និងកាត់តវីដេអូបែបទំនើប នឹងមកដល់ឆាប់ៗនេះ។ អ្នកនឹងអាចបង្កើតឈុតឆាកវីដេអូ AI,
            បម្លែងអត្ថបទទៅជាវីដេអូ (Text-to-Video) និងកែសម្រួល Timeline យ៉ាងងាយស្រួល។
          </p>
        </div>

        {/* Preview Feature Grid (Clean, unboxed metadata and subtle hairlines) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl border border-zinc-200 bg-[#fafafa]">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 mb-3.5 shadow-2xs">
              <Wand2 size={20} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              Text-to-Video
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              សរសេរការពិពណ៌នាជាភាសាខ្មែរ ឬអង់គ្លេស ដើម្បីបង្កើតឈុតឆាកវីដេអូកម្រិតច្បាស់ខ្ពស់ 4K។
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 bg-[#fafafa]">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 mb-3.5 shadow-2xs">
              <Sliders size={20} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              Timeline Editor
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              កាត់តវីដេអូ និងបន្ថែមសំឡេងបែប CapCut ជាមួយនឹង AI Auto-caption ជាភាសាខ្មែរ។
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 bg-[#fafafa]">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 mb-3.5 shadow-2xs">
              <Layers size={20} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              Video Templates
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              គំរូវីដេអូជាច្រើនសម្រាប់ TikTok, Reels, និង YouTube Shorts ត្រៀមរួចជាស្រេច។
            </p>
          </div>
        </div>

        {/* Video Canvas Mock / Teaser Frame */}
        <div className="border border-zinc-200 rounded-2xl p-6 bg-[#f4f4f4] text-center">
          <div className="max-w-md mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-center mx-auto mb-4 text-zinc-800">
              <Film size={26} strokeWidth={1.75} />
            </div>
            <h4 className="text-base font-semibold text-zinc-900 mb-1.5">
              មុខងារនេះនឹងត្រូវបានដាក់ឱ្យប្រើប្រាស់ក្នុងដំណាក់កាលបន្ទាប់
            </h4>
            <p className="text-xs text-zinc-500 mb-6">
              យើងកំពុងអភិវឌ្ឍន៍ CapCut-inspired Video Studio ផ្តាច់មុខសម្រាប់ Omni AI។
            </p>
            <button
              onClick={onBackToChat}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors shadow-xs"
            >
              ត្រឡប់ទៅការជជែកឥឡូវនេះ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
