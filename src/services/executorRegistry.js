/**
 * Devnexes AI — Enterprise Capability Registry & Executor Pool
 * Decoupled Executor Architecture: 100% Dynamic Capability Scoring, Tool-Unaware Router & Metadata-Driven Bus.
 */

import { getTavilyApiKey, getLLMConfig, FAST_MODEL, CODE_MODEL, streamGroqChat } from './groqService.js';

/**
 * 1. Web Search Executor
 */
export const WebSearchExecutor = {
  name: 'Web Search Engine',
  canHandle(step = {}) {
    const { role = '', tool = '', needsSearch = false } = step;
    if (tool === 'webSearch' || role === 'search' || needsSearch) {
      return 0.99;
    }
    return 0.1;
  },
  async execute({ step, userPrompt, traceSteps, nodeIdx, onStepUpdate }) {
    // Use the planner's precise goal as search query, fallback to userPrompt
    const query = step.goal || step.title || userPrompt;
    
    traceSteps.push({
      type: 'tool_search',
      label: step.title || 'Live Web Search',
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

  // DuckDuckGo Instant Answer API Fallback
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
          snippet: data.AbstractText.slice(0, 240),
          url: data.AbstractURL,
          domain: 'duckduckgo.com'
        });
      }
      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 4)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.slice(0, 60) + '...',
              snippet: topic.Text.slice(0, 200),
              url: topic.FirstURL,
              domain: 'duckduckgo.com'
            });
          }
        }
      }
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.warn('[Search] DuckDuckGo API error:', e.message);
  }

  // HTML Scraper Fallback
  try {
    const htmlRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(6000)
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const results = [];
      const linkRegex = /<a class="result__url" href="([^"]+)">([^<]+)<\/a>/g;
      let match;
      while ((match = linkRegex.exec(html)) !== null && results.length < 4) {
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
 * 100% Pure Dynamic Artifact Prompt Synthesizer
 * Synthesizes execution directives for ANY query, programming language, diagram type, or document format dynamically from step metadata.
 */
function getDynamicArtifactInstructions(step = {}, userPrompt = '') {
  const lang = (step.language || 'text').toLowerCase();
  const goal = step.goal || step.title || userPrompt;
  const isCanvas = step.target === 'canvas' || step.tool === 'codeArtifact' || step.role === 'code' || step.role === 'write';

  if (lang === 'mermaid') {
    return `CRITICAL EXECUTION DIRECTIVE FOR MERMAID DIAGRAMS & FLOWCHARTS:
- Task Goal: ${goal}
- Format: Standalone Visual Mermaid Diagram (\`\`\`mermaid ... \`\`\`)

DESIGN & SYNTAX DIRECTIVES FOR PREMIUM VISUAL FLOWCHARTS:
1. Use appropriate node shapes:
   - Start / End: Rounded Ovals \`([Start])\` or \`([End])\`
   - Process / Action / Init: Rounded Rectangles \`[Initialization<br/>counter = 0]\`
   - Decision / Condition: Diamond Shapes \`{Condition Check?}\`
2. Labeled Decision Arrows: Use clear conditional arrows \`-- Yes -->\` and \`-- No -->\` (or \`-->|True|\`, \`-->|False|\`).
3. Sub-Text Details: Include contextual sub-text inside nodes using \`<br/>\` (e.g. \`[Do (execute block)<br/>print, increment]\`).
4. Color Palette Styling: Include \`classDef\` color rules to give nodes distinct colors (e.g., Blue for Init, Green for Process, Orange/Yellow for Decisions).
5. Output ONLY the \`\`\`mermaid ... \`\`\` code block without any conversational commentary outside the code block.`;
  }

  return `CRITICAL EXECUTION DIRECTIVE:
- Task Goal: ${goal}
- Target Output Format: ${lang.toUpperCase()}
- Execution Mode: ${isCanvas ? 'Standalone Canvas Artifact' : 'Inline Response'}

INSTRUCTIONS:
1. Immediately generate ONLY 100% complete, runnable, production-grade output formatted inside a \`\`\`${lang} ... \`\`\` code block (or clean Markdown text if document).
2. Ensure all syntax, logic, imports, structure, and connections are 100% valid and complete.
3. STRICT DIRECTIVES: DO NOT ask clarifying questions, DO NOT leave TODO or raw placeholders, and DO NOT output conversational text or commentary outside the code block.`;
}

/**
 * 2. Code Artifact Canvas Executor
 */
export const CodeArtifactExecutor = {
  name: 'Document & Code Canvas Builder',
  canHandle(step = {}) {
    const { role = '', target = '', tool = '', language = '' } = step;
    if (target === 'canvas' || tool === 'codeArtifact' || role === 'code' || role === 'write' || role === 'draft' || !!language) {
      return 0.99;
    }
    return 0.1;
  },
  async execute({ step, userPrompt, activeSkill, pastContext, thinkingText, previousOutputs, model, traceSteps, nodeIdx, onStepUpdate }) {
    const lang = step.language || 'markdown';
    const langTag = (lang || 'code').toUpperCase();
    const displayTitle = step.title || step.goal || 'Artifact Canvas';

    traceSteps.push({
      type: 'artifact',
      label: displayTitle,
      title: displayTitle,
      language: lang,
      code: '',
      isStreaming: true,
      isDone: false,
      execution: {
        executor: 'Dynamic Canvas Builder',
        icon: lang === 'markdown' || lang === 'text' ? 'file-text' : 'code',
        badge: `${langTag} Canvas`,
        color: 'text-[#0066FF]',
        bg: 'bg-blue-50 border-blue-200'
      }
    });
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    const accumulatedContext = previousOutputs.length > 0
      ? '\n\nPrevious analysis:\n' + previousOutputs.map((o, i) => `[Step ${i + 1} — ${o.title}]:\n${o.output}`).join('\n\n')
      : '';

    const langInstructions = getDynamicArtifactInstructions(step, userPrompt);

    let fullCode = '';

    await streamGroqChat({
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
          content: `${userPrompt}\n\n[CRITICAL SYSTEM DIRECTIVE]: You are generating a Canvas Artifact. ${langInstructions} Start immediately with the output.` 
        }
      ],
      maxTokens: 2048,
      onChunk: (delta, fullText) => {
        fullCode = fullText;
        traceSteps[nodeIdx].code = fullText;
        traceSteps[nodeIdx].isStreaming = true;
        if (onStepUpdate) onStepUpdate([...traceSteps]);
      }
    });

    traceSteps[nodeIdx].isStreaming = false;
    traceSteps[nodeIdx].isDone = true;
    if (onStepUpdate) onStepUpdate([...traceSteps]);

    return {
      output: fullCode,
      metadata: {
        executor: 'Dynamic Canvas Builder',
        icon: lang === 'markdown' || lang === 'text' ? 'file-text' : 'code',
        badge: `${langTag} Canvas`,
        color: 'text-[#0066FF]',
        bg: 'bg-blue-50 border-blue-200'
      }
    };
  }
};

