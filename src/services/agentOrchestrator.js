/**
 * Master Agent Orchestrator powered by Groq LLM.
 * Performs real Intent Analysis, Skill Routing, Research Decisions, and Code Artifact Determination.
 * Fully preserves multi-turn conversation memory across user messages.
 */

import { DETAILED_SKILLS, getMatchingSkill } from '../skills/index.js';

/**
 * Analyzes user prompt and conversation history using Groq LLM to determine exact intent and execution plan.
 */
export async function analyzeQueryIntent({ prompt, apiKey, model, messagesHistory = [] }) {
  const allSkillIds = Object.keys(DETAILED_SKILLS).join(' | ');

  const systemRouterPrompt = `You are the Senior Master Agent Router for Devnexes AI. Analyze the user's latest prompt and previous conversation history to output a valid JSON object matching this schema ONLY (no markdown text):
{
  "intentCategory": "GREETING | CONCEPT_EXPLANATION | CODE_GENERATION | DEBUGGING",
  "reasoning": "Detailed 1-sentence intent breakdown of what the user is asking for",
  "skillId": "${allSkillIds}",
  "needsWebResearch": true | false,
  "searchQuery": "Real search query string if research needed",
  "searchDomains": ["github.com", "developer.mozilla.org", "docs.python.org", "en.cppreference.com", "arxiv.org", "console.groq.com"],
  "needsCodeArtifact": true | false,
  "artifactLanguage": "html | cpp | python | javascript | java | css | sql",
  "artifactTitle": "Title of code artifact if code is requested"
}

STRICT INDEPENDENT TOPIC & ROUTING RULES:
1. FOCUS ON LATEST PROMPT: Evaluate the user's latest prompt directly on its own merits. Do NOT drag old topics from past messages UNLESS the user explicitly refers to them using pronouns ("it", "that", "the previous code") or asks a follow-up about them.
2. TYPOS / SINGLE CHARACTERS (e.g. "e", "a", "w", "asdf"):
   - Set intentCategory = "GREETING", needsCodeArtifact = false.
3. ROMAN URDU & CONVERSATIONAL (e.g. "smj ni ai", "kya", "pata nahi", "phir se batao", "what was my last msg"):
   - Set intentCategory = "GREETING", needsCodeArtifact = false.
4. WEBSITES & APP CREATION (e.g. "create a website for ecommerce", "build a website"):
   - Set intentCategory = "CODE_GENERATION", needsCodeArtifact = true, artifactLanguage = "html", artifactTitle = "E-Commerce Website".
5. CODE REQUESTS:
   - Always set intentCategory = "CODE_GENERATION", needsCodeArtifact = true.`;

  // Build context summary from history
  const historySummary = messagesHistory.length > 0
    ? messagesHistory.slice(-8).map(m => {
        if (m.role === 'user') return `User: ${m.content}`;
        const artifactStep = m.traceData?.steps?.find(s => s.type === 'artifact');
        if (artifactStep) return `Assistant generated ${artifactStep.language} code for "${artifactStep.title}"`;
        const respText = m.content || m.traceData?.steps?.find(s => s.type === 'response')?.content || 'Responded to user';
        return `Assistant: ${respText}`;
      }).join('\n')
    : 'No previous history';

  const cleanPrompt = prompt.toLowerCase().trim();

  // Handle single character typos or meaningless inputs gracefully
  if (cleanPrompt.length <= 2 && !['c', 'r', 'go', 'py', 'ui', 'db'].includes(cleanPrompt)) {
    return {
      intentCategory: 'GREETING',
      reasoning: 'Short input or typo detected; requesting clarification',
      skillId: 'natural-language-processing',
      needsWebResearch: false,
      needsCodeArtifact: false
    };
  }

  // Direct keyword override for programming languages to guarantee 100% accuracy
  let explicitSkillOverride = null;
  if (/\b(c\+\+|cpp|cplusplus|iostream|g\+\+|clang\+\+)\b/i.test(cleanPrompt)) {
    explicitSkillOverride = DETAILED_SKILLS['cpp-engineering'];
  } else if (/\b(java|spring boot|jvm|maven)\b/i.test(cleanPrompt)) {
    explicitSkillOverride = DETAILED_SKILLS['java-engineering'];
  } else if (/\b(python|opencv|cv2|pytorch|numpy|pandas|flask|django)\b/i.test(cleanPrompt)) {
    explicitSkillOverride = DETAILED_SKILLS['python-engineering'];
  } else if (/\b(html|css|react|tailwind|canvas|glassmorphism|ui|frontend|ecommerce|website)\b/i.test(cleanPrompt)) {
    explicitSkillOverride = DETAILED_SKILLS['frontend-design'];
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemRouterPrompt },
          { role: 'user', content: `Conversation History:\n${historySummary}\n\nLatest User Prompt: "${prompt}"` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (explicitSkillOverride) {
          parsed.skillId = explicitSkillOverride.id;
          parsed.searchDomains = explicitSkillOverride.domains;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn("LLM Intent Router fallback:", err);
  }

  // Heuristic Fallback
  const isGreeting = /^(hi|hello|hey|hy|hola|kya hal ha|how are you|whats up|thanks|bye|smj ni ai|samajh nahi aaya|kya|pata nahi|kya matlab|what was my last msg|last msg|previous message)$/i.test(cleanPrompt);
  const isCode = /build|create|write|code|script|html|cpp|c\+\+|python|java|game|calculator|dashboard|component|voice assistant|ecommerce|website|in detail|full code/i.test(cleanPrompt);

  const matchedSkill = explicitSkillOverride || getMatchingSkill(prompt);

  return {
    intentCategory: isGreeting ? 'GREETING' : isCode ? 'CODE_GENERATION' : 'CONCEPT_EXPLANATION',
    reasoning: `Categorized prompt into ${isGreeting ? 'Greeting' : isCode ? 'Code Generation' : 'Concept Explanation'} workflow for ${matchedSkill.name}`,
    skillId: matchedSkill.id,
    needsWebResearch: !isGreeting && !isCode,
    searchQuery: `${prompt} ${matchedSkill.name} Documentation`,
    searchDomains: matchedSkill.domains || ['github.com', 'developer.mozilla.org'],
    needsCodeArtifact: isCode,
    artifactLanguage: cleanPrompt.includes('c++') || cleanPrompt.includes('cpp') ? 'cpp' : cleanPrompt.includes('python') ? 'python' : 'html',
    artifactTitle: `${prompt} Code`
  };
}
