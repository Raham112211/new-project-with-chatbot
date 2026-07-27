import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  ArrowUp, 
  Sparkles, 
  Terminal, 
  Code2, 
  Globe, 
  Cpu,
  Layers
} from 'lucide-react';

function ChatInput({ onSendMessage, isLoading, agentTraceMode, onToggleAgentTraceMode }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const quickPrompts = [
    { label: '🚀 C++ System Class', prompt: 'write c++ code of calculator', icon: Terminal },
    { label: '🐍 Python Data Pipeline', prompt: 'build a python class for data processing', icon: Code2 },
    { label: '🌐 Web App UI', prompt: 'create a sleek responsive HTML dashboard', icon: Layers },
    { label: '⚡ Deep AI Architecture', prompt: 'explain transformer architecture in detail', icon: Cpu },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectQuickPrompt = (promptText) => {
    onSendMessage(promptText);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-5 font-sans">
      
      {/* Quick Suggestion Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-1.5 custom-scrollbar text-xs">
        {quickPrompts.map((q, idx) => {
          const ChipIcon = q.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSelectQuickPrompt(q.prompt)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#12151e]/80 border border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-[#0066FF] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700/80 transition-all shadow-2xs font-medium flex items-center space-x-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ChipIcon size={12} className="text-[#0066FF] shrink-0" />
              <span>{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Input Box Container */}
      <form 
        onSubmit={handleSubmit}
        className="relative rounded-2xl bg-white/95 dark:bg-[#10131d]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-lg backdrop-blur-md focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 transition-all duration-200 overflow-hidden"
      >
        
        {/* Text Input Area */}
        <div className="px-4 pt-3.5 pb-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Devnexes AI to architect software, write C++, Python, Java, or React/HTML..."
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm leading-relaxed resize-none custom-scrollbar"
          />
        </div>

        {/* Input Bar Organized Footer Toolbar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/80 dark:bg-[#08090f]/80 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          
          {/* Left Controls */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onToggleAgentTraceMode}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                agentTraceMode 
                  ? 'bg-blue-100/90 dark:bg-blue-950/80 text-[#0066FF] dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shadow-2xs' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent'
              }`}
              title="Toggle Devnexes Agent Step Trace Pipeline"
            >
              <img src="/devnexes-logo.png" className="w-3.5 h-3.5 object-contain" alt="Devnexes" />
              <span>{agentTraceMode ? 'Devnexes Trace Active' : 'Chat Mode'}</span>
            </button>

            <span className="hidden sm:inline-block text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Press <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">Enter ↵</kbd> to send
            </span>
          </div>

          {/* Right Action Button */}
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              text.trim() && !isLoading
                ? 'bg-[#0066FF] hover:bg-blue-700 text-white shadow-md hover:scale-105 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Send Prompt to Devnexes AI"
          >
            <ArrowUp size={16} className={text.trim() && !isLoading ? 'stroke-[2.5]' : ''} />
          </button>

        </div>

      </form>
    </div>
  );
}

export default memo(ChatInput);
