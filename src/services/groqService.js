/**
 * Devnexes AI — Dynamic Intelligence Pipeline
 * Powered 100% by Local Ollama AI Engine + Tavily/DuckDuckGo Live Web Search.
 * Decoupled Architecture: Tool-Unaware Open Goal Planner & Capability Router.
 */

import { getOrGenerateSkillPersona } from '../skills/index.js';
import { analyzeQueryIntent } from './agentOrchestrator.js';
import { resolveAndExecuteStep } from './executorRegistry.js';

export const OLLAMA_BASE = 'http://localhost:11434/v1';
export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const DEFAULT_MODEL = 'gemma3:1b';
export const FAST_MODEL = 'gemma3:1b';
export const CODE_MODEL = 'qwen3.5:2b';

export const AVAILABLE_MODELS = [
  // Local Models
  { id: 'gemma3:1b', name: 'Gemma 3 1B (Local General)', provider: 'ollama', category: 'Local Ollama Models' },
  { id: 'qwen3.5:2b', name: 'Qwen 3.5 2B (Local Coding)', provider: 'ollama', category: 'Local Ollama Models' },
  // OpenRouter Models
  { id: 'openrouter/auto', name: 'OpenRouter Auto (Best Free Fallback)', provider: 'openrouter', category: 'OpenRouter Cloud Models' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', provider: 'openrouter', category: 'OpenRouter Cloud Models' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', provider: 'openrouter', category: 'OpenRouter Cloud Models' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OpenRouter)', provider: 'openrouter', category: 'OpenRouter Cloud Models' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B (OpenRouter)', provider: 'openrouter', category: 'OpenRouter Cloud Models' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', provider: 'openrouter', category: 'OpenRouter Cloud Models' }
];

export function getTavilyApiKey() {
  return localStorage.getItem('tavily_api_key') || import.meta.env.VITE_TAVILY_API_KEY || '';
}
export function setTavilyApiKey(key) {
  if (key) localStorage.setItem('tavily_api_key', key.trim());
  else localStorage.removeItem('tavily_api_key');
}

