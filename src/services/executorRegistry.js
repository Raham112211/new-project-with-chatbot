/**
 * Devnexes AI — Enterprise Capability Registry & Executor Pool
 * Decoupled Executor Architecture: Capability Scoring, Tool-Unaware Router & Metadata-Driven Bus.
 */

import { getTavilyApiKey, getLLMConfig, FAST_MODEL, CODE_MODEL } from './groqService.js';

/**
 * 1. Web Search Executor
 */
export const WebSearchExecutor = {
  name: 'Web Search Engine',
  canHandle({ goal = '', requirements = [] }) {
    const text = (goal + ' ' + JSON.stringify(requirements)).toLowerCase();
    if (/internet|search|live|doc|current|news|score|fact|documentation|google/.test(text)) {
      return 0.95;
    }
    return 0.1;
  },
  async execute({ step, userPrompt, traceSteps, nodeIdx, onStepUpdate }) {
    // Use the planner's precise goal as search query, fallback to userPrompt
    const query = step.goal || step.title || userPrompt;
    
    traceSteps.push({
      type: 'tool_search',
      label: step.title,
      query: query,
      results: [],
      isSearching: true,
      execution: {
        executor: 'Web Search Engine',
        icon: 'globe',
        badge: 'Live Web Search',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-200'
      }
    });
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    const results = await realWebSearchScraper(query);
    traceSteps[nodeIdx].results = results;
    traceSteps[nodeIdx].isSearching = false;
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    const outputText = results.length > 0
      ? results.map(r => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join('\n\n')
      : 'No live web search results found.';

    return {
      output: outputText,
      metadata: {
        executor: 'Web Search Engine',
        icon: 'globe',
        badge: 'Live Web Search',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-200'
      }
    };
  }
};

/**
 * Live Web Search Scraper (Tavily + DuckDuckGo Instant Answer & HTML Scraper)
 */
async function realWebSearchScraper(query) {
  const tavilyKey = getTavilyApiKey();
  if (tavilyKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, query, search_depth: 'basic', max_results: 5 }),
        signal: AbortSignal.timeout(9000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) {
          return data.results.map(r => ({
            title: r.title,
            snippet: (r.content || '').slice(0, 240),
            url: r.url,
            domain: (() => { try { return new URL(r.url).hostname.replace('www.', ''); } catch { return r.url; } })()
          }));
        }
      }
    } catch (e) {
      console.warn('[Search] Tavily error:', e.message);
    }
  }

  // 1. DuckDuckGo Instant Answer API Fallback
  try {
    const apiRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
      signal: AbortSignal.timeout(5000)
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      const results = [];
      if (data.AbstractText && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText.slice(0, 250),
          url: data.AbstractURL,
          domain: (() => { try { return new URL(data.AbstractURL).hostname.replace('www.', ''); } catch { return 'duckduckgo.com'; } })()
        });
      }
      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (topic.Text && topic.FirstURL && results.length < 5) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Search Result',
              snippet: topic.Text.slice(0, 240),
              url: topic.FirstURL,
              domain: (() => { try { return new URL(topic.FirstURL).hostname.replace('www.', ''); } catch { return 'duckduckgo.com'; } })()
            });
          }
        }
      }
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.warn('[Search] DDG API fallback failed:', e.message);
  }

  // 2. DuckDuckGo Live HTML Scraper Fallback
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const html = await res.text();
      const results = [];
      const linkRegex = /<a\s+class="result__a"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null && results.length < 5) {
        let rawUrl = match[1];
        if (rawUrl.includes('uddg=')) {
          const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
          if (uddgMatch) rawUrl = decodeURIComponent(uddgMatch[1]);
        }
        const cleanTitle = match[2].replace(/<[^>]*>/g, '').trim();
        if (cleanTitle && rawUrl.startsWith('http')) {
          results.push({
            title: cleanTitle,
            snippet: `Search result snippet for ${cleanTitle}`,
            url: rawUrl,
            domain: (() => { try { return new URL(rawUrl).hostname.replace('www.', ''); } catch { return 'duckduckgo.com'; } })()
          });
        }
      }
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.warn('[Search] DuckDuckGo live search HTML error:', e.message);
  }
  return [];
}

