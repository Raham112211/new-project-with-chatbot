import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Brain, 
  Globe, 
  FileCode, 
  Cpu, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  RefreshCw,
  Code2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Sliders,
  Terminal
} from 'lucide-react';
import { DETAILED_SKILLS } from '../skills/index.js';
import { cleanCodeFence } from '../services/groqService.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';

function getSkillBadge(skillId) {
  switch (skillId) {
    case 'devnexes-studio-specialist':
      return { bg: 'bg-[#EFF6FF] border-[#BFDBFE]', color: 'text-[#0066FF]', icon: Sparkles };
    case 'cpp-systems-architect':
      return { bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-600', icon: Cpu };
    case 'fullstack-web-architect':
      return { bg: 'bg-indigo-50 border-indigo-200', color: 'text-indigo-600', icon: Code2 };
    case 'git-devops-engineer':
      return { bg: 'bg-purple-50 border-purple-200', color: 'text-purple-600', icon: Sliders };
    case 'system-utility-integrator':
      return { bg: 'bg-amber-50 border-amber-200', color: 'text-amber-600', icon: Terminal };
    default:
      return { bg: 'bg-blue-50 border-blue-200', color: 'text-[#0066FF]', icon: Sparkles };
  }
}

// ── Main AgentTraceTree Component ────────────────────────────────
function AgentTraceTree({ traceData, isExecuting, onOpenPreview, onOpenIdePanel }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedTools, setExpandedTools] = useState({});
  const [expandedArtifacts, setExpandedArtifacts] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  // Auto-open while executing, auto-close smoothly when completed
  useEffect(() => {
    if (isExecuting) {
      setIsMinimized(false);
      setUserToggled(false);
    } else if (!userToggled) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isExecuting, userToggled]);

  const handleToggleMinimize = () => {
    setUserToggled(true);
    setIsMinimized(prev => !prev);
  };

  const toggleToolExpand = (index) => {
    setExpandedTools(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleArtifactExpand = (index) => {
    setExpandedArtifacts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(cleanCodeFence(code));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!traceData || !traceData.steps) return null;

  const pipelineSteps = traceData.steps.filter(s => s.type !== 'response');
  const responseStep = traceData.steps.find(s => s.type === 'response');
  const hasArtifact = pipelineSteps.some(s => s.type === 'artifact');

  return (
    <div className="font-sans text-slate-800 dark:text-slate-200 my-1 max-w-3xl">

      {/* ── Pipeline Header Bar ───────────────────────────────── */}
      {pipelineSteps.length > 0 && (
        <div className="mb-2 flex items-center justify-between select-none">
          {/* Left: status */}
          <div className="flex items-center space-x-2">
            {isExecuting ? (
              <div className="relative w-3 h-3 shrink-0">
                <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
                <div className="w-3 h-3 rounded-full bg-[#0066FF] animate-pulse" />
              </div>
            ) : (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            )}
            <span className={`text-[12px] font-semibold ${isExecuting ? 'text-[#0066FF] dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {isExecuting ? 'Running pipeline...' : 'Pipeline complete'}
            </span>
            {!isExecuting && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">· {pipelineSteps.length} steps</span>
            )}
          </div>

          {/* Right: Minimalist Ghost Buttons */}
          <div className="flex items-center space-x-1">
            {hasArtifact && onOpenIdePanel && (
              <button
                onClick={() => {
                  const art = pipelineSteps.find(s => s.type === 'artifact');
                  if (art) onOpenIdePanel(cleanCodeFence(art.code), art.title, art.language);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11.5px] font-medium text-[#0066FF] hover:bg-blue-50/80 transition-colors"
              >
                <Code2 size={12} className="text-[#0066FF]" />
                <span>Canvas</span>
              </button>
            )}
            <button
              onClick={handleToggleMinimize}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11.5px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
            >
              <ChevronDown size={12} className={`transition-transform duration-200 ${isMinimized ? '' : 'rotate-180'}`} />
              <span>{isMinimized ? 'View steps' : 'Hide steps'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Animated Smooth Expandable Pipeline Steps ──────────── */}
      {pipelineSteps.length > 0 && (
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isMinimized 
              ? 'max-h-0 opacity-0 scale-98 pointer-events-none' 
              : 'max-h-[2500px] opacity-100 scale-100 mb-4'
          }`}
        >
          <div className="relative space-y-3 pl-8 pt-1">
            {/* Vertical connector line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />
            {isExecuting && (
              <div 
                className="absolute left-[11px] top-3 w-px bg-gradient-to-b from-[#0066FF] to-blue-300 connector-line-fill transition-all duration-300" 
                style={{ height: `${(pipelineSteps.filter(s => s.isDone || s.isStreaming === false).length / Math.max(pipelineSteps.length, 1)) * 100}%` }} 
              />
            )}

            {pipelineSteps.map((step, idx) => {

              // ── MODEL SWITCH STEP ─────────────────────────────
              if (step.type === 'model_switch') {
                return (
                  <div key={idx} className="relative animate-step-reveal mb-2.5">
                    <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-[#0066FF] border border-blue-400 flex items-center justify-center text-white shadow-xs z-10">
                      <Cpu size={10} />
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-mono">
                      <RefreshCw size={12} className="animate-spin text-[#0066FF] shrink-0" style={{ animationDuration: '3s' }} />
                      <span>Auto-switched model for dynamic execution</span>
                    </div>
                  </div>
                );
              }

              // ── THINKING STEP ─────────────────────────────────
              if (step.type === 'thinking') {
                return (
                  <div key={idx} className={`relative animate-step-reveal ${step.isStreaming ? 'step-row-active' : ''}`}>
                    <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-xs relative transition-all duration-300 ${
                      step.isStreaming
                        ? 'bg-violet-600 border-2 border-violet-300 text-white shadow-[0_0_14px_rgba(139,92,246,0.8)] animate-pulse'
                        : 'bg-violet-100 border border-violet-300'
                    }`}>
                      <Brain size={10} className={step.isStreaming ? 'text-white animate-spin' : 'text-violet-500'} />
                    </div>

                    <div>
                      <button
                        onClick={() => setThinkingExpanded(p => !p)}
                        className="flex items-center justify-between w-full text-left mb-1 group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide">
                            {step.isStreaming ? 'Thinking' : 'Thought process'}
                          </span>
                          {step.isStreaming && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200 text-[10px] font-mono animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                              <span>Processing...</span>
                            </span>
                          )}
                        </div>
                        {thinkingExpanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
                      </button>

                      {thinkingExpanded && step.content && (
                        <div className="text-[12.5px] leading-relaxed bg-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-200 space-y-1.5 font-normal animate-fade-in">
                          {step.content
                            .split('\n')
                            .filter(line => line.trim())
                            .map((line, i) => {
                              const clean = line.replace(/^[-*•>]+\s*/, '').trim();
                              const isNumbered = /^\d+\./.test(line.trim());
                              return (
                                <div key={i} className="flex items-start space-x-2">
                                  <span className="shrink-0 mt-0.5 text-[#0066FF] font-bold">{isNumbered ? line.match(/^\d+/)[0] + '.' : '·'}</span>
                                  <span className="text-slate-900 font-medium">{isNumbered ? clean.replace(/^\d+\.\s*/, '') : clean}</span>
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // ── SKILL STEP ────────────────────────────────────
              if (step.type === 'skill') {
                const skillData = step.skillData || DETAILED_SKILLS[step.skillName] || {
                  id: step.skillName || 'dynamic-specialist',
                  name: step.skillLabel || step.skillName || 'Dynamic Domain Specialist',
                  category: 'Dynamic AI Persona',
                  description: 'Real-time adaptive domain specialist dynamically activated for this request.',
                  domains: ['github.com', 'developer.mozilla.org']
                };
                const badge = getSkillBadge(skillData.id || step.skillName);
                const SkillIcon = badge.icon;
                const isExpanded = !!expandedTools[idx];

                return (
                  <div key={idx} className="relative animate-step-reveal">
                    <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-xs">
                      <SkillIcon size={10} className={badge.color} />
                    </div>
                    <button onClick={() => toggleToolExpand(idx)} className="w-full text-left">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Skill activated</span>
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${badge.bg} ${badge.color}`}>
                            <SkillIcon size={10} />
                            <span>{skillData.name || step.skillLabel || step.skillName}</span>
                          </span>
                        </div>
                        {isExpanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${badge.color}`}>{skillData.category || 'Domain Specialist'}</span>
                          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold">Real-Time Persona</span>
                        </div>
                        <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium">{skillData.description}</p>
                      </div>
                    )}
                  </div>
                );
              }

              // ── SEARCH STEP ──────────────────────────────────
              if (step.type === 'tool_search') {
                const isExpanded = !!expandedTools[idx];
                return (
                  <div key={idx} className={`relative animate-step-reveal ${step.isSearching ? 'step-row-active' : ''}`}>
                    <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-xs transition-all duration-300 ${
                      step.isSearching
                        ? 'bg-[#0066FF] border-2 border-blue-300 text-white shadow-[0_0_14px_rgba(0,102,255,0.8)] animate-pulse'
                        : 'bg-white border border-slate-200'
                    }`}>
                      {step.isSearching ? <RefreshCw size={10} className="text-white animate-spin" /> : <Globe size={10} className="text-blue-500" />}
                    </div>

                    <button onClick={() => toggleToolExpand(idx)} className="w-full text-left">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center space-x-2 truncate pr-3">
                          <span className="shrink-0 text-slate-400">{step.isSearching ? 'Searching' : 'Searched'}</span>
                          <span className="text-slate-700 font-medium truncate">"{step.query}"</span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {!step.isSearching && step.results.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                              {step.results.length} results
                            </span>
                          )}
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && !step.isSearching && step.results.length > 0 && (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs animate-fade-in">
                        <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto custom-scrollbar">
                          {step.results.map((result, rIdx) => (
                            <a
                              key={rIdx}
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start px-3.5 py-2.5 text-[11px] hover:bg-slate-50 transition-colors group"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center space-x-1.5 mb-0.5">
                                  <Globe size={10} className="text-blue-400 shrink-0" />
                                  <span className="text-[10px] text-slate-400 font-mono">{result.domain}</span>
                                </div>
                                <p className="font-medium text-slate-800 truncate group-hover:text-[#0066FF] transition-colors">
                                  {result.title}
                                </p>
                              </div>
                              <ExternalLink size={11} className="shrink-0 text-slate-300 group-hover:text-blue-400 transition-colors mt-0.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // ── CODE ARTIFACT STEP ────────────────────────────
              if (step.type === 'artifact') {
                const langTag = (step.language || 'code').toUpperCase();
                const cleanedCode = cleanCodeFence(step.code);
                const isArtExpanded = expandedArtifacts[idx] !== undefined ? expandedArtifacts[idx] : false;

                return (
                  <div key={idx} className={`relative animate-node-create ${step.isStreaming ? 'step-row-active' : ''}`}>
                    <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-xs transition-all duration-300 ${
                      step.isStreaming ? 'bg-blue-600 border-2 border-blue-300 text-white shadow-[0_0_14px_rgba(0,102,255,0.8)] animate-pulse' : 'bg-[#0066FF]'
                    }`}>
                      <FileCode size={10} className="text-white" />
                    </div>

                    <div>
                      <button onClick={() => toggleArtifactExpand(idx)} className="flex items-center justify-between w-full mb-1.5 text-left">
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-slate-500">{step.isStreaming ? 'Generating' : 'Generated'}</span>
                          <span className="font-semibold text-slate-800">{step.title}</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200 font-mono text-[9.5px] font-bold uppercase">
                            {langTag}
                          </span>
                        </div>
                        {isArtExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                      </button>

                      {isArtExpanded && (
                        <div className="rounded-xl border border-slate-200 bg-[#0d1017] text-slate-200 overflow-hidden shadow-xs animate-fade-in">
                          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-slate-800 text-[10.5px]">
                            <span className="font-mono text-[#0066FF] font-semibold">{langTag}</span>
                            <button
                              onClick={() => handleCopyCode(step.code, idx)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedIndex === idx ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-3.5 text-[11.5px] font-mono leading-relaxed overflow-x-auto custom-scrollbar max-h-60">
                            {cleanedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* ── Main Final Response Text Outside Pipeline Tree ─────── */}
      {responseStep && responseStep.content && (
        <div className="mt-3 text-sm leading-relaxed text-slate-800">
          <MarkdownRenderer content={responseStep.content} />
        </div>
      )}

    </div>
  );
}

export default React.memo(AgentTraceTree);
