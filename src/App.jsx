import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AgentTraceTree from './components/AgentTraceTree';
import ChatInput from './components/ChatInput';
import ArtifactModal from './components/ArtifactModal';
import IdeCodePanel from './components/IdeCodePanel';
import ApiKeyModal from './components/ApiKeyModal';
import { streamGroqChat, generateDynamicAgentPipeline, generateConversationTitle, AVAILABLE_MODELS } from './services/groqService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { Code2, Cpu } from 'lucide-react';

const STORAGE_KEY_CONVS = 'devnexes_conversations_v2';
const STORAGE_KEY_ACTIVE = 'devnexes_active_id_v2';
const STORAGE_KEY_MODEL = 'devnexes_selected_model_v2';

const createInitialConversation = () => ({
  id: `conv-${Date.now()}`,
  title: 'New Chat',
  messages: []
});

const getInitialConversations = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONVS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[LocalStorage] Error loading conversations:', e);
  }
  return [createInitialConversation()];
};

const getInitialActiveId = (convs) => {
  try {
    const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (savedId && convs.some(c => c.id === savedId)) return savedId;
  } catch (e) {}
  return convs[0]?.id;
};

const getInitialModel = () => {
  try {
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
    if (savedModel && AVAILABLE_MODELS.some(m => m.id === savedModel)) {
      return savedModel;
    }
  } catch (e) {}
  return 'openrouter/auto';
};

