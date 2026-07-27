import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp, Zap, Sparkles } from 'lucide-react';

export default function ChatInput({ onSendMessage, isLoading, agentTraceMode, onToggleAgentTraceMode }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const quickPrompts = [
    { label: '🚀 Devnexes C++ Calculator', prompt: 'write c++ code of calculator' },
    { label: '🐍 Python System Script', prompt: 'build a python class for data processing' },
    { label: '🌐 Web UI Component', prompt: 'create a sleek responsive HTML dashboard' },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-1 custom-scrollbar text-xs">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectQuickPrompt(q.prompt)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0066FF] hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs font-normal"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Main Form Container */}
      <form 
        onSubmit={handleSubmit}
        className="relative rounded-2xl bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800/80 shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200"
      >
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Devnexes AI to write code, design architecture, or execute pipeline..."
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs leading-relaxed resize-none custom-scrollbar"
          />
        </div>

        {/* Input Bar Footer Controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#090b10] border-t border-slate-100 dark:border-slate-800/60 rounded-b-2xl">
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onToggleAgentTraceMode}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                agentTraceMode 
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
              }`}
              title="Toggle Agent Step Trace Tree"
            >
              <img src="/devnexes-logo.png" className="w-3.5 h-3.5 object-contain" alt="Devnexes" />
              <span>{agentTraceMode ? 'Devnexes Trace Active' : 'Chat Mode'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
              text.trim() && !isLoading
                ? 'bg-[#0066FF] text-white shadow-sm hover:scale-105 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ArrowUp size={15} />
          </button>
        </div>

      </form>
    </div>
  );
}
