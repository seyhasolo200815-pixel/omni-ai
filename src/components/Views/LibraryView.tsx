import React from 'react';
import { Bookmark, FileText, ArrowLeft, Star, Clock, Folder } from 'lucide-react';

interface LibraryViewProps {
  onBackToChat: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onBackToChat }) => {
  const savedItems = [
    {
      id: '1',
      title: 'គំរូ Prompts ល្អបំផុតសម្រាប់ការស្រាវជ្រាវ និងការសិក្សា',
      type: 'Prompt Template',
      updated: 'ម្សិលមិញ',
      starred: true,
    },
    {
      id: '2',
      title: 'កូដគំរូ React Hooks និង State Management ស្អាតល្អ',
      type: 'Code Snippet',
      updated: '៣ ថ្ងៃមុន',
      starred: true,
    },
    {
      id: '3',
      title: 'គ្រោងឆ្អឹងការរៀបចំផែនការអាជីវកម្ម (Business Plan Outline)',
      type: 'Document',
      updated: 'សប្តាហ៍មុន',
      starred: false,
    },
    {
      id: '4',
      title: 'បញ្ជីពាក្យបច្ចេកវិទ្យា AI បកប្រែជាភាសាខ្មែរផ្លូវការ',
      type: 'Glossary',
      updated: '២ សប្តាហ៍មុន',
      starred: false,
    },
  ];

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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              បណ្ណាល័យ (Library)
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              ឯកសារ សេចក្តីព្រាង និងគំរូសំណួរដែលអ្នកបានរក្សាទុក
            </p>
          </div>
        </div>

        <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 hover:bg-[#fafafa] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                  <Bookmark size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{item.type}</span>
                    <span>·</span>
                    <span>កែប្រែចុងក្រោយ: {item.updated}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Star
                  size={16}
                  className={item.starred ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