/**
 * 2. Code Artifact Canvas Executor
 */
export const CodeArtifactExecutor = {
  name: 'Document & Code Canvas Builder',
  canHandle(step = {}) {
    const { role = '', target = '', goal = '', requirements = [] } = step;
    if (role === 'code' || role === 'write' || target === 'canvas') return 0.99;
    const text = (goal + ' ' + JSON.stringify(requirements)).toLowerCase();
    if (/code|artifact|build|implement|component|script|html|css|python|javascript|program|software|write|draft|email|application|letter|document/.test(text)) {
      return 0.98;
    }
    return 0.05;
  },
  async execute({ step, userPrompt, analysis, activeSkill, pastContext, thinkingText, previousOutputs, model, traceSteps, nodeIdx, onStepUpdate }) {
    const lang = step.language || analysis.artifactLanguage || 'markdown';
    const isDoc = lang === 'markdown' || lang === 'text' || step.role === 'write' || step.role === 'draft';

    traceSteps.push({
      type: 'artifact',
      label: step.title,
      title: step.title || analysis.artifactTitle || (isDoc ? 'Formal Document' : 'Code Artifact'),
      language: lang,
      code: '',
      isStreaming: true,
      isDone: false,
      execution: {
        executor: 'Document & Code Canvas Builder',
        icon: isDoc ? 'file-text' : 'code',
        badge: isDoc ? 'Document Canvas' : 'Code Canvas',
        color: 'text-[#0066FF]',
        bg: 'bg-blue-50 border-blue-200'
      }
    });
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    const accumulatedContext = previousOutputs.length > 0
      ? '\n\nPrevious analysis:\n' + previousOutputs.map((o, i) => `[Step ${i + 1} — ${o.title}]:\n${o.output}`).join('\n\n')
      : '';

    const langInstructions = isDoc
      ? 'Write a complete, formal document. Fill in realistic contextual details cleanly. Do NOT leave raw placeholders. DO NOT ask the user questions. Output clean markdown text.'
      : lang === 'html'
      ? 'CRITICAL RULE: DO NOT ask clarifying questions. Even if the request is vague (e.g. "create ecommerce site"), DO NOT ask for details. Immediately generate a stunning, fully functional generic layout. Output a SINGLE complete HTML file with embedded <style> CSS and <script> JS. STRICTLY NO text outside the code block.'
      : lang === 'cpp'
      ? 'CRITICAL RULE: DO NOT ask questions. Immediately generate ONLY 100% complete, compilable C++ code inside ```cpp ... ```. Strictly obey constraints. STRICTLY NO markdown explanations or text outside code block.'
      : lang === 'python'
      ? 'CRITICAL RULE: DO NOT ask questions. Immediately generate ONLY runnable Python code inside ```python ... ```. Include all imports. STRICTLY NO text outside code block.'
      : 'CRITICAL RULE: DO NOT ask questions. Output ONLY complete production-grade code inside ```' + lang + ' ... ```. STRICTLY NO commentary or text outside the code block.';

    let fullCode = '';
    const { endpoint, headers } = getLLMConfig(model || CODE_MODEL);
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || CODE_MODEL,
        messages: [
          {
            role: 'system',
            content: `${activeSkill.systemPrompt}\n\nTask Goal: ${step.goal}\nTarget Language: ${lang}\nUser request: "${userPrompt}"${accumulatedContext}\n\n${langInstructions}`
          },
          ...pastContext,
          ...(thinkingText ? [{ role: 'assistant', content: `My analysis and plan: ${thinkingText}` }] : []),
          { 
            role: 'user', 
            content: `${userPrompt}\n\n[CRITICAL SYSTEM DIRECTIVE]: You are writing a Code Artifact. ${langInstructions} DO NOT say "Here is the code" or "I understand". Start immediately with the code.` 
          }
        ],
        temperature: 0.2,
        stream: true
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
            fullCode += delta;
            traceSteps[nodeIdx].code = fullCode;
            traceSteps[nodeIdx].isStreaming = true;
            if (onStepUpdate) onStepUpdate([...traceSteps]);
          }
        } catch (_) {}
      }
    }

    traceSteps[nodeIdx].isStreaming = false;
    traceSteps[nodeIdx].isDone = true;
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    return {
      output: fullCode,
      metadata: {
        executor: 'Document & Code Canvas Builder',
        icon: isDoc ? 'file-text' : 'code',
        badge: isDoc ? 'Document Canvas' : 'Code Canvas',
        color: 'text-[#0066FF]',
        bg: 'bg-blue-50 border-blue-200'
      }
    };
  }
};

