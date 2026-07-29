import React, { useState, useRef, useEffect, memo } from 'react';
import { ArrowUp, Plus, Mic, ChevronDown } from 'lucide-react';
import { AVAILABLE_MODELS } from '../services/groqService';

function ChatInput({ onSendMessage, isLoading, selectedModel, onSelectModel }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = text.trim() && !isLoading;
  const currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'Llama 3.3 70B';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Exact Claude AI Chat Bar matching screenshot */}
      <div className="relative flex flex-col rounded-3xl bg-[#282724]/5 bg-white border border-slate-300/80 shadow-md overflow-hidden focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type / for skills"
          rows={2}
          disabled={isLoading}
          className="w-full bg-transparent border-0 focus:outline-none px-5 pt-4 pb-2 text-sm leading-relaxed resize-none custom-scrollbar text-slate-900 placeholder-slate-400 font-sans"
          style={{ maxHeight: '180px' }}
        />

        {/* Bottom Toolbar matching screenshot */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-slate-100">
          
          {/* Left: Plus icon button & Auto Router badge */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Add content or skills"
            >
              <Plus size={18} />
            </button>
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border bg-blue-50 border-blue-200 text-[#0066FF]"
              title="Devnexes AI Master Router"
            >
              <img src="/devnexes-logo.png" className="w-3.5 h-3.5 object-contain" alt="" />
              <span className="font-semibold">Auto Router</span>
            </div>
          </div>

          {/* Right: Model Dropdown + Mic + Send Button matching screenshot */}
          <div className="flex items-center space-x-2">
            
            {/* Model Selector Dropdown inside chat bar */}
            {onSelectModel && (
              <div className="relative flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 transition-colors cursor-pointer">
                <span className="text-[11.5px] font-semibold truncate max-w-[110px] sm:max-w-[140px]">
                  {currentModelName}
                </span>
                <ChevronDown size={13} className="text-slate-500 shrink-0" />
                <select
                  value={selectedModel}
                  onChange={(e) => onSelectModel(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Select Model"
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Mic Icon */}
            <button
              type="button"
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Voice Input"
            >
              <Mic size={16} />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                canSend
                  ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-md active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <ArrowUp size={15} strokeWidth={canSend ? 2.5 : 2} />
            </button>
          </div>
        </div>

      </div>

      {/* Footer hint */}
      <p className="text-center text-[10px] mt-2 text-slate-400">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

export default memo(ChatInput);
