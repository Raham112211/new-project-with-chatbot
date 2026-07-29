/**
 * Devnexes AI — Master Intelligence Router
 * Fully Dynamic LLM-driven intent & persona analyzer (Powered 100% by Local Ollama Engine)
 */

import { DETAILED_SKILLS } from '../skills/index.js';
import { getLLMConfig, FAST_MODEL } from './groqService.js';

export async function analyzeQueryIntent({ prompt, model = FAST_MODEL, messagesHistory = [] }) {
  const allSkillIds = Object.keys(DETAILED_SKILLS).join(' | ') + ' | dynamic';

  const systemRouterPrompt = `You are the Master Intelligence Router for Devnexes AI.

Analyze the user's FULL message. Determine their true intent, required expertise, and pipeline needs dynamically.
The user may write in English, Roman Urdu, Urdu, code, or mixed languages.

Output ONLY valid JSON — no extra text, no markdown wrappers:
{
  "intentCategory": "GREETING | CONVERSATIONAL | CONCEPT_EXPLANATION | CODE_GENERATION | DEBUGGING | RESEARCH | WRITING | CLARIFICATION_NEEDED",
  "reasoning": "One concise sentence: what the user wants to achieve",
  "skillId": "${allSkillIds}",
  "dynamicPersona": {
    "name": "Specific Expert Title (e.g., Quantum Computing Specialist, Rust Systems Engineer, Financial Data Analyst)",
    "description": "Short domain expertise description",
    "systemPrompt": "System instructions tailored specifically for handling this exact request"
  },
  "thinkingDepth": "none | brief | deep",
  "needsSearch": true | false,
  "searchQuery": "Clean search query extracted from user request, or null",
  "needsCodeArtifact": true | false,
  "artifactLanguage": "Extract exact programming language requested by user (e.g., 'cpp', 'python', 'html', 'javascript'). If generating a document/letter, use 'text'. If unknown, infer from context.",
  "artifactTitle": "Create a highly specific 3-5 word title based exactly on the user's current request",
  "complexity": "simple | moderate | complex"
}

ROUTING & THINKING RULES:
1. GREETING: Only pure, simple greetings without any task (e.g. "hi", "hello", "assalam o alaikum").
2. CONVERSATIONAL: Pure chat, general chit-chat, or "who are you".
3. CONCEPT_EXPLANATION: General questions, concepts, theory, learning. Set thinkingDepth: "none" unless very complex.
4. CODE_GENERATION: User explicitly asks to write code, implement software, or create UI. Set needsCodeArtifact: true.
5. DEBUGGING: User provides broken code, stack traces, or error messages. Set needsCodeArtifact: true.
6. RESEARCH: Real-time search, live data, latest facts. Set needsSearch: true, thinkingDepth: "brief".
7. WRITING: User requests letter, email, document, application, essay. Set thinkingDepth: "none", artifactLanguage: "markdown". NEVER output HTML for letters/documents unless user explicitly asks for HTML.

CRITICAL RULE FOR SIMPLE/GENERAL QUERIES:
- If a query is simple, conceptual, conversational, or general knowledge — set thinkingDepth: "none" and complexity: "simple". Do NOT generate deep multi-step breakdown for simple questions.

DYNAMIC PERSONA RULES:
- If standard skillId fits best, select it.
- If request requires specialized knowledge, select "skillId": "dynamic" and populate "dynamicPersona" with custom instructions tailored specifically for that domain.`;

  const historySummary = messagesHistory.length > 0
    ? messagesHistory.slice(-4).map(m => {
        if (m.role === 'user') return `User: ${m.content?.slice(0, 150)}`;
        const art = m.traceData?.steps?.find(s => s.type === 'artifact');
        if (art) return `AI: Generated ${art.language} — "${art.title}"`;
        const resp = m.content || m.traceData?.steps?.find(s => s.type === 'response')?.content || '';
        return resp ? `AI: ${resp.slice(0, 100)}` : '';
      }).filter(Boolean).join('\n')
    : null;

  try {
    const { endpoint, headers } = getLLMConfig(model || FAST_MODEL);
    
    let json = null;
    let res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || FAST_MODEL,
        messages: [
          { role: 'system', content: systemRouterPrompt },
          {
            role: 'user',
            content: historySummary
              ? `Prior conversation:\n${historySummary}\n\nUser's latest message:\n"${prompt}"`
              : `User's message:\n"${prompt}"`
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 450
      }),
    });

    if (!res.ok) {
      // Retry without response_format for models that don't support JSON mode
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model || FAST_MODEL,
          messages: [
            { role: 'system', content: systemRouterPrompt },
            {
              role: 'user',
              content: historySummary
                ? `Prior conversation:\n${historySummary}\n\nUser's latest message:\n"${prompt}"`
                : `User's message:\n"${prompt}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 450
        }),
      });
    }

    if (!res.ok) throw new Error(`Router HTTP ${res.status}`);
    json = await res.json();
    const rawContent = json.choices?.[0]?.message?.content || '{}';
    const cleanJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const category = parsed.intentCategory || 'CONCEPT_EXPLANATION';

    // DIAGRAM & FLOWCHART FORCE ROUTER: Automatically route diagram requests to Mermaid Artifact
    if (/diagram|flowchart|flow\s*chart|flow-chart|mindmap|mind\s*map|architecture|sequence\s*diagram|er\s*diagram|class\s*diagram/i.test(prompt)) {
      parsed.intentCategory = 'CODE_GENERATION';
      parsed.needsCodeArtifact = true;
      parsed.artifactLanguage = 'mermaid';
      if (!parsed.artifactTitle || parsed.artifactTitle === 'Untitled') {
        parsed.artifactTitle = 'Visual Diagram';
      }
    } else if (['GREETING', 'CONVERSATIONAL', 'CLARIFICATION_NEEDED'].includes(category)) {
      // STRICT FALLBACK: Prevent false artifact generation for chats/greetings
      parsed.needsCodeArtifact = false;
    }

    const isWritingOrCode = category === 'WRITING' || category === 'CODE_GENERATION' || category === 'DEBUGGING' || !!parsed.needsCodeArtifact;

    // Search is ONLY enabled if LLM determines search is needed AND it is NOT a creative writing/coding request
    const wantsSearch = !!parsed.needsSearch && category === 'RESEARCH';

    return {
      intentCategory: category,
      reasoning: parsed.reasoning || 'Processing user request dynamically',
      skillId: parsed.skillId || 'dynamic',
      dynamicPersona: parsed.dynamicPersona || null,
      thinkingDepth: parsed.thinkingDepth || 'brief',
      needsSearch: wantsSearch,
      searchQuery: wantsSearch ? (parsed.searchQuery || prompt.slice(0, 60)) : null,
      needsCodeArtifact: isWritingOrCode,
      artifactLanguage: parsed.artifactLanguage || (category === 'WRITING' ? 'markdown' : 'html'),
      artifactTitle: parsed.artifactTitle || prompt.slice(0, 40),
      complexity: parsed.complexity || 'moderate'
    };

  } catch (err) {
    console.warn('[Router] Dynamic intent router fallback:', err);
    const hasCode = /```|#include|def |class |function |import |<html/i.test(prompt);

    return {
      intentCategory: hasCode ? 'DEBUGGING' : 'CONCEPT_EXPLANATION',
      reasoning: `Processing query: "${prompt.slice(0, 60)}"`,
      skillId: 'dynamic',
      dynamicPersona: {
        name: 'Devnexes AI Specialist',
        description: 'Adaptive dynamic specialist',
        systemPrompt: 'You are Devnexes AI, an expert problem solver. Provide direct, comprehensive, and helpful responses.'
      },
      thinkingDepth: 'brief',
      needsSearch: false,
      searchQuery: null,
      needsCodeArtifact: hasCode,
      artifactLanguage: hasCode ? 'code' : 'markdown',
      artifactTitle: prompt.slice(0, 40),
      complexity: 'moderate',
    };
  }
}
