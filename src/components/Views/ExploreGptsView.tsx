import React, { useState } from 'react';
import { Compass, Search, ArrowLeft, Sparkles, Code2, PenTool, BookOpen, BarChart3 } from 'lucide-react';

interface ExploreGptsViewProps {
  onBackToChat: () => void;
  onSelectGpt: (name: string) => void;
}

export const ExploreGptsView: React.FC<ExploreGptsViewProps> = ({ onBackToChat, onSelectGpt }) => {
  const [search, setSearch] = useState('');

  const gpts = [
    {
      id: '1',
      name: 'អ្នកសរសេរកូដឆ្លាតវៃ (Code Expert)',
      desc: 'ជួយពិនិត្យ កែកំហុស (Debug) និងសរសេរកូដ React, Python, Go ប្រកបដោយប្រសិទ្ធភាព',
      category: 'ការសរសេរកូដ',
      icon: Code2,
      author: 'ដោយ Omni Team',
    },
    {
      id: '2',
      name: 'អ្នកនិពន្ធច្នៃប្រឌិតខ្មែរ (Creative Writer)',
      desc: 'តែងនិពន្ធកំណាព្យ រឿងខ្លី ស្គ្រីបវីដេអូ និងអត្ថបទផ្សាយពាណិជ្ជកម្មជាភាសាខ្មែរ',
      category: 'ការសរសេរ',
      icon: PenTool,
      author: 'ដោយ Omni Team',
    },
    {
      id: '3',
      name: 'គ្រូបង្រៀនផ្ទាល់ខ្លួន (Personal Tutor)',
      desc: 'ពន្យល់មេរៀនវិទ្យាសាស្ត្រ គណិតវិទ្យា និងភាសា ឱ្យងាយយល់មួយជំហានម្តងៗ',
      category: 'ការអប់រំ',
      icon: BookOpen,
      author: 'ដោយ Omni Education',
    },
    {
      id: '4',
      name: 'អ្នកវិភាគទិន្នន័យ (Data Analyst)',
      desc: 'វិភាគឯកសារ Excel, CSV និងគូរតារាងក្រាហ្វិកសង្ខេបយ៉ាងច្បាស់លាស់',
      category: 'ផលិតភាព',
      icon: BarChart3,
      author: 'ដោយ Omni Team',
    },
  ];

  const filtered = gpts.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto w-full">
        <button
          onClick={onBackToChat}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>ត្រឡប់ទៅការជជែក</span>
        </button>

        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight mb-2">
            ស្វែងរក GPTs (Explore GPTs)
          </h1>
          <p className="text-xs text-zinc-500">
            ស្វែងរក និងប្រើប្រាស់ជំនួយការ AI ជំនាញជាក់លាក់ដែលរចនាឡើងសម្រាប់គោលបំណងផ្សេងៗ
          </p>

          <div className="mt-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះ GPT ឬមុខងារ..."
              className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-300"
            />
          </div>
        </div>

        {/* GPTs List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectGpt(item.name);
                  onBackToChat();
                }}
                className="p-4 border border-zinc-200 rounded-2xl hover:border-zinc-300 hover:shadow-xs transition-all bg-white cursor-pointer group flex items-start gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="text-[11px] text-zinc-400 mt-2">
                    {item.author}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
