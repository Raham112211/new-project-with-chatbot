import React, { useState, useRef, useEffect, memo } from 'react';
import { ArrowUp } from 'lucide-react';

function ChatInput({ onSendMessage, isLoading, agentTraceMode, onToggleAgentTraceMode, isDarkMode }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = text.trim() && !isLoading;

  return (
    <div className="px-4 pb-4 pt-2 w-full max-w-3xl mx-auto">

      {/* Main input container */}
      <div
        className={`relative flex flex-col rounded-2xl border shadow-sm chatbar-theme-hover transition-all ${
          isDarkMode
            ? 'bg-[#10141f] border-slate-700/60'
            : 'bg-white border-slate-200/90'
        }`}
      >

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isLoading}
          className={`w-full bg-transparent border-0 focus:outline-none px-4 pt-3.5 pb-2 text-sm leading-relaxed resize-none custom-scrollbar ${
            isDarkMode
              ? 'text-slate-100 placeholder-slate-500'
              : 'text-slate-900 placeholder-slate-400'
          }`}
          style={{ maxHeight: '160px' }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5">

          {/* Left: Auto Router status badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
              isDarkMode
                ? 'bg-blue-950/60 border-blue-800/60 text-blue-400'
                : 'bg-blue-50 border-blue-200 text-[#0066FF]'
            }`}
            title="Devnexes AI Master Router automatically decides Pipeline vs Direct Response per query"
          >
            <img src="/devnexes-logo.png" className="w-3.5 h-3.5 object-contain animate-logo-float" alt="" />
            <span className="font-semibold">Auto Router (Dynamic)</span>
          </div>

          {/* Right: Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canSend
                ? 'apple-glass-btn text-white shadow-md'
                : isDarkMode
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <ArrowUp size={14} strokeWidth={canSend ? 2.5 : 2} />
          </button>
        </div>
      </div>

      {/* Subtle bottom hint */}
      <p className={`text-center text-[10px] mt-1.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

export default memo(ChatInput);
