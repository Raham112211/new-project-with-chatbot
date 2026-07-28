import React, { useState, useEffect, useRef, memo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { DETAILED_SKILLS } from '../skills/index.js';
import { cleanCodeFence } from '../services/groqService.js';
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
  FileCode,
  Search,
  ExternalLink,
  BookOpen,
  Wrench,
  ScanSearch,
  Hammer,
  PenLine,
  ShieldCheck,
  ListChecks,
  Microscope
} from 'lucide-react';

// ── Skill badge config (maps skill id → visual style) ────────────
function getSkillBadge(skillId) {
  const id = (skillId || '').toLowerCase();
  if (id.includes('cpp')) return { color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60', icon: Terminal };
  if (id.includes('python')) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60', icon: Code2 };
  if (id.includes('java')) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60', icon: Cpu };
  if (id.includes('frontend')) return { color: 'text-[#0066FF] dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60', icon: Layers };
  if (id.includes('backend')) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60', icon: Server };
  return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700', icon: Search };
}

// ── Action step icon + color map ───────────────────────────────
function getActionStyle(stepType) {
  switch (stepType) {
    case 'analyze': return { icon: Microscope, color: 'text-cyan-500', dotBg: 'bg-cyan-500 border-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/50', node: 'bg-cyan-100 dark:bg-cyan-950/70 border-cyan-300 dark:border-cyan-700/60' };
    case 'plan': return { icon: ListChecks, color: 'text-indigo-500', dotBg: 'bg-indigo-500 border-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50', node: 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700/60' };
    case 'fix': return { icon: Hammer, color: 'text-orange-500', dotBg: 'bg-orange-500 border-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/50', node: 'bg-orange-100 dark:bg-orange-950/70 border-orange-300 dark:border-orange-700/60' };
    case 'write': return { icon: PenLine, color: 'text-purple-500', dotBg: 'bg-purple-500 border-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50', node: 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700/60' };
    case 'verify': return { icon: ShieldCheck, color: 'text-emerald-500', dotBg: 'bg-emerald-500 border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50', node: 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700/60' };
    case 'summarize': return { icon: ScanSearch, color: 'text-teal-500', dotBg: 'bg-teal-500 border-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50', node: 'bg-teal-100 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700/60' };
    case 'explain': return { icon: Brain, color: 'text-violet-500', dotBg: 'bg-violet-500 border-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/50', node: 'bg-violet-100 dark:bg-violet-950/70 border-violet-300 dark:border-violet-700/60' };
    default: return { icon: Wrench, color: 'text-purple-600', dotBg: 'bg-purple-600 border-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50', node: 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700/60' };
  }
}

// ── Auto-scroll streaming code viewer ───────────────────────────
function StreamingCodeBox({ code }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [code]);

  const lines = code.split('\n');

  return (
    <div
      ref={boxRef}
      className="overflow-y-auto max-h-72 custom-scrollbar"
    >
      <div className="flex p-3.5 font-mono text-[11.5px] leading-relaxed min-w-0">
        {/* Line numbers */}
        <div className="shrink-0 select-none text-right pr-3 text-slate-400/60 dark:text-slate-600/80 font-mono text-[10.5px] leading-relaxed" style={{ minWidth: '2rem' }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Code content */}
        <div className="flex-1 overflow-x-auto min-w-0">
          <pre className="whitespace-pre text-slate-800 dark:text-slate-200">{code}</pre>
        </div>
      </div>
    </div>
  );
}

// ── Main AgentTraceTree Component ────────────────────────────────
function AgentTraceTree({ traceData, isExecuting, onOpenPreview, onOpenIdePanel }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedTools, setExpandedTools] = useState({});
  const [expandedArtifacts, setExpandedArtifacts] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  useEffect(() => {
    if (isExecuting) {
      setIsMinimized(false);
      setUserToggled(false);
    } else if (!userToggled) {
      setIsMinimized(false);
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
        <div className="mb-3 flex items-center justify-between select-none">
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
            <span className={`text-[12px] font-semibold ${isExecuting ? 'text-[#0066FF] dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
              }`}>
              {isExecuting ? 'Running pipeline...' : 'Pipeline complete'}
            </span>
            {!isExecuting && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">· {pipelineSteps.length} steps</span>
            )}
          </div>
          {/* Right: buttons */}
          <div className="flex items-center space-x-1.5">
            {hasArtifact && onOpenIdePanel && (
              <button
                onClick={() => {
                  const art = pipelineSteps.find(s => s.type === 'artifact');
                  if (art) onOpenIdePanel(cleanCodeFence(art.code), art.title, art.language);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#0066FF] text-white hover:bg-blue-700 transition-all"
              >
                <Code2 size={10} />
                <span>Canvas</span>
              </button>
            )}
            <button
              onClick={handleToggleMinimize}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isMinimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
              <span>{isMinimized ? 'Show' : 'Hide'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Pipeline Steps ─────────────────────────────────────── */}
      {!isMinimized && pipelineSteps.length > 0 && (
        <div className="relative mb-4 space-y-3 pl-8">
          {/* Vertical connector line — static base */}
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-800" />
          {/* Animated fill — grows as steps complete */}
          {isExecuting && (
            <div className="absolute left-[11px] top-3 w-px bg-gradient-to-b from-[#0066FF] to-blue-300 connector-line-fill" style={{ height: `${(pipelineSteps.filter(s => s.isDone || s.isStreaming === false).length / Math.max(pipelineSteps.length, 1)) * 100}%` }} />
          )}

          {pipelineSteps.map((step, idx) => {
            const revealDelay = {};

            // ── MODEL SWITCH STEP ─────────────────────────────
            if (step.type === 'model_switch') {
              return (
                <div key={idx} className="relative animate-step-reveal mb-2.5">
                  <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-[#0066FF] border border-blue-400 flex items-center justify-center text-white shadow-xs z-10">
                    <Cpu size={10} />
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-mono">
                    <RefreshCw size={12} className="animate-spin text-[#0066FF] shrink-0" style={{ animationDuration: '3s' }} />
                    <span>Auto-switched to <strong className="font-semibold text-blue-600 dark:text-blue-400">Qwen 3.5 2B</strong> for Code Generation</span>
                  </div>
                </div>
              );
            }

            // ── THINKING STEP ─────────────────────────────────
            if (step.type === 'thinking') {
              return (
                <div key={idx} style={revealDelay} className={`relative animate-step-reveal ${step.isStreaming ? 'step-row-active' : ''}`}>
                  {/* Node dot with pulsing glow animation when active */}
                  <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-xs relative transition-all duration-300
                    ${step.isStreaming
                      ? 'bg-violet-600 border-2 border-violet-300 text-white shadow-[0_0_14px_rgba(139,92,246,0.8)] animate-pulse'
                      : 'bg-violet-100 dark:bg-violet-950/70 border border-violet-300 dark:border-violet-700/60'}`}>
                    {step.isStreaming && <span className="node-active-ring text-violet-400" />}
                    <Brain size={10} className={step.isStreaming ? 'text-white animate-spin' : 'text-violet-500'} />
                  </div>

                  {/* Content Header — Clickable by user */}
                  <div>
                    <button
                      onClick={() => setThinkingExpanded(p => !p)}
                      className="flex items-center justify-between w-full text-left mb-1 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                          {step.isStreaming ? 'Thinking' : 'Thought process'}
                        </span>
                        {step.isStreaming && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-[10px] font-mono animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                            <span>Processing...</span>
                          </span>
                        )}
                      </div>
                      {thinkingExpanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
                    </button>

                    {/* Expandable content — ONLY shown when user clicks thinkingExpanded */}
                    {thinkingExpanded && step.content && (
                      <div className="text-[12.5px] leading-relaxed bg-slate-100/90 dark:bg-slate-900/80 rounded-xl px-3.5 py-2.5 border border-slate-200/90 dark:border-slate-800 space-y-1.5 font-normal animate-accordion-down">
                        {step.content
                          .split('\n')
                          .filter(line => line.trim())
                          .map((line, i) => {
                            const clean = line.replace(/^[-*•>]+\s*/, '').trim();
                            const isNumbered = /^\d+\./.test(line.trim());
                            return (
                              <div key={i} className="flex items-start space-x-2">
                                <span className="shrink-0 mt-0.5 text-[#0066FF] font-bold">{isNumbered ? line.match(/^\d+/)[0] + '.' : '·'}</span>
                                <span className="text-slate-950 dark:text-slate-100 font-medium">{isNumbered ? clean.replace(/^\d+\.\s*/, '') : clean}</span>
                              </div>
                            );
                          })
                        }
                        {step.isStreaming && (
                          <span className="inline-block w-0.5 h-3.5 bg-violet-500 ml-0.5 animate-blink align-middle" />
                        )}
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
                <div key={idx} style={revealDelay} className="relative animate-step-reveal">
                  <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center z-10 shadow-xs relative">
                    <SkillIcon size={10} className={badge.color} />
                  </div>
                  <button onClick={() => toggleToolExpand(idx)} className="w-full text-left">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 dark:text-slate-500">Skill activated</span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${badge.bg} ${badge.color}`}>
                          <SkillIcon size={10} />
                          <span>{skillData.name || step.skillLabel || step.skillName}</span>
                        </span>
                      </div>
                      {isExpanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1017] overflow-hidden">
                      <div className="px-3.5 py-2.5 space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${badge.color}`}>{skillData.category || 'Domain Specialist'}</span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold">Real-Time Persona</span>
                          </div>
                          <p className="text-[11.5px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-medium">{skillData.description}</p>
                        </div>
                        {skillData.systemPrompt && (
                          <div className="text-[10.5px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-3 italic">
                            "{skillData.systemPrompt.slice(0, 180)}..."
                          </div>
                        )}
                        {skillData.domains?.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                            <BookOpen size={10} className="text-slate-400 shrink-0" />
                            {skillData.domains.map((domain, dIdx) => (
                              <a
                                key={dIdx}
                                href={`https://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-[#0066FF] dark:hover:text-blue-400 font-mono transition-colors"
                              >
                                {domain}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // ── SEARCH STEP ──────────────────────────────────
            if (step.type === 'tool_search') {
              const isExpanded = !!expandedTools[idx];
              return (
                <div key={idx} style={revealDelay} className={`relative animate-step-reveal ${step.isSearching ? 'step-row-active' : ''}`}>
                  <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-xs relative transition-all duration-300
                    ${step.isSearching
                      ? 'bg-[#0066FF] border-2 border-blue-300 text-white shadow-[0_0_14px_rgba(0,102,255,0.8)] animate-pulse'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}>
                    {step.isSearching && <span className="node-active-ring text-blue-400" />}
                    {step.isSearching ? (
                      <RefreshCw size={10} className="text-white animate-spin" />
                    ) : (
                      <Globe size={10} className="text-blue-500" />
                    )}
                  </div>

                  <button
                    onClick={() => toggleToolExpand(idx)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500">
                      <div className="flex items-center space-x-2 truncate pr-3">
                        <span className="shrink-0 text-slate-400">{step.isSearching ? 'Searching' : 'Searched'}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">"{step.query}"</span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {!step.isSearching && step.results.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">
                            {step.results.length} results
                          </span>
                        )}
                        {step.isSearching ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            <span>Live Search...</span>
                          </span>
                        ) : step.results.length > 0 ? (
                          isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                        ) : null}
                      </div>
                    </div>
                  </button>

                  {/* Real search results */}
                  {isExpanded && !step.isSearching && step.results.length > 0 && (
                    <div className="mt-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1017] overflow-hidden shadow-xs">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-52 overflow-y-auto custom-scrollbar">
                        {step.results.map((result, rIdx) => (
                          <a
                            key={rIdx}
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start px-3.5 py-2.5 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center space-x-1.5 mb-0.5">
                                <Globe size={10} className="text-blue-400 shrink-0" />
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{result.domain}</span>
                              </div>
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0066FF] transition-colors">
                                {result.title}
                              </p>
                              {result.snippet && (
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                            <ExternalLink size={11} className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors mt-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.isSearching && (
                    <div className="mt-2 px-3.5 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                          ))}
                        </div>
                        <span className="text-[11px] text-blue-500 dark:text-blue-400">Fetching live results...</span>
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
              const isPreviewable = step.language === 'html' || (cleanedCode && (cleanedCode.includes('<!DOCTYPE') || cleanedCode.includes('<html')));
              const lineCount = cleanedCode ? cleanedCode.split('\n').length : 0;
              const isArtExpanded = expandedArtifacts[idx] !== undefined ? expandedArtifacts[idx] : true;

              return (
                <div key={idx} style={revealDelay} className={`relative animate-node-create ${step.isStreaming ? 'step-row-active' : ''}`}>
                  <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-xs relative transition-all duration-300
                    ${step.isStreaming ? 'bg-blue-600 border-2 border-blue-300 text-white shadow-[0_0_14px_rgba(0,102,255,0.8)] animate-pulse' : 'bg-[#0066FF]'}`}>
                    {step.isStreaming && <span className="node-active-ring text-blue-400" />}
                    <FileCode size={10} className={step.isStreaming ? 'text-white animate-spin' : 'text-white'} />
                  </div>

                  <div>
                    {/* Code block header — clickable to expand */}
                    <button
                      onClick={() => toggleArtifactExpand(idx)}
                      className="flex items-center justify-between w-full mb-1.5 text-left"
                    >
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-500">{step.isStreaming ? 'Generating' : 'Generated'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{step.title}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-mono text-[9.5px] font-bold uppercase">
                          {langTag}
                        </span>
                        {step.isStreaming ? (
                          <span className="flex space-x-0.5">
                            {[0, 1, 2].map(i => (
                              <span key={i} className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                            ))}
                          </span>
                        ) : lineCount > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-600">{lineCount} lines</span>
                        )}
                      </div>
                      {!step.isStreaming && (isArtExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />)}
                    </button>

                    {/* Code block — only shown when expanded */}
                    {isArtExpanded && (
                      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-[#f8fafc] dark:bg-[#090c12] shadow-xs animate-accordion-down">
                        {/* Code toolbar */}
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 dark:bg-[#0a0c12] border-b border-slate-200 dark:border-slate-800 text-[11px]">
                          <span className="font-mono text-[#0066FF] dark:text-blue-400 font-semibold uppercase tracking-wider text-[10px]">
                            {step.language || 'code'}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            {onOpenIdePanel && cleanedCode && (
                              <button
                                onClick={() => onOpenIdePanel(cleanedCode, step.title, step.language)}
                                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 text-[#0066FF] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              >
                                <Code2 size={10} />
                                <span>Canvas</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyCode(cleanedCode, idx)}
                              className="flex items-center space-x-1 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                            >
                              {copiedIndex === idx ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                            </button>
                            {isPreviewable && onOpenPreview && cleanedCode && (
                              <button
                                onClick={() => onOpenPreview(cleanedCode, step.title)}
                                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0066FF] text-white hover:bg-blue-700 transition-colors"
                              >
                                <Play size={9} fill="currentColor" />
                                <span>Preview</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {cleanedCode ? (
                          <StreamingCodeBox code={cleanedCode} language={step.language} />
                        ) : (
                          <div className="flex items-center space-x-2 px-4 py-3">
                            <RefreshCw size={12} className="text-blue-400 animate-spin" />
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Generating code...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // ── ACTION STEP ───────────────────────────────────
            if (step.type === 'action') {
              const style = getActionStyle(step.stepType);
              const ActionIcon = style.icon;
              const isExpanded = expandedTools[idx] !== undefined ? expandedTools[idx] : step.isStreaming;

              return (
                <div key={idx} style={revealDelay} className={`relative animate-node-create ${step.isStreaming ? 'step-row-active' : ''}`}>
                  {/* Node dot with pulsing active animation */}
                  <div className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 shadow-xs relative transition-all duration-300
                    ${step.isStreaming
                      ? `${style.dotBg} shadow-[0_0_14px_rgba(168,85,247,0.8)] animate-active-node-blink`
                      : style.node}`}>
                    {step.isStreaming && <span className={`node-active-ring ${style.color}`} />}
                    <ActionIcon size={10} className={step.isStreaming ? 'text-white animate-spin' : style.color} />
                  </div>

                  <div>
                    {/* Header row */}
                    <button
                      onClick={() => toggleToolExpand(idx)}
                      className="flex items-center justify-between w-full text-left mb-1"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`text-[11px] font-semibold ${style.color}`}>{step.label}</span>
                        {step.isStreaming && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                            <span>Executing...</span>
                          </span>
                        )}
                        {step.isDone && !step.isStreaming && (
                          <CheckCircle2 size={11} className="text-emerald-500" />
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
                    </button>

                    {/* Content — ONLY shown when user clicks to expand */}
                    {isExpanded && step.content && (
                      <div className={`text-[12.5px] leading-relaxed rounded-xl px-3.5 py-2.5 border ${style.bg} animate-accordion-down`}>
                        <p className="text-slate-950 dark:text-slate-100 font-medium whitespace-pre-wrap">{step.content}</p>
                        {step.isStreaming && (
                          <span className={`inline-block w-0.5 h-3.5 ml-0.5 animate-blink align-middle ${style.color.replace('text-', 'bg-')}`} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* ── Streamed Response ──────────────────────────────────── */}
      {responseStep && responseStep.content && (
        <div className="pt-1 animate-step-reveal" style={{ animationDelay: `${pipelineSteps.length * 80}ms` }}>
          <div className="text-sm leading-relaxed text-slate-950 font-normal">
            <MarkdownRenderer content={responseStep.content} />
          </div>
        </div>
      )}

    </div>
  );
}

export default memo(AgentTraceTree);
