import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Play, 
  Terminal, 
  Code2, 
  FileCode, 
  X
} from 'lucide-react';

/**
 * Devnexes AI Split-Screen Code Canvas Workbench
 * Real-time live streaming auto-scroll editor with light/dark theme support
 */
export default function IdeCodePanel({ 
  isOpen, 
  onClose, 
  code, 
  title, 
  language, 
  onOpenPreview 
}) {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);

  // Auto-scroll to bottom live as LLM streams code tokens in real-time
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [code]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langTag = (language || 'code').toLowerCase();
  const isWebPreviewable = langTag === 'html' || langTag === 'htm' || (code && (code.includes('<!DOCTYPE') || code.includes('<html')));

  const extMap = { cpp: '.cpp', python: '.py', javascript: '.js', html: '.html', css: '.css', java: '.java', sql: '.sql' };
  const fileExt = extMap[langTag] || `.${langTag}`;
  const fileName = (title || 'main_canvas').toLowerCase().replace(/[^a-z0-9]/g, '_') + fileExt;

  return (
    <div className="flex-1 lg:w-1/2 xl:w-7/12 h-full bg-[#f8fafc] dark:bg-[#0c101b] border-l border-slate-200 dark:border-slate-800/80 flex flex-col overflow-hidden select-none transition-all duration-300 animate-fade-in shadow-xl z-20 font-sans">
      
      {/* Canvas Top Bar */}
      <div className="h-12 px-4 bg-[#f1f5f9] dark:bg-[#080a0f] border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        
        {/* Active File Tab */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-t-lg bg-white dark:bg-[#0e121c] border-t-2 border-[#0066FF] border-x border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 shadow-xs">
            <FileCode size={14} className="text-[#0066FF] shrink-0" />
            <span className="font-semibold truncate max-w-[220px]">{fileName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-[#0066FF] dark:text-blue-400 font-bold uppercase font-sans">
              {langTag}
            </span>
          </div>
        </div>

        {/* Canvas Toolbar Actions */}
        <div className="flex items-center space-x-2">
          {isWebPreviewable && onOpenPreview && (
            <button
              onClick={() => onOpenPreview(code, title)}
              className="px-3 py-1 rounded-lg bg-[#0066FF] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5"
            >
              <Play size={11} fill="currentColor" />
              <span>Live Preview</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700/60 shadow-xs"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close Canvas Workbench"
          >
            <X size={16} />
          </button>
        </div>

      </div>

      {/* Main Canvas Code Editor Area */}
      <div 
        ref={editorRef}
        className="flex-1 bg-white dark:bg-[#090b10] text-slate-800 dark:text-slate-200 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed custom-scrollbar scroll-smooth"
      >
        {code ? (
          <div className="flex space-x-4 min-h-full">
            {/* Line Numbers Column */}
            <div className="shrink-0 select-none text-slate-400 dark:text-slate-600 text-right pr-2 text-[11px] leading-relaxed font-mono">
              {code.split('\n').map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>

            {/* Code Content Area */}
            <div className="flex-1 overflow-x-auto text-slate-800 dark:text-slate-100 font-mono">
              <pre className="whitespace-pre">{code}</pre>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 pt-16 font-sans">
            <Code2 size={36} className="opacity-40 text-[#0066FF]" />
            <p className="text-xs">Devnexes Code Canvas Ready. Generate code to view here.</p>
          </div>
        )}
      </div>

      {/* Terminal Log Bar */}
      <div className="h-9 px-4 bg-[#f1f5f9] dark:bg-[#07080c] border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
        <div className="flex items-center space-x-2 text-[#0066FF] dark:text-blue-400">
          <Terminal size={13} />
          <span className="font-semibold">DEVNEXES CODE ENGINE ACTIVE</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-500">
          <span>UTF-8</span>
          <span>•</span>
          <span className="uppercase text-[#0066FF] font-bold">{langTag}</span>
        </div>
      </div>

    </div>
  );
}
