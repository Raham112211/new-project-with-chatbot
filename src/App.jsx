import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AgentTraceTree from './components/AgentTraceTree';
import ChatInput from './components/ChatInput';
import ArtifactModal from './components/ArtifactModal';
import IdeCodePanel from './components/IdeCodePanel';
import ApiKeyModal from './components/ApiKeyModal';
import { streamGroqChat, generateDynamicAgentPipeline, generateConversationTitle, AVAILABLE_MODELS } from './services/groqService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { Code2, PanelLeftOpen, Cpu, Layers, Globe, FileText } from 'lucide-react';

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
  return 'gemma3:1b';
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

  // Smooth user scroll detection (prevents scroll-fight during live node streaming)
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
    
    // Initial scroll on mount
    if (!userScrolledUpRef.current) {
      container.scrollTop = container.scrollHeight;
    }

    return () => observer.disconnect();
  }, []);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];

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
    userScrolledUpRef.current = false; // Reset scroll lock for new message
    setIdePanel({ isOpen: false, code: '', title: '', language: '' }); // Close canvas for new generation
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

  const starterCards = [
    { icon: Layers, title: 'Web App & UI', prompt: 'create a modern dark dashboard with charts and glassmorphic cards', color: 'text-blue-600', bg: 'bg-blue-50/70 border-blue-200/80 hover:border-blue-500/80' },
    { icon: Globe, title: 'Research & Analysis', prompt: 'explain the differences between transformer and diffusion model architectures', color: 'text-indigo-600', bg: 'bg-indigo-50/70 border-indigo-200/80 hover:border-indigo-500/80' },
    { icon: Code2, title: 'Software & Code', prompt: 'build a python class for data processing and numerical analysis', color: 'text-amber-600', bg: 'bg-amber-50/70 border-amber-200/80 hover:border-amber-500/80' },
    { icon: FileText, title: 'Writing & Docs', prompt: 'write a technical architecture document for a microservices backend', color: 'text-purple-600', bg: 'bg-purple-50/70 border-purple-200/80 hover:border-purple-500/80' }
  ];

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden bg-[#f8fafc] text-slate-900">

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
        <main className="flex-1 flex flex-col h-full overflow-hidden relative border-r border-slate-200/80 bg-[#f8fafc]">

          <header className="h-12 px-4 flex items-center justify-between shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md z-10">
            <div className="flex items-center space-x-2.5 truncate">
              {isSidebarCollapsed && (
                <button onClick={() => setIsSidebarCollapsed(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <div className="flex items-center space-x-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] shrink-0" />
                <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs text-slate-800">
                  {activeConv?.title || 'New Chat'}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border bg-slate-100 border-slate-200/90 text-slate-700 shadow-2xs">
              <Cpu size={11} className="text-[#0066FF] shrink-0" />
              <span>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIdePanel(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full apple-glass-btn text-white text-xs font-medium transition-all"
              >
                <Code2 size={12} />
                <span>{idePanel.isOpen ? 'Hide Canvas' : 'Code Canvas'}</span>
              </button>
            </div>
          </header>

          <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto custom-scrollbar">
            {activeConv && activeConv.messages.length > 0 ? (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {activeConv.messages.map((msg) => (
                  <div key={msg.id} className="animate-bubble-in">
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className={`max-w-2xl px-4.5 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed text-slate-900 modern-pro-bubble shadow-xs whitespace-pre-wrap break-words ${
                          /#include|function|class |def |public |import |const |let |var |struct |int main|cout|cin/i.test(msg.content)
                            ? 'font-mono text-[12.5px] font-normal tracking-normal'
                            : 'font-sans font-medium'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-blue-50 border border-blue-100">
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
                  <div className="flex items-center space-x-3 animate-fade-in">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-50 border border-blue-200 animate-glow-pulse shrink-0">
                      <img src="/devnexes-logo.png" alt="Devnexes AI" className="w-4 h-4 object-contain animate-logo-float" />
                    </div>
                    <div className="flex items-center space-x-1 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-xs font-mono text-[#0066FF] mr-2 animate-pulse font-medium">Initializing pipeline...</span>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-1 bg-[#0066FF] rounded-full animate-wave-bar" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-4 select-none">
                <div className="w-full max-w-xl space-y-8">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center relative">
                      <div className="p-3.5 rounded-2xl relative overflow-hidden border bg-white border-slate-200/90 shadow-md">
                        <div className="absolute inset-0 pointer-events-none animate-mirror-shine bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
                        <img src="/devnexes-logo.png" alt="Devnexes AI" className="w-10 h-10 object-contain animate-logo-float relative z-10" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900">What can I help you with?</h1>
                      <p className="mt-1.5 text-sm text-slate-500">Code, research, writing — ask anything.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {starterCards.map((card, idx) => {
                      const CardIcon = card.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(card.prompt)}
                          className={`starter-card group flex items-center space-x-3 p-3.5 rounded-xl border text-left bg-white border-slate-200/90 hover:bg-white ${card.bg} shadow-2xs`}
                        >
                          <div className="p-2 rounded-lg bg-slate-100/80 shrink-0">
                            <CardIcon size={15} className={card.color} />
                          </div>
                          <span className="text-xs font-semibold truncate text-slate-700 group-hover:text-slate-900 transition-colors">
                            {card.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isDarkMode={false}
          />
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
