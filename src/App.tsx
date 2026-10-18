/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveView } from './components/Sidebar';
import { Header, GeminiModelType, ThinkingLevelType } from './components/Header';
import { ChatArea, Message } from './components/ChatArea';
import { VideoPlaceholder } from './components/VideoPlaceholder';
import { ImagesView } from './components/Views/ImagesView';
import { LibraryView } from './components/Views/LibraryView';
import { ProjectsView } from './components/Views/ProjectsView';
import { ExploreGptsView } from './components/Views/ExploreGptsView';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { AttachedItem } from './components/Composer';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('3.8-flash');
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevelType>('high');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Responsive sidebar collapse for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setActiveView('chat');
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    setActiveView('chat');

    // Prepopulate sample chat if selected from history
    if (id === '1') {
      setMessages([
        {
          id: 'm1',
          sender: 'user',
          content: 'តើធ្វើដូចម្តេចដើម្បីបង្កើត Custom Hook ក្នុង React 19 ជាមួយ TypeScript ឱ្យមាន Type Safety ល្អ?',
          timestamp: '10:30 AM',
        },
        {
          id: 'm2',
          sender: 'system',
          content: `ការបង្កើត Custom Hook ក្នុង **React 19** ជាមួយ **TypeScript** ទាមទារឱ្យមានការកំណត់ Generic types និង Return types ឱ្យបានច្បាស់លាស់។

### ឧទាហរណ៍ជាក់ស្តែង: \`useFetch\` Hook

\`\`\`typescript
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    setState(prev => ({ ...prev, isLoading: true }));

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted) setState({ data, isLoading: false, error: null });
      })
      .catch(error => {
        if (isMounted) setState({ data: null, isLoading: false, error });
      });

    return () => { isMounted = false; };
  }, [url]);

  return state;
}
\`\`\`

**ចំណុចគន្លឹះសំខាន់ៗ:**
1. ប្រើប្រាស់ **Generics (\`<T>\`)** ដើម្បីឱ្យ Caller កំណត់ប្រភេទ Type ទិន្នន័យបានដោយសេរី។
2. ត្រឡប់ **Explicit Return Type** ជួយឱ្យ IDE ផ្តល់ Autocomplete ត្រឹមត្រូវ។
3. គ្រប់គ្រង Cleanup ជាមួយ \`isMounted\` ដើម្បីជៀសវាង Memory Leak។`,
          timestamp: '10:30 AM',
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  // Production-Ready Gemini Response Handler (Streaming + Fallback + Timeout)
  const handleSendMessage = async (text: string, attachments: AttachedItem[]) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Prepare system message placeholder
    const aiMessageId = Math.random().toString(36).substring(7);
    const systemPlaceholder: Message = {
      id: aiMessageId,
      sender: 'system',
      content: '',
      thought: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, systemPlaceholder]);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s safety timeout

    try {
      // 1. Try Streaming SSE first
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          thinkingLevel: thinkingLevel,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses cleanly
      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.message) {
            errorMsg = errData.message;
          }
        } catch {
          // fallback to status text
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Process stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response stream is unavailable');
      }

      let accumulatedText = '';
      let accumulatedThought = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'chunk' && event.text) {
                accumulatedText += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: accumulatedText, isStreaming: true }
                      : m
                  )
                );
              } else if (event.type === 'thought' && event.text) {
                accumulatedThought += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, thought: accumulatedThought, isStreaming: true }
                      : m
                  )
                );
              } else if (event.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, isStreaming: false } : m
                  )
                );
              } else if (event.type === 'error') {
                throw new Error(event.message || 'Error occurred during streaming');
              }
            } catch (err) {
              console.error('Failed to parse SSE line:', line, err);
            }
          }
        }
      }

      // Stream successfully completed
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMessageId ? { ...m, isStreaming: false } : m))
      );
    } catch (primaryError: any) {
      console.warn('Streaming failed, attempting JSON fallback...', primaryError);

      // 2. Production Fallback: Standard JSON request if SSE was blocked or buffered
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages,
            model: selectedModel,
            thinkingLevel: thinkingLevel,
            stream: false,
          }),
        });

        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? {
                    ...m,
                    content: data.content || 'មិនមានចម្លើយត្រឡប់មកវិញ។',
                    isStreaming: false,
                    error: false,
                  }
                : m
            )
          );
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }

      // If both streaming and fallback failed, display clear error message to user
      const isTimeout = primaryError?.name === 'AbortError';
      const displayMsg = isTimeout
        ? 'ការតភ្ជាប់លើសពេលវេលាកំណត់ (Timeout)។ សូមព្យាយាមម្តងទៀត។'
        : primaryError?.message ||
          'មិនអាចភ្ជាប់ទៅកាន់ Google Gemini API បានទេ។ សូមពិនិត្យមើល API Key នៅក្នុង Settings > Secrets។';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                content: displayMsg,
                error: true,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUserIdx = messages.map((m) => m.sender).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      const lastUserMsg = messages[lastUserIdx];
      // Trim messages up to that user message, then re-send
      const priorMessages = messages.slice(0, lastUserIdx);
      setMessages(priorMessages);
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 font-sans">
      {/* 1. Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
        }}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Main Top Header with Gemini Model and Thinking Level */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          thinkingLevel={thinkingLevel}
          onSelectThinkingLevel={setThinkingLevel}
          isTemporaryChat={isTemporaryChat}
          onToggleTemporaryChat={() => setIsTemporaryChat(!isTemporaryChat)}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'chat' && (
            <ChatArea
              messages={messages}
              onSendMessage={handleSendMessage}
              onRegenerate={messages.length > 1 ? handleRegenerate : undefined}
              isLoading={isLoading}
              selectedModelName={
                selectedModel === '3.8-flash' ? 'Gemini 3.8 Flash' : 'Gemini 3.5 Flash-Lite'
              }
            />
          )}

          {activeView === 'video' && (
            <VideoPlaceholder onBackToChat={handleNewChat} />
          )}

          {activeView === 'images' && (
            <ImagesView onBackToChat={handleNewChat} />
          )}

          {activeView === 'library' && (
            <LibraryView onBackToChat={handleNewChat} />
          )}

          {activeView === 'projects' && (
            <ProjectsView onBackToChat={handleNewChat} />
          )}

          {activeView === 'explore_gpts' && (
            <ExploreGptsView
              onBackToChat={handleNewChat}
              onSelectGpt={(gptName) => {
                handleSendMessage(`សូមចាប់ផ្តើមដើរតួជា ${gptName} និងពន្យល់ពីរបៀបដែលអ្នកអាចជួយខ្ញុំបាន។`, []);
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectChat={handleSelectChat}
      />

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