export function getOpenRouterApiKey() {
  return localStorage.getItem('openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '';
}
export function setOpenRouterApiKey(key) {
  if (key) localStorage.setItem('openrouter_api_key', key.trim());
  else localStorage.removeItem('openrouter_api_key');
}

export function getLLMConfig(model = DEFAULT_MODEL) {
  const isOpenRouter = model.includes('/') || AVAILABLE_MODELS.find(m => m.id === model)?.provider === 'openrouter';
  const endpoint = isOpenRouter ? `${OPENROUTER_BASE}/chat/completions` : `${OLLAMA_BASE}/chat/completions`;
  const openRouterKey = getOpenRouterApiKey();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (isOpenRouter) {
    if (!openRouterKey) {
      throw new Error('OpenRouter API Key is missing. Please add VITE_OPENROUTER_API_KEY in .env or configure it in Settings.');
    }
    headers['Authorization'] = `Bearer ${openRouterKey}`;
    headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    headers['X-Title'] = 'Devnexes AI Workspace';
  } else {
    headers['Authorization'] = 'Bearer ollama';
  }

  return { endpoint, headers, isOpenRouter };
}

/**
 * Utility helper to extract pure code blocks and strip markdown commentary
 */
export function cleanCodeFence(code) {
  if (!code) return '';
  let str = code.trim();

  // 1. Try to extract from ``` fences (robust regex allowing spaces)
  const fenceMatches = [...str.matchAll(/```[a-zA-Z0-9_+-]*\s*\n([\s\S]*?)```/g)];
  if (fenceMatches.length > 0) {
    const longestBlock = fenceMatches.reduce((max, match) => match[1].length > max.length ? match[1] : max, '');
    if (longestBlock.trim()) {
      return longestBlock.trim();
    }
  }

  // 2. If no fences but looks like HTML, extract explicitly between tags
  if (str.toLowerCase().includes('<!doctype html>') || str.toLowerCase().includes('<html')) {
    const htmlMatch = str.match(/(?:<!DOCTYPE html>[\s\S]*?|<html[\s\S]*?>)[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      return htmlMatch[0].trim();
    }
  }

  // 3. Fallback: aggressive stripping of common conversational wrappers
  return str
    .replace(/^[\s\S]*?(?=<!DOCTYPE|<html|#include|import |def |class |function |const |let |var )/i, '') 
    .replace(/```[a-zA-Z0-9_+-]*\s*\n?/g, '') 
    .replace(/\n?```[\s\S]*$/g, '') 
    .trim();
}

export async function streamGroqChat({ messages, model = DEFAULT_MODEL, onChunk, onError, maxTokens }) {
  try {
    const { endpoint, headers } = getLLMConfig(model);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        stream: true,
        ...(maxTokens ? { max_tokens: maxTokens } : {})
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || errJson.message || `LLM API Error HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '', buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const jsonStr = line.startsWith('data: ') ? line.slice(6).trim() : line;
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta, fullText);
          }
        } catch (_) {}
      }
    }

    if (buffer.trim()) {
      const jsonStr = buffer.trim().startsWith('data: ') ? buffer.trim().slice(6).trim() : buffer.trim();
      if (jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta, fullText);
          }
        } catch (_) {}
      }
    }

    return fullText;
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

/**
 * Real-Time Open Goal Planner — Generates a dynamic node execution plan from scratch.
 * No hardcoded fallbacks. Every node is planned by the LLM based on user's actual request.
 */
async function runThinkingStep({ userPrompt, analysis, activeSkill, pastContext, model, traceSteps, onStepUpdate }) {
  const thinkingIdx = traceSteps.length;
  traceSteps.push({ type: 'thinking', content: '', isStreaming: true, plan: null });
  if (onStepUpdate) onStepUpdate([...traceSteps]);

  const intentLabel = analysis.intentCategory || 'CONCEPT_EXPLANATION';
  const needsCode = analysis.needsCodeArtifact;
  const needsSearch = analysis.needsSearch;
  const lang = analysis.artifactLanguage || 'code';

  const thinkingSystem = `You are the Master Real-Time Execution Planner for Devnexes AI.
Active Skill: ${activeSkill.name} (${activeSkill.category})
Detected Intent: ${intentLabel}

Your job:
1. Think step-by-step in 2 to 3 short sentences about how to solve the user's request.
CRITICAL THINKING RULE: Do NOT write out the full code, document, or answer inside the thinking text. Thinking text is ONLY for strategic planning.

2. Output a JSON execution plan at the very end wrapped inside <plan>...</plan>.

DYNAMIC NODE PLANNING RULES:
- You are 100% responsible for defining the execution nodes.
- For Code/Web App/Implementation requests (e.g. "create website", "write C++ code"):
  - Create a "code" node with exact language (e.g., "html", "javascript", "python", "cpp").
  - Set target: "canvas".
- For Document/Letter/Writing requests:
  - Create a "write" node with language: "markdown" or "text".
  - Set target: "canvas".
- For General Questions / Analysis / Synthesis:
  - Create "analyze" or "synthesize" nodes.
  - Set target: "chat".
- For Live Internet Research requests:
  - Create a "search" node followed by a "synthesize" node.

First write 2-3 sentences of reasoning, then end with ONLY:
<plan>
{
  "complexity": "simple | moderate | complex",
  "summary": "One sentence goal summary",
  "nodes": [
    {
      "id": "node_1",
      "title": "Dynamic Descriptive Title",
      "role": "analyze | write | code | search | synthesize",
      "goal": "Clear objective of this specific node",
      "language": "html | css | javascript | python | cpp | markdown | null",
      "target": "canvas | chat"
    }
  ]
}
</plan>`;

  let rawThinking = '';

  await streamGroqChat({
    messages: [
      { role: 'system', content: thinkingSystem },
      ...pastContext,
      { role: 'user', content: userPrompt }
    ],
    model: model || FAST_MODEL,
    onChunk: (_, fullText) => {
      rawThinking = fullText;
      // Show reasoning text in real-time (strip <plan> block from display)
      const display = fullText.replace(/<plan>[\s\S]*/i, '').replace(/```[\s\S]*$/i, '').trim();
      traceSteps[thinkingIdx].content = display;
      traceSteps[thinkingIdx].isStreaming = true;
      if (onStepUpdate) onStepUpdate([...traceSteps]);
    }
  });

  // Parse <plan> JSON from LLM output
  let plan = { complexity: 'moderate', summary: '', nodes: [] };
  const planMatch = rawThinking.match(/<plan>([\s\S]*?)<\/plan>/i);
  if (planMatch) {
    try {
      plan = JSON.parse(planMatch[1].trim());
      if (!Array.isArray(plan.nodes)) plan.nodes = [];
    } catch (e) {
      console.warn('[Planner] plan JSON parse failed:', e.message);
    }
  }

  // ── DYNAMIC FALLBACK ONLY IF JSON PARSING COMPLETELY FAILED ──
  if (plan.nodes.length === 0) {
    const isCodeOrWrite = needsCode || intentLabel === 'WRITING' || intentLabel === 'CODE_GENERATION' || intentLabel === 'DEBUGGING';
    const roleType = (intentLabel === 'WRITING' || lang === 'markdown' || lang === 'text') ? 'write' : 'code';
    const targetLang = (intentLabel === 'WRITING' || lang === 'markdown') ? 'markdown' : (lang || 'html');

    if (isCodeOrWrite) {
      plan.nodes = [
        { id: 'node_1', title: 'Analyze Task Requirements', role: 'analyze', goal: 'Determine architecture and structure', target: 'chat' },
        { id: 'node_2', title: analysis.artifactTitle || 'Build Solution', role: roleType, goal: `Generate complete implementation for: ${userPrompt.slice(0, 80)}`, language: targetLang, target: 'canvas' }
      ];
    } else {
      plan.nodes = [
        { id: 'node_1', title: 'Detailed Analysis', role: 'analyze', goal: `Provide thorough response for: ${userPrompt.slice(0, 80)}`, target: 'chat' }
      ];
    }
  }

  const cleanThinking = rawThinking.replace(/<plan>[\s\S]*/i, '').replace(/```[\s\S]*$/i, '').trim();
  traceSteps[thinkingIdx].content = cleanThinking;
  traceSteps[thinkingIdx].plan = plan;
  traceSteps[thinkingIdx].isStreaming = false;
  if (onStepUpdate) onStepUpdate([...traceSteps]);

  return { thinkingText: cleanThinking, plan };
}

/**
 * Execute Step via Capability Router & Executor Pool
 */
async function executeStep(stepParams) {
  const result = await resolveAndExecuteStep(stepParams);
  return result.output;
}

export async function generateDynamicAgentPipeline({
  userPrompt,
  model = DEFAULT_MODEL,
  onStepUpdate,
  onChunk,
  onError,
  messagesHistory = []
}) {
  const pastContext = messagesHistory.slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.role === 'user'
      ? m.content
      : (m.traceData?.steps?.find(s => s.type === 'response')?.content || m.content || 'Responded')
  }));

  const analysis = await analyzeQueryIntent({ prompt: userPrompt, model, messagesHistory });
  const activeSkill = getOrGenerateSkillPersona({
    prompt: userPrompt,
    skillId: analysis.skillId,
    dynamicPersona: analysis.dynamicPersona
  });

  if (['GREETING', 'CONVERSATIONAL', 'CLARIFICATION_NEEDED'].includes(analysis.intentCategory) || analysis.thinkingDepth === 'none') {
    const steps = [{ type: 'response', content: '' }];
    if (onStepUpdate) onStepUpdate(steps, true);

    const isClarification = analysis.intentCategory === 'CLARIFICATION_NEEDED';

    await streamGroqChat({
      messages: [
        {
          role: 'system',
          content: isClarification
            ? `You are Devnexes AI. Ask 2 brief questions to clarify what to build. CRITICAL: Match the user's input language EXACTLY (e.g., Roman Urdu, English, Urdu).`
            : `${activeSkill.systemPrompt}\n\nCRITICAL LANGUAGE RULE: Detect and MATCH the user's input language EXACTLY (e.g., if user wrote in Roman Urdu, reply in Roman Urdu; if English, reply in English; if Urdu script, reply in Urdu script). Respond directly, clearly, and concisely.`
        },
        ...pastContext,
        { role: 'user', content: userPrompt }
      ],
      model,
      onChunk: (delta, fullText) => {
        steps[0].content = fullText;
        if (onStepUpdate) onStepUpdate([...steps], true);
        if (onChunk) onChunk(delta, fullText);
      },
      onError
    });
    return;
  }

  const traceSteps = [];
  const executionModel = model;

  traceSteps.push({ 
    type: 'skill', 
    skillName: activeSkill.id, 
    skillLabel: activeSkill.name,
    skillData: activeSkill 
  });
  if (onStepUpdate) onStepUpdate([...traceSteps]);

  let thinkingText = '';
  let executionNodes = [];

  if (analysis.thinkingDepth !== 'none') {
    // Real planner — generates dynamic node plan
    const thinkingResult = await runThinkingStep({
      userPrompt, analysis, activeSkill, pastContext, model: executionModel, traceSteps, onStepUpdate
    });
    thinkingText = thinkingResult.thinkingText;
    executionNodes = thinkingResult.plan?.nodes || [];
  } else if (analysis.needsCodeArtifact) {
    // thinkingDepth === 'none' but code is needed — single direct code node
    executionNodes = [{
      id: 'node_1',
      title: analysis.artifactTitle || 'Build Solution',
      role: 'code',
      goal: `Generate complete ${analysis.artifactLanguage || 'code'} implementation for: ${userPrompt.slice(0, 80)}`,
      language: analysis.artifactLanguage || 'html'
    }];
  }
  // If no nodes planned (simple/general query) → skip to direct final response

  const previousOutputs = [];
  let hasCode = false;

  for (const node of executionNodes) {
    const nodeIdx = traceSteps.length;
    const output = await executeStep({
      step: node,
      userPrompt, analysis, activeSkill, pastContext,
      thinkingText, previousOutputs, model: executionModel, traceSteps, nodeIdx, onStepUpdate
    });
    previousOutputs.push({ title: node.title || node.goal, output: output || '' });

    // Track if canvas artifact was produced
    if (node.target === 'canvas' || node.role === 'code' || node.role === 'write' || traceSteps.some(s => s.type === 'artifact')) {
      hasCode = true;
    }
  }

  const respIdx = traceSteps.length;
  traceSteps.push({ type: 'response', content: '' });
  if (onStepUpdate) onStepUpdate([...traceSteps]);

  const silentContext = previousOutputs
    .map(o => o.output)
    .join('\n\n');

  const finalSystem = hasCode
    ? `You are Devnexes AI.\n\nCRITICAL LANGUAGE RULE: Detect and MATCH the user's input language EXACTLY (e.g. Roman Urdu -> Roman Urdu, English -> English, Urdu -> Urdu script).\n\nThe requested code/document artifact HAS ALREADY BEEN GENERATED and is displayed in the side panel canvas.\n\nSTRICT RULES FOR CHAT RESPONSE:\n- Output ONLY 1 to 2 short sentences in the EXACT language used by the user.\n- Tell the user what was created and that the complete code/document is open in the side panel canvas.\n- STRICTLY DO NOT output any code, code blocks (\`\`\`), programming tutorials, or duplicate code in this chat message.`
    : `${activeSkill.systemPrompt}\n\nCRITICAL LANGUAGE RULE: Detect and MATCH the user's input language EXACTLY (e.g., Roman Urdu -> Roman Urdu, English -> English, Urdu -> Urdu script). Respond ONLY in that language.\n\nInformation gathered from analysis:\n---\n${silentContext}\n---\n\nRespond DIRECTLY and ONLY to user's exact request: "${userPrompt}". Be thorough and clear. Never mention internal pipeline steps.`;

  await streamGroqChat({
    messages: [
      { role: 'system', content: finalSystem },
      ...pastContext,
      { role: 'user', content: userPrompt }
    ],
    model: executionModel,
    onChunk: (delta, fullText) => {
      traceSteps[respIdx].content = fullText;
      if (onStepUpdate) onStepUpdate([...traceSteps]);
      if (onChunk) onChunk(delta, fullText);
    },
    onError
  });

  return { hasCode };
}

/**
 * Generate a dynamic chat title using LLM
 */
export async function generateConversationTitle({ userPrompt }) {
  try {
    const { endpoint, headers } = getLLMConfig(FAST_MODEL);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: FAST_MODEL,
        messages: [
          { role: 'system', content: 'Generate a short 3 to 5 word topic title for this user message. Return ONLY title text.' },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 15
      })
    });
    if (res.ok) {
      const data = await res.json();
      const title = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
      if (title) return title;
    }
  } catch (_) {}
  return userPrompt.slice(0, 30);
}