/**
 * 3. LLM Reasoning & Analysis Executor
 */
export const LLMReasoningExecutor = {
  name: 'Reasoning Engine',
  canHandle() {
    return 0.50; // Fallback default score for any general reasoning / analysis goal
  },
  async execute({ step, userPrompt, activeSkill, pastContext, thinkingText, previousOutputs, model, traceSteps, nodeIdx, onStepUpdate }) {
    traceSteps.push({
      type: 'action',
      label: step.title,
      detail: step.goal,
      content: '',
      isStreaming: true,
      isDone: false,
      execution: {
        executor: 'Reasoning Engine',
        icon: 'brain',
        badge: 'Analysis & Reasoning',
        color: 'text-purple-600',
        bg: 'bg-purple-50 border-purple-200'
      }
    });
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    const accumulatedContext = previousOutputs.length > 0
      ? '\n\nPrevious steps output:\n' + previousOutputs.map((o, i) => `[Step ${i + 1} — ${o.title}]:\n${o.output}`).join('\n\n')
      : '';

    let fullOutput = '';
    const { endpoint, headers } = getLLMConfig(model || FAST_MODEL);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || FAST_MODEL,
        messages: [
          {
            role: 'system',
            content: `${activeSkill.systemPrompt}\n\nTask Goal: ${step.goal}\nUser request: "${userPrompt}"${accumulatedContext}\n\nProvide direct, comprehensive analysis for this goal.`
          },
          ...pastContext,
          ...(thinkingText ? [{ role: 'assistant', content: `My analysis: ${thinkingText}` }] : []),
          { 
            role: 'user', 
            content: `${userPrompt}\n\n[CRITICAL SYSTEM DIRECTIVE]: This is an ANALYSIS step only. You MUST NOT write the final code, HTML, or solution yet. Output ONLY textual analysis, reasoning, or architecture planning. STRICTLY DO NOT output any code blocks (\`\`\`).` 
          }
        ],
        temperature: 0.3,
        stream: true
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
            fullOutput += delta;
            traceSteps[nodeIdx].content = fullOutput;
            traceSteps[nodeIdx].isStreaming = true;
            if (onStepUpdate) onStepUpdate([...traceSteps]);
          }
        } catch (_) {}
      }
    }

    traceSteps[nodeIdx].isStreaming = false;
    traceSteps[nodeIdx].isDone = true;
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    return {
      output: fullOutput,
      metadata: {
        executor: 'Reasoning Engine',
        icon: 'brain',
        badge: 'Analysis & Reasoning',
        color: 'text-purple-600',
        bg: 'bg-purple-50 border-purple-200'
      }
    };
  }
};

/**
 * 4. Role-Based Capability Router
 * Dispatches executor based on node's explicit role from the planner.
 * No scoring guesswork — the planner decided the role, we execute it.
 */
export const ExecutorPool = [
  WebSearchExecutor,
  CodeArtifactExecutor,
  LLMReasoningExecutor
];

export async function resolveAndExecuteStep(stepParams) {
  const { step } = stepParams;
  const role = (step.role || '').toLowerCase().trim();

  // Dynamic role dispatch — pattern matching, not rigid string equality
  // Any role containing 'search' or 'browse' → Web Search
  if (/search|browse|lookup|find online|web/.test(role)) {
    return await WebSearchExecutor.execute(stepParams);
  }

  // Any role containing 'code', 'build', 'implement', 'generate', 'create', 'develop', 'write', 'draft', 'document' → Code & Document Artifact Canvas
  if (/\bcode\b|build|implement|generate|develop|program|script|artifact|write|draft|document|letter|email/.test(role)) {
    return await CodeArtifactExecutor.execute(stepParams);
  }

  // Everything else (analyze, synthesize, plan, review, test, reason, explain, validate) → LLM Reasoning Executor
  return await LLMReasoningExecutor.execute(stepParams);
}
