import React, { memo } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Cpu, 
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Settings
} from 'lucide-react';
import { AVAILABLE_MODELS } from '../services/groqService';

function Sidebar({
  conversations,
  activeId,
  onSelectConv,
  onNewChat,
  onDeleteConv,
  selectedModel,
  onSelectModel,
  isCollapsed,
  onToggleCollapse,
  onOpenApiKeyModal
}) {
  return (
    <aside 
      className={`shrink-0 border-r border-slate-200/90 bg-[#f8fafc] text-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out select-none relative z-30 font-sans ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Devnexes AI Header */}
      <div className="h-14 px-3.5 border-b border-slate-200/90 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5 animate-fade-in">
            <img 
              src="/devnexes-logo.png" 
              alt="Devnexes AI Logo" 
              className="w-7 h-7 object-contain animate-logo-float shrink-0"
            />
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-none tracking-tight">
                Devnexes AI
              </h1>
              <p className="text-[10px] text-[#0066FF] font-mono font-semibold mt-0.5 uppercase tracking-wider">
                Agent Studio
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <img 
              src="/devnexes-logo.png" 
              alt="Devnexes AI Logo" 
              className="w-7 h-7 object-contain animate-logo-float"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="New Chat"
        >
          <Plus size={15} />
          {!isCollapsed && <span>New Pipeline</span>}
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
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive 
                  ? 'bg-white text-[#0066FF] font-semibold border border-blue-200 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title={conv.title}
            >
              <div className="flex items-center space-x-2 truncate">
                <MessageSquare size={13} className={isActive ? "text-[#0066FF]" : "text-slate-400"} />
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
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Model Selector & Footer Settings (Unified 1-Way Style) */}
      <div className="p-3 border-t border-slate-200/90 space-y-1">
        
        {/* Model Selector */}
        <div 
          className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate pr-2">
            <Cpu size={14} className="text-[#0066FF] shrink-0" />
            {!isCollapsed && (
              <span className="truncate font-medium text-slate-800 font-mono text-[11px]">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              </span>
            )}
          </div>
          {!isCollapsed && <ChevronDown size={13} className="text-slate-400 shrink-0" />}

          {!isCollapsed && (
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Change LLM Engine Model"
            >
              {Array.from(new Set(AVAILABLE_MODELS.map(m => m.category))).map(category => (
                <optgroup key={category} label={category}>
                  {AVAILABLE_MODELS.filter(m => m.category === category).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={onOpenApiKeyModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors mt-1"
            title="Configure API Keys (OpenRouter & Tavily)"
          >
            <div className="flex items-center space-x-2.5">
              <Settings size={14} className="text-slate-500" />
              <span className="font-medium text-slate-700">Workspace Settings</span>
            </div>
          </button>
        )}

      </div>

    </aside>
  );
}

export default memo(Sidebar);
