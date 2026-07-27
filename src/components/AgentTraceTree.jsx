import React, { useState, useEffect, useRef, memo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Globe, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Play,
  CheckCircle2,
  Minimize2,
  Maximize2,
  RefreshCw,
  Cpu,
  Code2,
  Terminal,
  Layers,
  Brain,
  Server,
  FileCode
} from 'lucide-react';

function getSkillBadge(skillName) {
  const name = (skillName || '').toLowerCase();
  
  if (name.includes('cpp') || name.includes('c++')) {
    return { label: 'C++', bg: 'bg-blue-100/80 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-300 border-blue-200 dark:border-blue-800/60', icon: Terminal };
  }
  if (name.includes('python')) {
    return { label: 'Python', bg: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60', icon: Code2 };
  }
  if (name.includes('java')) {
    return { label: 'Java', bg: 'bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60', icon: Cpu };
  }
  if (name.includes('frontend') || name.includes('ui')) {
    return { label: 'Frontend UI', bg: 'bg-blue-100/80 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-300 border-blue-200 dark:border-blue-800/60', icon: Layers };
  }
  if (name.includes('ai') || name.includes('machine-learning')) {
    return { label: 'AI & ML', bg: 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60', icon: Brain };
  }
  if (name.includes('backend') || name.includes('api')) {
    return { label: 'Backend API', bg: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60', icon: Server };
  }

  return { label: skillName || 'Agent Skill', bg: 'bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: Cpu };
}

function cleanCodeContent(code) {
  if (!code) return '';
  return code
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```$/, '')
    .trim();
}

/**
 * Auto-scrolling Code Box container that stays fixed in layout and scrolls live as code streams
 */
function StreamingCodeBox({ code }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [code]);

  return (
    <div 
      ref={boxRef} 
      className="p-3.5 font-mono text-[12px] leading-relaxed overflow-y-auto max-h-64 custom-scrollbar text-slate-800 dark:text-slate-200 scroll-smooth"
    >
      <pre className="whitespace-pre">
        {code.split('\n').map((line, lIdx) => (
          <div key={lIdx} className="flex">
            <span className="w-6 shrink-0 select-none text-slate-400 dark:text-slate-600 text-right pr-2 text-[10px]">
              {lIdx + 1}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {line}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

function AgentTraceTree({ traceData, isExecuting, onOpenPreview, onOpenIdePanel }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedTools, setExpandedTools] = useState({});
  const [isMinimized, setIsMinimized] = useState(!isExecuting);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    if (isExecuting) {
      setIsMinimized(false);
      setUserToggled(false);
    } else if (!userToggled) {
      setIsMinimized(true);
    }
  }, [isExecuting, userToggled]);

  const handleToggleMinimize = () => {
    setUserToggled(true);
    setIsMinimized(prev => !prev);
  };

  const toggleToolExpand = (index) => {
    setExpandedTools(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(cleanCodeContent(code));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!traceData || !traceData.steps) return null;

  const pipelineSteps = traceData.steps.filter(s => s.type !== 'response');
  const responseStep = traceData.steps.find(s => s.type === 'response');

  return (
    <div className="agent-trace-container font-sans text-slate-800 dark:text-slate-200 my-1 max-w-4xl mx-auto">
      
      {/* Transparent Pipeline Status Header Bar */}
      {pipelineSteps.length > 0 && (
        <div className="mb-2 flex items-center justify-between px-1 py-1 rounded-xl bg-transparent text-xs select-none">
          <div 
            onClick={handleToggleMinimize}
            className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-[#0066FF] transition-colors"
          >
            {isExecuting ? (
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#0066FF] dark:text-blue-400 border border-blue-300 dark:border-blue-700 flex items-center justify-center">
                <RefreshCw size={12} className="animate-spin shrink-0" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={13} className="shrink-0" />
              </div>
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isExecuting ? 'Devnexes Pipeline Active...' : `Devnexes Pipeline Trace (${pipelineSteps.length} steps)`}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
              {isExecuting ? '• Streaming' : isMinimized ? '• Completed' : '• Active'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {pipelineSteps.some(s => s.type === 'artifact') && onOpenIdePanel && (
              <button
                onClick={() => {
                  const art = pipelineSteps.find(s => s.type === 'artifact');
                  if (art) onOpenIdePanel(cleanCodeContent(art.code), art.title, art.language);
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0066FF] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all shadow-2xs"
              >
                <Code2 size={12} />
                <span>Devnexes Canvas</span>
              </button>
            )}

            <button
              onClick={handleToggleMinimize}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 transition-all"
            >
              {isMinimized ? (
                <>
                  <Maximize2 size={12} />
                  <span>Show Trace</span>
                </>
              ) : (
                <>
                  <Minimize2 size={12} />
                  <span>Hide Trace</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Transparent Connector Pipeline Steps with Step-by-Step Staggered Animation */}
      {!isMinimized && (
        <div className="relative pl-7 sm:pl-9 space-y-4 mb-3 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[1.5px] before:bg-blue-200 dark:before:bg-slate-800">
          
          {pipelineSteps.map((step, idx) => {
            const delayStyle = { animationDelay: `${idx * 140}ms` };

            if (step.type === 'header') {
              return (
                <div key={idx} style={delayStyle} className="relative flex items-start group animate-step-reveal">
                  <div className="absolute -left-[27px] sm:-left-[31px] top-0.5 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0066FF] dark:text-blue-400 z-10 shadow-xs">
                    <img src="/devnexes-logo.png" className="w-3.5 h-3.5 object-contain" alt="Devnexes" />
                  </div>
                  <div className="pt-0.5 pl-1">
                    <h3 className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
                      {step.title}
                    </h3>
                  </div>
                </div>
              );
            }

            if (step.type === 'skill') {
              const badge = getSkillBadge(step.skillName);
              const SkillIcon = badge.icon;
              return (
                <div key={idx} style={delayStyle} className="relative flex items-center group animate-step-reveal">
                  <div className="absolute -left-[27px] sm:-left-[31px] top-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#0c0e12] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 z-10 shadow-xs">
                    <SkillIcon size={12} />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 font-normal pl-1">
                    <span>Loaded Skill:</span>
                    <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold flex items-center space-x-1 ${badge.bg}`}>
                      <SkillIcon size={11} />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>
              );
            }

            if (step.type === 'tool_search') {
              const isExpanded = !!expandedTools[idx];
              return (
                <div key={idx} style={delayStyle} className="relative group space-y-1.5 pl-1 animate-step-reveal">
                  <div className="absolute -left-[27px] sm:-left-[31px] top-1 w-6 h-6 rounded-full bg-white dark:bg-[#0c0e12] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center z-10 shadow-xs">
                    <Globe size={13} />
                  </div>

                  <div 
                    onClick={() => toggleToolExpand(idx)}
                    className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-2 pr-2">
                      <span className="font-normal text-slate-600 dark:text-slate-400 truncate max-w-xl">
                        {step.query}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                        {step.results.length} results
                      </span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#11141e]/90 shadow-xs overflow-hidden">
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                        {step.results.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between px-3.5 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex items-center space-x-2.5 truncate pr-3">
                              <span className="shrink-0 text-[#0066FF]">
                                {res.type === 'claude' ? (
                                  <img src="/devnexes-logo.png" className="w-3.5 h-3.5 object-contain" alt="Devnexes" />
                                ) : (
                                  <Globe size={12} className="text-blue-500" />
                                )}
                              </span>
                              <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                {res.title}
                              </span>
                            </div>
                            <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {res.domain}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (step.type === 'artifact') {
              const langTag = (step.language || 'code').toUpperCase();
              const cleanedCode = cleanCodeContent(step.code);
              const isWebPreviewable = step.language === 'html' || step.language === 'htm' || (cleanedCode && (cleanedCode.includes('<!DOCTYPE') || cleanedCode.includes('<html')));

              return (
                <div key={idx} style={delayStyle} className="relative group space-y-1.5 pl-1 animate-step-reveal">
                  <div className="absolute -left-[27px] sm:-left-[31px] top-1 w-6 h-6 rounded-full bg-[#0066FF] text-white flex items-center justify-center z-10 shadow-xs">
                    <FileCode size={13} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-normal leading-snug">
                    <div>
                      Generated Code: <span className="font-semibold text-slate-800 dark:text-slate-200">{step.title}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-mono text-[10px] font-bold uppercase">
                        {langTag}
                      </span>
                    </div>
                  </div>

                  <div className="relative mt-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc]/90 dark:bg-[#0d0f15]/90 shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100/90 dark:bg-[#090a0e]/90 border-b border-slate-200 dark:border-slate-800 text-xs">
                      <span className="font-mono text-[#0066FF] dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider">
                        {step.language || 'code'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {onOpenIdePanel && (
                          <button
                            onClick={() => onOpenIdePanel(cleanedCode, step.title, step.language)}
                            className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0066FF] dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center space-x-1"
                          >
                            <Code2 size={11} />
                            <span>Open Canvas</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyCode(cleanedCode, idx)}
                          className="p-1 px-2 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
                          title="Copy Code"
                        >
                          {copiedIndex === idx ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          <span className="text-[11px] font-medium">{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                        {isWebPreviewable && onOpenPreview && (
                          <button
                            onClick={() => onOpenPreview(cleanedCode, step.title)}
                            className="px-2.5 py-0.5 rounded bg-[#0066FF] hover:bg-blue-700 text-white text-[11px] font-medium transition-colors flex items-center space-x-1 shadow-xs"
                          >
                            <Play size={10} fill="currentColor" />
                            <span>Live Demo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Auto-scrolling Code Container */}
                    <StreamingCodeBox code={cleanedCode} />
                  </div>
                </div>
              );
            }

            return null;
          })}

        </div>
      )}

      {/* Clean Streamed Response Content */}
      {responseStep && responseStep.content && (
        <div style={{ animationDelay: `${pipelineSteps.length * 140}ms` }} className="pt-1.5 animate-step-reveal">
          <div className="py-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            <MarkdownRenderer content={responseStep.content} />
          </div>
        </div>
      )}

    </div>
  );
}

export default memo(AgentTraceTree);