/**
 * 3. Reasoning & Analysis Executor
 */
export const ReasoningExecutor = {
  name: 'Reasoning Engine',
  canHandle(step = {}) {
    return 0.5; // Universal dynamic baseline
  },
  async execute({ step, userPrompt, activeSkill, pastContext, thinkingText, previousOutputs, model, traceSteps, nodeIdx, onStepUpdate }) {
    traceSteps.push({
      type: 'thinking',
      label: step.title || 'Reasoning & Synthesis',
      content: '',
      isStreaming: true,
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
      ? '\n\nPrevious analysis:\n' + previousOutputs.map((o, i) => `[Step ${i + 1} — ${o.title}]:\n${o.output}`).join('\n\n')
      : '';

    let fullOutput = '';

    await streamGroqChat({
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
          content: `${userPrompt}\n\n[CRITICAL SYSTEM DIRECTIVE]: This is an ANALYSIS step. Output ONLY textual analysis, reasoning, or architecture planning. STRICTLY DO NOT output code blocks (\`\`\`).` 
        }
      ],
      maxTokens: 1500,
      onChunk: (delta, fullText) => {
        fullOutput = fullText;
        traceSteps[nodeIdx].content = fullText;
        traceSteps[nodeIdx].isStreaming = true;
        if (onStepUpdate) onStepUpdate([...traceSteps]);
      }
    });

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
 * 4. 100% Dynamic Capability Router
 */
export const ExecutorPool = [
  WebSearchExecutor,
  CodeArtifactExecutor,
  ReasoningExecutor
];

export async function resolveAndExecuteStep(params) {
  const { step } = params;
  
  let bestExecutor = ReasoningExecutor;
  let bestScore = 0;

  for (const exec of ExecutorPool) {
    const score = exec.canHandle(step);
    if (score > bestScore) {
      bestScore = score;
      bestExecutor = exec;
    }
  }

  return await bestExecutor.execute(params);
}
