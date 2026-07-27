import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Key, 
  Cpu, 
  Trash2, 
  Sun, 
  Moon, 
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { AVAILABLE_MODELS } from '../services/groqService';

export default function Sidebar({
  conversations,
  activeId,
  onSelectConv,
  onNewChat,
  onDeleteConv,
  selectedModel,
  onSelectModel,
  hasApiKey,
  onOpenApiKeyModal,
  isDarkMode,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse
}) {
  return (
    <aside 
      className={`shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-[#f1f5f9] dark:bg-[#0b101d] flex flex-col h-full transition-all duration-300 ease-in-out select-none relative z-30 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Devnexes AI Header Bar */}
      <div className="h-14 px-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 animate-fade-in">
            <img 
              src="/devnexes-logo.png" 
              alt="Devnexes AI Logo" 
              className="w-7 h-7 object-contain animate-logo-float drop-shadow-sm hover:scale-110 transition-transform duration-300"
            />
            <div>
              <h1 className="font-bold text-sm text-slate-900 dark:text-white font-lustria leading-none tracking-tight">
                Devnexes AI
              </h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold mt-0.5">
                AGENT STUDIO
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center">
            <img 
              src="/devnexes-logo.png" 
              alt="Devnexes AI Logo" 
              className="w-7 h-7 object-contain animate-logo-float hover:scale-110 transition-transform"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all duration-200 ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="New Chat"
        >
          <Plus size={16} />
          {!isCollapsed && <span>New Devnexes Pipeline</span>}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar">
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              onClick={() => onSelectConv(conv.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-[#0066FF] dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/40 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/40'
              }`}
              title={conv.title}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <MessageSquare size={14} className={isActive ? "text-[#0066FF]" : "text-slate-400"} />
                {!isCollapsed && (
                  <span className="truncate max-w-[170px]">{conv.title || 'New Chat'}</span>
                )}
              </div>

              {!isCollapsed && conversations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConv(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Model Selector & Footer Settings */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
        {!isCollapsed && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1">
              <Cpu size={12} />
              <span>Groq LLM Engine</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="w-full bg-white dark:bg-[#0f1422] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API Key Status */}
        <button
          onClick={onOpenApiKeyModal}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors border ${
            hasApiKey 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100' 
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 animate-pulse'
          } ${isCollapsed ? 'justify-center px-0' : ''}`}
          title="Groq API Key"
        >
          <div className="flex items-center space-x-2">
            {hasApiKey ? <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Key size={14} className="text-blue-600 dark:text-blue-400" />}
            {!isCollapsed && <span>{hasApiKey ? 'API Key Active' : 'Set Groq API Key'}</span>}
          </div>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>

    </aside>
  );
}
