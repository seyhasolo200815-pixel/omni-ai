import React from 'react';
import { Image as ImageIcon, Sparkles, Filter, Plus, ArrowLeft } from 'lucide-react';

interface ImagesViewProps {
  onBackToChat: () => void;
}

export const ImagesView: React.FC<ImagesViewProps> = ({ onBackToChat }) => {
  const sampleImages = [
    {
      id: '1',
      title: 'ប្រាសាទអង្គរវត្តក្នុងពេលថ្ងៃរះពណ៌មាស',
      date: 'ថ្ងៃនេះ',
      dimensions: '1024 × 1024',
      ratio: '1:1',
      color: 'from-amber-100 to-orange-200'
    },
    {
      id: '2',
      title: 'ទេសភាពភ្នំបូកគោមានអ័ព្ទត្រជាក់ស្រទន់',
      date: 'ម្សិលមិញ',
      dimensions: '1024 × 1024',
      ratio: '1:1',
      color: 'from-blue-100 to-indigo-200'
    },
    {
      id: '3',
      title: 'រូបគំនូរ Abstract AI ទំនើបបែប Minimalist',
      date: '៣ ថ្ងៃមុន',
      dimensions: '1024 × 1024',
      ratio: '1:1',
      color: 'from-purple-100 to-rose-200'
    },
    {
      id: '4',
      title: 'ការរចនាឡូហ្គោបែប Futuristic O',
      date: '៥ ថ្ងៃមុន',
      dimensions: '1024 × 1024',
      ratio: '1:1',
      color: 'from-emerald-100 to-teal-200'
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBackToChat}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 mb-2 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>ត្រឡប់ទៅការជជែក</span>
            </button>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              រូបភាព (Images)
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              វិចិត្រសាលរូបភាពដែលអ្នកបានបង្កើត និងផ្ទុកឡើងជាមួយ Omni AI
            </p>
          </div>

          <button
            onClick={onBackToChat}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Plus size={15} />
            <span>បង្កើតរូបភាពថ្មី</span>
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {sampleImages.map((img) => (
            <div
              key={img.id}
              className="group border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col"
            >
              <div className={`aspect-square bg-gradient-to-br ${img.color} flex items-center justify-center p-4 relative`}>
                <ImageIcon size={32} className="text-zinc-600/70" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div className="text-xs font-medium text-zinc-900 line-clamp-2 mb-2">
                  {img.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{img.date}</span>
                  <span>{img.dimensions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
