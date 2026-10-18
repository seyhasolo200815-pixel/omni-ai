import React, { useState } from 'react';
import {
  X,
  Settings,
  User,
  Shield,
  Database,
  Info,
  Check,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'personalization' | 'data' | 'security' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'km' | 'en'>('km');
  const [customInstructions, setCustomInstructions] = useState(
    'សូមឆ្លើយតបជាភាសាខ្មែរដែលងាយយល់ និងមានភាពរួសរាយរាក់ទាក់។'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Bar */}
        <div className="w-full md:w-56 bg-[#f9f9f9] border-b md:border-b-0 md:border-r border-zinc-200 p-3 space-y-1">
          <div className="px-3 py-2 text-sm font-semibold text-zinc-900 mb-2">
            ការកំណត់ (Settings)
          </div>

          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'general'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <Settings size={16} />
            <span>ទូទៅ (General)</span>
          </button>

          <button
            onClick={() => setActiveTab('personalization')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'personalization'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <User size={16} />
            <span>ការកំណត់ផ្ទាល់ខ្លួន</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'data'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <Database size={16} />
            <span>គ្រប់គ្រងទិន្នន័យ</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'security'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <Shield size={16} />
            <span>សុវត្ថិភាព & គណនី</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'about'
                ? 'bg-white text-zinc-950 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <Info size={16} />
            <span>អំពី Omni AI</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h3 className="text-base font-semibold text-zinc-900">
              {activeTab === 'general' && 'ទូទៅ'}
              {activeTab === 'personalization' && 'ការកំណត់ផ្ទាល់ខ្លួន'}
              {activeTab === 'data' && 'ការគ្រប់គ្រងទិន្នន័យ'}
              {activeTab === 'security' && 'សុវត្ថិភាព និងគណនី'}
              {activeTab === 'about' && 'អំពី Omni AI'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-zinc-700">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Theme Setting */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <div className="font-medium text-zinc-900">រចនាប័ទ្មពណ៌ (Theme)</div>
                    <div className="text-xs text-zinc-500">ជ្រើសរើសទម្រង់ពណ៌បង្ហាញលើអេក្រង់</div>
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none"
                  >
                    <option value="light">ពន្លឺ (Light)</option>
                    <option value="dark">ងងឹត (Dark)</option>
                    <option value="system">តាមប្រព័ន្ធ (System)</option>
                  </select>
                </div>

                {/* Language Setting */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <div className="font-medium text-zinc-900">ភាសា (Language)</div>
                    <div className="text-xs text-zinc-500">ភាសាដែលត្រូវប្រើប្រាស់លើកម្មវិធី</div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none"
                  >
                    <option value="km">ភាសាខ្មែរ (Khmer)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                {/* Clear all chats */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-900">លុបប្រវត្តិជជែកទាំងអស់</div>
                    <div className="text-xs text-zinc-500">សម្អាតរាល់ការសន្ទនាទាំងអស់ជាអចិន្ត្រៃយ៍</div>
                  </div>
                  <button className="px-3.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    លុបទាំងអស់
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'personalization' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-zinc-900 mb-1">
                    ការណែនាំតាមតម្រូវការ (Custom Instructions)
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">
                    តើអ្នកចង់ឱ្យ Omni AI ដឹងអំពីអ្វីខ្លះមុនពេលឆ្លើយតប?
                  </p>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <div className="font-medium text-zinc-900">ប្រវត្តិជជែក និងការបណ្តុះបណ្តាល</div>
                    <div className="text-xs text-zinc-500">
                      រក្សាទុកប្រវត្តិលើគណនីរបស់អ្នកដើម្បីងាយស្រួលចូលមើល
                    </div>
                  </div>
                  <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center p-0.5 cursor-pointer justify-end">
                    <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-900">ទាញយកទិន្នន័យ (Export Data)</div>
                    <div className="text-xs text-zinc-500">ទាញយកច្បាប់ចម្លងនៃការសន្ទនាទាំងអស់ជាឯកសារ JSON</div>
                  </div>
                  <button className="px-3.5 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                    ទាញយក
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <div className="font-medium text-zinc-900">ការផ្ទៀងផ្ទាត់ពីរកត្តា (2FA)</div>
                    <div className="text-xs text-zinc-500">បង្កើនសុវត្ថិភាពគណនីរបស់អ្នក</div>
                  </div>
                  <button className="px-3.5 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                    បើកដំណើរការ
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-900">ចាកចេញពីគ្រប់ឧបករណ៍ទាំងអស់</div>
                    <div className="text-xs text-zinc-500">បញ្ចប់សម័យកាលចូលប្រើប្រាស់នៅលើ Browser ផ្សេងទៀត</div>
                  </div>
                  <button className="px-3.5 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                    ចាកចេញទាំងអស់
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-zinc-900">Omni AI</div>
                  <div className="text-xs text-zinc-500">កំណែ Web UI 1.0 (ChatGPT Reference Edition)</div>
                </div>
                <div className="text-xs text-zinc-600 leading-relaxed">
                  ចំណុចប្រទាក់ឆ្លាតវៃ Omni AI ត្រូវបានបង្កើតឡើងយ៉ាងយកចិត្តទុកដាក់ខ្ពស់ដើម្បីផ្តល់នូវបទពិសោធន៍សន្ទនាស្អាត
                  សាមញ្ញ និងលឿនរហ័ស គាំទ្រភាសាខ្មែរយ៉ាងពេញលេញ។
                </div>
                <div className="pt-2 border-t border-zinc-100 flex gap-4 text-xs text-zinc-500">
                  <a href="#" className="hover:underline">លក្ខខណ្ឌប្រើប្រាស់</a>
                  <span>·</span>
                  <a href="#" className="hover:underline">គោលការណ៍ឯកជនភាព</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
