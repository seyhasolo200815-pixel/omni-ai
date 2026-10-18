import React from 'react';
import { FolderKanban, Plus, ArrowLeft, MoreHorizontal, Users, FileCode } from 'lucide-react';

interface ProjectsViewProps {
  onBackToChat: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onBackToChat }) => {
  const sampleProjects = [
    {
      id: '1',
      title: 'កម្មវិធីទូរស័ព្ទ Khmer E-Commerce',
      desc: 'គម្រោងកូដ និងឯកសាររៀបចំស្ថាបត្យកម្មប្រព័ន្ធ UI/UX និង Backend',
      filesCount: 14,
      updated: 'ម្សិលមិញ',
    },
    {
      id: '2',
      title: 'យុទ្ធនាការទីផ្សារ Omni AI Launch 2026',
      desc: 'ការសរសេរ Copywriting, ស្គ្រីបវីដេអូ, និងប្លង់យុទ្ធសាស្ត្រផ្សព្វផ្សាយ',
      filesCount: 8,
      updated: '៤ ថ្ងៃមុន',
    },
    {
      id: '3',
      title: 'ស្រាវជ្រាវភាសាវិទ្យាខ្មែរ និង NLP',
      desc: 'ការប្រមូលទិន្នន័យ Corpus និងក្បួនវេយ្យាករណ៍សម្រាប់ការបណ្តុះបណ្តាល AI',
      filesCount: 22,
      updated: 'សប្តាហ៍មុន',
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
              គម្រោង (Projects)
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              រៀបចំឯកសារ ការសន្ទនា និងការណែនាំតាមគម្រោងជាក់លាក់
            </p>
          </div>

          <button className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors shadow-2xs">
            <Plus size={15} />
            <span>គម្រោងថ្មី</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleProjects.map((p) => (
            <div
              key={p.id}
              className="p-5 border border-zinc-200 rounded-2xl hover:border-zinc-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                    <FolderKanban size={18} />
                  </div>
                  <button className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">{p.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{p.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <FileCode size={13} />
                  {p.filesCount} ឯកសារ
                </span>
                <span>{p.updated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
