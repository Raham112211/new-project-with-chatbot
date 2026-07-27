import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AgentTraceTree from './components/AgentTraceTree';
import ChatInput from './components/ChatInput';
import ApiKeyModal from './components/ApiKeyModal';
import ArtifactModal from './components/ArtifactModal';
import IdeCodePanel from './components/IdeCodePanel';
import { getGroqApiKey, streamGroqChat, generateDynamicAgentPipeline, AVAILABLE_MODELS } from './services/groqService';

import MarkdownRenderer from './components/MarkdownRenderer';
import { Sparkles, Bot, AlertCircle, Key, RefreshCw, Code2 } from 'lucide-react';

// Real Initial Welcome State for Devnexes AI
const INITIAL_DEMO_TRACE = {
  id: 'devnexes-ai-welcome',
  title: 'Devnexes AI Studio',
  messages: [
    {
      id: 'msg-welcome-user',
      role: 'user',
      content: 'hi'
    },
    {
      id: 'msg-welcome-assistant',
      role: 'assistant',
      isTrace: false,
      content: 'Hello! Welcome to **Devnexes AI Agent Studio**. I can help you architect software, write C++, Python, Java, or React/HTML code, perform live web research, and debug complex applications. What would you like to build today?'
    }
  ]
};

export default function App() {
  const [conversations, setConversations] = useState([INITIAL_DEMO_TRACE]);
  const [activeId, setActiveId] = useState(INITIAL_DEMO_TRACE.id);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(!!getGroqApiKey());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [agentTraceMode, setAgentTraceMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Preview Modal & IDE Panel & Sidebar State
  const [previewModal, setPreviewModal] = useState({ isOpen: false, code: '', title: '' });
  const [idePanel, setIdePanel] = useState({ isOpen: false, code: '', title: '', language: '' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const chatContainerRef = useRef(null);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations, isLoading]);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat = {
      id: newId,
      title: 'New Devnexes Pipeline',
      messages: []
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
  };

  const handleSelectConv = (id) => {
    setActiveId(id);
  };

  const handleDeleteConv = (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) setActiveId(remaining[0].id);
    }
  };

  const handleOpenPreview = (code, title) => {
    setPreviewModal({ isOpen: true, code, title });
  };

  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;

    const key = getGroqApiKey();
    if (!key) {
      setIsApiKeyModalOpen(true);
      return;
    }

    const convId = activeId;
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // Get current conversation history BEFORE appending new user prompt
    const currentConv = conversations.find(c => c.id === convId);
    const historyBeforeSend = currentConv ? currentConv.messages : [];

    // Add user message
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          title: c.messages.length === 0 ? userText.slice(0, 30) : c.title,
          messages: [
            ...c.messages,
            { id: userMsgId, role: 'user', content: userText }
          ]
        };
      }
      return c;
    }));

    setIsLoading(true);

    if (agentTraceMode) {
      // Add initial trace assistant placeholder
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            messages: [
              ...c.messages,
              {
                id: assistantMsgId,
                role: 'assistant',
                isTrace: true,
                traceData: {
                  steps: [
                    { type: 'header', title: `Analyzing intent for "${userText}"...` }
                  ]
                }
              }
            ]
          };
        }
        return c;
      }));

      try {
        let hasArtifact = false;
        await generateDynamicAgentPipeline({
          userPrompt: userText,
          model: selectedModel,
          apiKey: key,
          messagesHistory: historyBeforeSend,
          onStepUpdate: (steps, isGreeting) => {
            if (isGreeting) {
              const respContent = steps.find(s => s.type === 'response')?.content || '';
              setConversations(prev => prev.map(c => {
                if (c.id === convId) {
                  const updatedMsgs = c.messages.map(m => {
                    if (m.id === assistantMsgId) {
                      return { 
                        ...m, 
                        isTrace: false, 
                        content: respContent 
                      };
                    }
                    return m;
                  });
                  return { ...c, messages: updatedMsgs };
                }
                return c;
              }));
              return;
            }

            const artStep = steps.find(s => s.type === 'artifact');
            if (artStep && artStep.code && artStep.code.trim()) {
              hasArtifact = true;
              setIdePanel(prev => ({
                ...prev,
                code: artStep.code,
                title: artStep.title || prev.title,
                language: artStep.language || prev.language
              }));
            }

            setConversations(prev => prev.map(c => {
              if (c.id === convId) {
                const updatedMsgs = c.messages.map(m => {
                  if (m.id === assistantMsgId) {
                    return { ...m, isTrace: true, traceData: { steps } };
                  }
                  return m;
                });
                return { ...c, messages: updatedMsgs };
              }
              return c;
            }));
          },
          onError: (err) => {
            console.error(err);
          }
        });

        // Pipeline execution finished: Open side Code Canvas Workbench ONLY IF artifact exists
        if (hasArtifact) {
          setIdePanel(ide => ({ ...ide, isOpen: true }));
        }
      } catch (err) {
        setConversations(prev => prev.map(c => {
          if (c.id === convId) {
            const updatedMsgs = c.messages.map(m => {
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  traceData: {
                    steps: [
                      { type: 'header', title: `Execution error for "${userText}"` },
                      { type: 'response', content: `Error: ${err.message}` }
                    ]
                  }
                };
              }
              return m;
            });
            return { ...c, messages: updatedMsgs };
          }
          return c;
        }));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Standard chat mode
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            messages: [
              ...c.messages,
              { id: assistantMsgId, role: 'assistant', isTrace: false, content: '' }
            ]
          };
        }
        return c;
      }));

      try {
        const chatMessages = [
          ...historyBeforeSend.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content || (m.traceData?.steps?.find(s => s.type === 'response')?.content || '')
          })).filter(m => m.content),
          { role: 'user', content: userText }
        ];

        await streamGroqChat({
          messages: chatMessages,
          model: selectedModel,
          apiKey: key,
          onChunk: (delta, fullText) => {
            setConversations(prev => prev.map(c => {
              if (c.id === convId) {
                const updatedMsgs = c.messages.map(m => {
                  if (m.id === assistantMsgId) {
                    return { ...m, content: fullText };
                  }
                  return m;
                });
                return { ...c, messages: updatedMsgs };
              }
              return c;
            }));
          },
          onError: (err) => {
            console.error(err);
          }
        });
      } catch (err) {
        // Error handling
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] dark:bg-[#0b101d] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar Component */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConv={handleSelectConv}
        onNewChat={handleNewChat}
        onDeleteConv={handleDeleteConv}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Split Workspace Area (Devnexes AI Split Canvas Layout) */}
      <div className="flex-1 flex h-full overflow-hidden relative">
        
        {/* Left Pane: Chat & Agent Trace Feed */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative border-r border-slate-200 dark:border-slate-800/60">
          
          {/* Top Header Bar */}
          <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#080a0f] px-6 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center space-x-3">
              <img 
                src="/devnexes-logo.png" 
                alt="Devnexes AI Logo" 
                className="w-6 h-6 object-contain animate-logo-float" 
              />
              <span className="text-xs font-bold text-slate-900 dark:text-white font-lustria">Devnexes AI</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={() => setIdePanel(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-semibold shadow-xs transition-all hover:scale-105"
              >
                <Code2 size={13} />
                <span>{idePanel.isOpen ? 'Hide Code Canvas' : 'Devnexes Code Canvas'}</span>
              </button>

              {!hasApiKey && (
                <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  <AlertCircle size={14} />
                  <span>API Key Needed</span>
                </button>
              )}
            </div>
          </header>

          {/* Chat / Trace Stream Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 custom-scrollbar"
          >
            {activeConv && activeConv.messages.length > 0 ? (
              activeConv.messages.map((msg) => (
                <div key={msg.id} className="max-w-4xl mx-auto">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end my-3">
                      <div className="max-w-xl px-4 py-2.5 rounded-2xl bg-slate-200/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed shadow-2xs border border-slate-300/60 dark:border-slate-700/60 font-medium">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="my-4 flex items-start space-x-3">
                      <img 
                        src="/devnexes-logo.png" 
                        alt="Devnexes AI" 
                        className="w-7 h-7 object-contain mt-1 shrink-0 animate-logo-float" 
                      />
                      <div className="flex-1 min-w-0">
                        {msg.isTrace ? (
                          <AgentTraceTree 
                            traceData={msg.traceData} 
                            isExecuting={isLoading && activeConv.messages[activeConv.messages.length - 1]?.id === msg.id}
                            onOpenPreview={handleOpenPreview}
                            onOpenIdePanel={(code, title, language) => setIdePanel({ isOpen: true, code, title, language })}
                          />
                        ) : (
                          <div className="py-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                            <MarkdownRenderer content={msg.content} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 pt-12">
                <img 
                  src="/devnexes-logo.png" 
                  alt="Devnexes AI" 
                  className="w-16 h-16 object-contain animate-logo-float drop-shadow-md" 
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white font-lustria">Devnexes AI Agent Studio</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Ask a question or request code to see real-time skill routing, intent analysis, and code artifacts.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="max-w-4xl mx-auto flex items-center space-x-2 text-xs text-[#0066FF] font-medium py-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Devnexes agent pipeline executing...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            agentTraceMode={agentTraceMode}
            onToggleAgentTraceMode={() => setAgentTraceMode(!agentTraceMode)}
          />

        </main>

        {/* Right Pane: Devnexes Code Canvas Workbench */}
        <IdeCodePanel
          isOpen={idePanel.isOpen}
          onClose={() => setIdePanel({ ...idePanel, isOpen: false })}
          code={idePanel.code}
          title={idePanel.title}
          language={idePanel.language}
          onOpenPreview={handleOpenPreview}
        />

      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={(key) => setHasApiKey(!!key)}
      />

      {/* Artifact Preview Modal */}
      <ArtifactModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        code={previewModal.code}
        title={previewModal.title}
      />

    </div>
  );
}
