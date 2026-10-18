import React, { useState, useRef, useEffect } from 'react';
import {
  SquarePen,
  Search,
  Image as ImageIcon,
  Bookmark,
  FolderKanban,
  Video,
  Compass,
  PanelLeftClose,
  MoreHorizontal,
  Trash2,
  Edit2,
  Archive,
  Settings,
  LogOut,
  User,
  Sparkles,
  ChevronRight,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { OmniLogo } from './OmniLogo';

export type ActiveView =
  | 'chat'
  | 'search'
  | 'images'
  | 'library'
  | 'projects'
  | 'video'
  | 'explore_gpts';

export interface ChatHistoryItem {
  id: string;
  title: string;
  group: 'today' | 'yesterday' | 'previous7';
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeView,
  onSelectView,
  onNewChat,
  onOpenSettings,
  onOpenSearch,
  currentChatId,
  onSelectChat,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sample Khmer conversation history
  const [history, setHistory] = useState<ChatHistoryItem[]>([
    { id: '1', title: 'ការសរសេរកូដ React និង TypeScript', group: 'today' },
    { id: '2', title: 'គន្លឹះរៀបចំផែនការអាជីវកម្មឌីជីថល', group: 'today' },
    { id: '3', title: 'បកប្រែឯកសារបច្ចេកវិទ្យា AI ជាភាសាខ្មែរ', group: 'today' },
    { id: '4', title: 'គំនិតបង្កើតវីដេអូខ្លីលើ TikTok និង Reels', group: 'yesterday' },
    { id: '5', title: 'កែសម្រួលរូបភាពផលិតផលឱ្យមានភាពទាក់ទាញ', group: 'yesterday' },
    { id: '6', title: 'រូបមន្តម្ហូបប្រពៃណីខ្មែរ និងប្រភពដើម', group: 'previous7' },
    { id: '7', title: 'រៀបរាប់ពីប្រវត្តិសាស្រ្ត និងស្ថាបត្យកម្មអង្គរវត្ត', group: 'previous7' },
    { id: '8', title: 'សំណួរនិងចម្លើយត្រៀមសម្ភាសន៍ការងារ Tech', group: 'previous7' },
  ]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (activeMenuId) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setActiveMenuId(null);
    if (currentChatId === id) {
      onNewChat();
    }
  };

  const handleStartRename = (item: ChatHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(item.id);
    setEditTitle(item.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      setHistory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: editTitle.trim() } : item))
      );
    }
    setEditingChatId(null);
  };

  const handleKeyDownRename = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(id);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  // Group history items
  const todayItems = history.filter((item) => item.group === 'today');
  const yesterdayItems = history.filter((item) => item.group === 'yesterday');
  const previous7Items = history.filter((item) => item.group === 'previous7');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[260px] bg-[#f9f9f9] border-r border-[#ececec] transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-[260px]'
        }`}
      >
        {/* Top Header inside Sidebar: Logo & Collapse Button */}
        <div className="flex items-center justify-between h-[52px] px-3.5 pt-2">
          <button
            onClick={() => {
              onSelectView('chat');
              onNewChat();
            }}
            className="flex items-center gap-2.5 text-zinc-900 group hover:opacity-85 transition-opacity"
            title="Omni AI Home"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-zinc-200 shadow-xs">
              <OmniLogo size={20} />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">Omni AI</span>
          </button>

          <button
            onClick={onToggle}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-[#ececec] rounded-lg transition-colors"
            title="បិទរបារចំហៀង"
            aria-label="Toggle Sidebar"
          >
            <PanelLeftClose size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Main Menu Items (Strictly Ordered) */}
        <div className="px-2 py-2 space-y-0.5">
          {/* 1. ជជែកថ្មី */}
          <button
            onClick={() => {
              onSelectView('chat');
              onNewChat();
            }}
            className={`w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left ${
              activeView === 'chat' && !currentChatId
                ? 'bg-[#ececec] text-zinc-900 font-medium'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <SquarePen size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">ជជែកថ្មី</span>
            </div>
          </button>

          {/* 2. ស្វែងរក */}
          <button
            onClick={() => {
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">ស្វែងរក</span>
            </div>
          </button>

          {/* 3. រូបភាព */}
          <button
            onClick={() => onSelectView('images')}
            className={`w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left ${
              activeView === 'images'
                ? 'bg-[#ececec] text-zinc-900 font-medium'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ImageIcon size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">រូបភាព</span>
            </div>
          </button>

          {/* 4. បណ្ណាល័យ */}
          <button
            onClick={() => onSelectView('library')}
            className={`w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left ${
              activeView === 'library'
                ? 'bg-[#ececec] text-zinc-900 font-medium'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Bookmark size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">បណ្ណាល័យ</span>
            </div>
          </button>

          {/* 5. គម្រោង */}
          <button
            onClick={() => onSelectView('projects')}
            className={`w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left ${
              activeView === 'projects'
                ? 'bg-[#ececec] text-zinc-900 font-medium'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderKanban size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">គម្រោង</span>
            </div>
          </button>

          {/* 6. បង្កើតវីដេអូ AI (Replaces Scheduled) */}
          <button
            onClick={() => onSelectView('video')}
            className={`w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left ${
              activeView === 'video'
                ? 'bg-[#ececec] text-zinc-900 font-medium'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Video size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">បង្កើតវីដេអូ AI</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">ថ្មី</span>
          </button>

          {/* 7. ស្វែងរក GPT */}
          <button
            onClick={() => onSelectView('explore_gpts')}
            className={`w-full flex items-center justify-between h-9 px-2.5 rounded-lg text-[13.5px] font-normal transition-colors text-left ${
              activeView === 'explore_gpts'
                ? 'bg-[#ececec] text-zinc-900 font-medium'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass size={18} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
              <span className="truncate">ស្វែងរក GPT</span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-200/60 mx-3 my-1" />

        {/* Conversation History Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs font-normal">
          {/* Group: ថ្ងៃនេះ (Today) */}
          {todayItems.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 tracking-wide">
                ថ្ងៃនេះ
              </div>
              <div className="space-y-0.5">
                {todayItems.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    isActive={currentChatId === item.id}
                    isEditing={editingChatId === item.id}
                    editTitle={editTitle}
                    isMenuOpen={activeMenuId === item.id}
                    onSelect={() => {
                      onSelectView('chat');
                      onSelectChat(item.id);
                    }}
                    onToggleMenu={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                    }}
                    onEditChange={setEditTitle}
                    onSaveEdit={() => handleSaveRename(item.id)}
                    onKeyDown={(e) => handleKeyDownRename(e, item.id)}
                    onRenameClick={(e) => handleStartRename(item, e)}
                    onDeleteClick={(e) => handleDeleteChat(item.id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Group: ម្សិលមិញ (Yesterday) */}
          {yesterdayItems.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 tracking-wide">
                ម្សិលមិញ
              </div>
              <div className="space-y-0.5">
                {yesterdayItems.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    isActive={currentChatId === item.id}
                    isEditing={editingChatId === item.id}
                    editTitle={editTitle}
                    isMenuOpen={activeMenuId === item.id}
                    onSelect={() => {
                      onSelectView('chat');
                      onSelectChat(item.id);
                    }}
                    onToggleMenu={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                    }}
                    onEditChange={setEditTitle}
                    onSaveEdit={() => handleSaveRename(item.id)}
                    onKeyDown={(e) => handleKeyDownRename(e, item.id)}
                    onRenameClick={(e) => handleStartRename(item, e)}
                    onDeleteClick={(e) => handleDeleteChat(item.id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Group: ៧ ថ្ងៃមុន (Previous 7 days) */}
          {previous7Items.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 tracking-wide">
                ៧ ថ្ងៃមុន
              </div>
              <div className="space-y-0.5">
                {previous7Items.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    isActive={currentChatId === item.id}
                    isEditing={editingChatId === item.id}
                    editTitle={editTitle}
                    isMenuOpen={activeMenuId === item.id}
                    onSelect={() => {
                      onSelectView('chat');
                      onSelectChat(item.id);
                    }}
                    onToggleMenu={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                    }}
                    onEditChange={setEditTitle}
                    onSaveEdit={() => handleSaveRename(item.id)}
                    onKeyDown={(e) => handleKeyDownRename(e, item.id)}
                    onRenameClick={(e) => handleStartRename(item, e)}
                    onDeleteClick={(e) => handleDeleteChat(item.id, e)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Area at Bottom */}
        <div className="p-2 border-t border-[#ececec] relative" ref={profileMenuRef}>
          {profileMenuOpen && (
            <div className="absolute bottom-[60px] left-2 right-2 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-zinc-100">
                <div className="font-medium text-zinc-900">Seyha Solo</div>
                <div className="text-[11px] text-zinc-500 truncate">seyhasolo200815@gmail.com</div>
              </div>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <Settings size={16} className="text-zinc-500" />
                <span>ការកំណត់ (Settings)</span>
              </button>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>ដំឡើងទៅ Omni Plus</span>
                </div>
                <ChevronRight size={14} className="text-zinc-400" />
              </button>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <HelpCircle size={16} className="text-zinc-500" />
                <span>ជំនួយ និងសំណួរញឹកញាប់</span>
              </button>

              <div className="h-px bg-zinc-100 my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={16} />
                <span>ចាកចេញ (Log out)</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#ececec] transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-medium text-xs shrink-0 shadow-xs">
                S
              </div>
              <div className="truncate">
                <div className="text-[13.5px] font-medium text-zinc-900 leading-tight truncate">
                  Seyha Solo
                </div>
                <div className="text-[11px] text-zinc-500 leading-tight">Omni Free</div>
              </div>
            </div>
            <MoreHorizontal
              size={16}
              className="text-zinc-400 group-hover:text-zinc-700 shrink-0"
            />
          </button>
        </div>
      </aside>
    </>
  );
};

interface HistoryRowProps {
  item: ChatHistoryItem;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  isMenuOpen: boolean;
  onSelect: () => void;
  onToggleMenu: (e: React.MouseEvent) => void;
  onEditChange: (val: string) => void;
  onSaveEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onRenameClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

const HistoryRow: React.FC<HistoryRowProps> = ({
  item,
  isActive,
  isEditing,
  editTitle,
  isMenuOpen,
  onSelect,
  onToggleMenu,
  onEditChange,
  onSaveEdit,
  onKeyDown,
  onRenameClick,
  onDeleteClick,
}) => {
  return (
    <div className="relative group">
      {isEditing ? (
        <div className="px-2 py-1">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={onKeyDown}
            autoFocus
            className="w-full text-[13px] px-2 py-1 bg-white border border-zinc-300 rounded text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      ) : (
        <div
          onClick={onSelect}
          className={`flex items-center justify-between h-[34px] px-2.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
            isActive
              ? 'bg-[#ececec] text-zinc-950 font-medium'
              : 'text-zinc-700 hover:text-zinc-950 hover:bg-[#ececec]'
          }`}
        >
          <span className="truncate pr-2">{item.title}</span>

          {/* Ellipsis button appears on hover or active */}
          <button
            onClick={onToggleMenu}
            className={`p-1 rounded hover:bg-zinc-300/60 text-zinc-500 hover:text-zinc-800 transition-opacity shrink-0 ${
              isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="ជម្រើសបន្ថែម"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      )}

      {/* Popover Menu for Chat Item */}
      {isMenuOpen && (
        <div className="absolute right-2 top-8 w-36 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50 text-[12px] animate-in fade-in duration-100">
          <button
            onClick={onRenameClick}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 hover:bg-zinc-100 text-left"
          >
            <Edit2 size={13} className="text-zinc-500" />
            <span>ប្តូរឈ្មោះ</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 hover:bg-zinc-100 text-left"
          >
            <Archive size={13} className="text-zinc-500" />
            <span>ទុកក្នុងប័ណ្ណសារ</span>
          </button>
          <div className="h-px bg-zinc-100 my-1" />
          <button
            onClick={onDeleteClick}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 text-left"
          >
            <Trash2 size={13} />
            <span>លុប</span>
          </button>
        </div>
      )}
    </div>
  );
};