export default function App() {
  const [conversations, setConversations] = useState(getInitialConversations);
  const [activeId, setActiveId] = useState(() => getInitialActiveId(conversations));
  const [selectedModel, setSelectedModel] = useState(getInitialModel);
  const [agentTraceMode, setAgentTraceMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, code: '', title: '' });
  const [idePanel, setIdePanel] = useState({ isOpen: false, code: '', title: '', language: '' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { document.documentElement.classList.remove('dark'); }, []);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVS, JSON.stringify(conversations));
    } catch (e) {
      console.warn('[LocalStorage] Error saving conversations:', e);
    }
  }, [conversations]);

  // Save activeId to localStorage
  useEffect(() => {
    if (activeId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeId);
    }
  }, [activeId]);

  // Save selectedModel to localStorage
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(STORAGE_KEY_MODEL, selectedModel);
    }
  }, [selectedModel]);

  const userScrolledUpRef = useRef(false);

  // Smooth user scroll detection
  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 140;
    userScrolledUpRef.current = !isNearBottom;
  };

  // Stutter-free auto-scroll via DOM mutation observation
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (!userScrolledUpRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });
    
    if (!userScrolledUpRef.current) {
      container.scrollTop = container.scrollHeight;
    }

    return () => observer.disconnect();
  }, []);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];
  const hasMessages = activeConv && activeConv.messages.length > 0;

  const handleSelectConv = (id) => {
    userScrolledUpRef.current = false;
    setActiveId(id);
  };

  const handleNewChat = () => {
    userScrolledUpRef.current = false;
    const newConv = createInitialConversation();
    setConversations(prev => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const handleDeleteConv = (id) => {
    if (conversations.length <= 1) return;
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };

  const handleOpenPreview = (code, title) => setPreviewModal({ isOpen: true, code, title });

  const handleSendMessage = async (userText) => {
    if (!userText.trim() || isLoading) return;
    userScrolledUpRef.current = false;
    setIdePanel({ isOpen: false, code: '', title: '', language: '' });
    const convId = activeId;
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;
    const currentConv = conversations.find(c => c.id === convId);
    const historyBeforeSend = currentConv ? currentConv.messages : [];
    const isFirstMsg = currentConv ? currentConv.messages.length === 0 : true;

    setConversations(prev => prev.map(c => c.id !== convId ? c : {
      ...c,
      title: isFirstMsg ? (userText.slice(0, 30) + '...') : c.title,
      messages: [...c.messages, { id: userMsgId, role: 'user', content: userText }]
    }));

    if (isFirstMsg) {
      generateConversationTitle({ userPrompt: userText }).then(dynamicTitle => {
        if (dynamicTitle) {
          setConversations(prev => prev.map(c => c.id !== convId ? c : { ...c, title: dynamicTitle }));
        }
      });
    }

    setIsLoading(true);

    setConversations(prev => prev.map(c => c.id !== convId ? c : {
      ...c,
      messages: [...c.messages, {
        id: assistantMsgId, role: 'assistant', isTrace: true,
        traceData: { steps: [{ type: 'header', title: 'Processing...' }] }
      }]
    }));

    try {
      await generateDynamicAgentPipeline({
        userPrompt: userText,
        model: selectedModel,
        messagesHistory: historyBeforeSend,
        onStepUpdate: (steps, isGreeting) => {
          if (isGreeting) {
            const respContent = steps.find(s => s.type === 'response')?.content || '';
            setConversations(prev => prev.map(c => c.id !== convId ? c : {
              ...c,
              messages: c.messages.map(m =>
                m.id === assistantMsgId ? { ...m, isTrace: false, content: respContent } : m
              )
            }));
            return;
          }

          const artStep = steps.find(s => s.type === 'artifact' && s.isDone && !s.isStreaming && s.code?.trim());
          if (artStep?.code?.trim()) {
            setIdePanel({
              isOpen: true,
              code: artStep.code,
              title: artStep.title || '',
              language: artStep.language || ''
            });
          }

          setConversations(prev => prev.map(c => c.id !== convId ? c : {
            ...c,
            messages: c.messages.map(m =>
              m.id === assistantMsgId ? { ...m, isTrace: true, traceData: { steps } } : m
            )
          }));
        },
        onError: (err) => console.error(err)
      });
    } catch (err) {
      setConversations(prev => prev.map(c => c.id !== convId ? c : {
        ...c,
        messages: c.messages.map(m =>
          m.id === assistantMsgId
            ? { ...m, traceData: { steps: [{ type: 'response', content: `Error: ${err.message}` }] } }
            : m
        )
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden bg-white text-slate-900">

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConv={handleSelectConv}
        onNewChat={handleNewChat}
        onDeleteConv={handleDeleteConv}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      <div className="flex-1 flex h-full overflow-hidden">
        <main className="flex-1 flex flex-col h-full overflow-hidden relative border-r border-slate-200 bg-white">

          {/* Header */}
          <header className="h-14 px-4 flex items-center justify-between shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-md z-10">
            <div className="flex items-center space-x-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#0066FF] shrink-0" />
              <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs text-slate-900">
                {activeConv?.title || 'New Chat'}
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-700">
              <span>Pro plan · <strong className="text-[#0066FF]">Groq Fast</strong></span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIdePanel(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Code2 size={13} />
                <span>{idePanel.isOpen ? 'Hide Canvas' : 'Code Canvas'}</span>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          {hasMessages ? (
            <>
              <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                  {activeConv.messages.map((msg) => (
                    <div key={msg.id} className="animate-bubble-in">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className={`max-w-2xl px-5 py-3.5 rounded-3xl rounded-tr-sm text-sm leading-relaxed text-slate-900 bg-[#F1F5F9] border border-slate-200 shadow-2xs whitespace-pre-wrap break-words ${
                            /#include|function|class |def |public |import |const |let |var |struct |int main|cout|cin/i.test(msg.content)
                              ? 'font-mono text-[12.5px] font-normal'
                              : 'font-sans font-medium'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-3.5">
                          <div className="shrink-0 mt-1">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-50 border border-blue-200 shadow-2xs">
                              <img src="/devnexes-logo.png" alt="Devnexes AI" className="w-5 h-5 object-contain animate-logo-float" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5 text-slate-800">
                            {msg.isTrace ? (
                              <AgentTraceTree
                                traceData={msg.traceData}
                                isExecuting={isLoading && activeConv.messages[activeConv.messages.length - 1]?.id === msg.id}
                                onOpenPreview={handleOpenPreview}
                                onOpenIdePanel={(code, title, language) => setIdePanel({ isOpen: true, code, title, language })}
                              />
                            ) : (
                              <div className="text-sm leading-relaxed text-slate-800">
                                <MarkdownRenderer content={msg.content} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && activeConv.messages[activeConv.messages.length - 1]?.role === 'user' && (
                    <div className="flex items-center space-x-3.5 animate-fade-in">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 border border-blue-200 shrink-0 shadow-2xs">
                        <img src="/devnexes-logo.png" alt="Devnexes AI" className="w-5 h-5 object-contain animate-logo-float" />
                      </div>
                      <div className="flex items-center space-x-1 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-2xs">
                        <span className="text-xs font-mono text-[#0066FF] mr-2.5 font-medium animate-pulse">Analyzing...</span>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="w-1 bg-[#0066FF] rounded-full animate-wave-bar" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="pb-4 pt-2">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                />
              </div>
            </>
          ) : (
            /* Authentic Claude Home Screen: Title + Chat Input directly centered! */
            <div className="h-full flex flex-col items-center justify-center px-4 select-none -mt-10">
              <div className="w-full max-w-2xl space-y-6">
                
                {/* Centered Serif Title matching Claude AI screenshot */}
                <div className="flex items-center justify-center space-x-3 text-3xl sm:text-4xl font-serif text-slate-900 tracking-tight text-center">
                  <img src="/devnexes-logo.png" alt="Devnexes AI" className="w-9 h-9 object-contain animate-logo-float shrink-0" />
                  <span className="font-serif font-normal">Devnexes AI returns!</span>
                </div>

                {/* Claude Input Box directly centered below title */}
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                />

              </div>
            </div>
          )}

        </main>

        <IdeCodePanel
          isOpen={idePanel.isOpen}
          onClose={() => setIdePanel(prev => ({ ...prev, isOpen: false }))}
          code={idePanel.code}
          title={idePanel.title}
          language={idePanel.language}
          onOpenPreview={handleOpenPreview}
        />
      </div>

      <ArtifactModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, code: '', title: '' })}
        code={previewModal.code}
        title={previewModal.title}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
