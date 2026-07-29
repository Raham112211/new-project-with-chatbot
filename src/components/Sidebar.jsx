import React, { memo } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Cpu, 
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Settings,
  Folder,
  Layers,
  Code2
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
      className={`shrink-0 border-r border-slate-200 bg-[#F8FAFC] text-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out select-none relative z-30 font-sans ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-14 px-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2.5 truncate">
              <img 
                src="/devnexes-logo.png" 
                alt="Devnexes AI Logo" 
                className="w-6 h-6 object-contain shrink-0"
              />
              <span className="font-bold text-sm tracking-tight text-slate-900 font-serif">
                Devnexes AI
              </span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center justify-center"
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Actions */}
      <div className="p-2 space-y-1 border-b border-slate-200 shrink-0">
        {/* + New Chat Button */}
        {isCollapsed ? (
          <button
            onClick={onNewChat}
            className="w-10 h-10 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center justify-center mx-auto shadow-xs active:scale-95 transition-all"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
        ) : (
          <button
            onClick={onNewChat}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/60 transition-all"
            title="New Chat"
          >
            <Plus size={16} className="text-[#0066FF]" />
            <span>New chat</span>
          </button>
        )}

        {/* Chats */}
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer">
            <MessageSquare size={15} className="text-slate-500" />
            <span>Chats</span>
          </div>
        )}

        {/* Code Canvas */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer">
            <div className="flex items-center space-x-2.5">
              <Code2 size={15} className="text-slate-500" />
              <span>Code Canvas</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200 font-semibold">
              Pro
            </span>
          </div>
        )}
      </div>

      {/* Recents Section */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {!isCollapsed && (
          <div className="px-3 pt-1 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Recents</span>
          </div>
        )}

        {conversations.map((conv) => {
          const isActive = conv.id === activeId;

          if (isCollapsed) {
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConv(conv.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-white text-[#0066FF] font-semibold border border-blue-200 shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={conv.title || 'Untitled'}
              >
                <MessageSquare size={16} />
              </div>
            );
          }

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConv(conv.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive 
                  ? 'bg-white text-[#0066FF] font-semibold border border-blue-200 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={conv.title}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <MessageSquare size={13} className={isActive ? "text-[#0066FF]" : "text-slate-400"} />
                <span className="truncate max-w-[150px]">{conv.title || 'Untitled'}</span>
              </div>

              {conversations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConv(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Profile & Model Selector */}
      <div className="p-2 border-t border-slate-200 space-y-1 shrink-0">
        {/* Model Selector */}
        <div 
          className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : ''
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate pr-2">
            <Cpu size={15} className="text-[#0066FF] shrink-0" />
            {!isCollapsed && (
              <span className="truncate font-medium text-slate-800 text-[11px]">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              </span>
            )}
          </div>
          {!isCollapsed && <ChevronDown size={13} className="text-slate-400 shrink-0" />}

          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Change Model"
          >
            {Array.from(new Set(AVAILABLE_MODELS.map(m => m.category || 'Models'))).map(category => (
              <optgroup key={category} label={category}>
                {AVAILABLE_MODELS.filter(m => (m.category || 'Models') === category).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* User / Workspace Footer */}
        {!isCollapsed ? (
          <button
            onClick={onOpenApiKeyModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Workspace Settings"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-6 h-6 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold text-[11px]">
                M
              </div>
              <div className="text-left truncate">
                <div className="font-semibold text-slate-900 truncate text-[11px] leading-tight">M.RAHAM</div>
                <div className="text-[10px] text-slate-500 leading-tight">Devnexes Pro</div>
              </div>
            </div>
            <Settings size={14} className="text-slate-400 shrink-0" />
          </button>
        ) : (
          <button
            onClick={onOpenApiKeyModal}
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto text-slate-600 hover:bg-slate-200/60 transition-colors"
            title="Workspace Settings"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

    </aside>
  );
}

export default memo(Sidebar);
