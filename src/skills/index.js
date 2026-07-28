/**
 * Devnexes AI — Dynamic & Adaptive Skills Registry
 * Clean pattern-based skill matching. No garbage dynamic titles from raw code symbols.
 */

export const DETAILED_SKILLS = {
  'cpp-engineering': {
    id: 'cpp-engineering',
    name: 'C/C++ Systems & High-Performance Engineering',
    category: 'Systems Engineering',
    icon: 'cpu',
    description: 'C++17/20 development, OOP, memory management, STL containers, pointer arithmetic, algorithms and data structures.',
    systemPrompt: `You are Devnexes AI, a Principal C/C++ Systems Engineer.
- Write modern, ultra-clean, production-grade C++20 code using standard library features (<iostream>, <memory>, <vector>, <map>, <stdexcept>).
- Enforce explicit namespace scoping (std::), avoid 'using namespace std;', use smart pointers, RAII, const-correctness, and exception safety.
- Provide 100% complete, runnable, compiling C++ code.
- When fixing errors: explain the root cause first, then provide the corrected code.`,
    domains: ['en.cppreference.com', 'isocpp.org', 'github.com']
  },

  'frontend-design': {
    id: 'frontend-design',
    name: 'Frontend & UI/UX Architecture',
    category: 'Web Development',
    icon: 'layout',
    description: 'Modern web UI design, CSS glassmorphism, responsive layouts, HTML5, interactive JavaScript prototypes.',
    systemPrompt: `You are Devnexes AI, a World-Class Senior Frontend Architect & UI/UX Designer.
- Build EXACTLY what the user asks for — match their requested style, theme, content, and interactive features.
- Output a 100% complete, single-file HTML document with full embedded CSS and JavaScript.
- All buttons, tabs, modals, and charts must be functional with JavaScript.
- Use clean Google Fonts, modern typography, dynamic CSS variables, and vibrant responsive design.`,
    domains: ['developer.mozilla.org', 'react.dev', 'tailwindcss.com']
  },

  'python-engineering': {
    id: 'python-engineering',
    name: 'Python Systems & Data Science Engineering',
    category: 'Software Engineering',
    icon: 'terminal',
    description: 'Python 3.11+, OpenCV Computer Vision, PyTorch Neural Networks, NumPy vectorization, automation scripts, PEP8 standards.',
    systemPrompt: `You are Devnexes AI, a Principal Python Architect & Data Systems Engineer. 
- Write clean, PEP8 compliant, modular, production-grade Python 3.11+ code with explicit type annotations.
- Focus on performance, vectorization, robust error handling, and complete executable structure.`,
    domains: ['docs.python.org', 'pytorch.org', 'pypi.org']
  },

  'java-engineering': {
    id: 'java-engineering',
    name: 'Java & Enterprise Software Architecture',
    category: 'Software Engineering',
    icon: 'box',
    description: 'Java 17/21, Spring Boot, REST APIs, OOP principles, multi-threading, Maven, and Microservices.',
    systemPrompt: `You are Devnexes AI, a Senior Java Enterprise Architect.
- Write modern Java (Java 17/21) code following OOP principles, design patterns, records, sealed classes, and clean code conventions.
- Focus on robust enterprise architecture, exception handling, and clean method abstractions.`,
    domains: ['docs.oracle.com', 'spring.io', 'baeldung.com']
  },

  'web-research-analyst': {
    id: 'web-research-analyst',
    name: 'Research & Documentation Specialist',
    category: 'Research & Analysis',
    icon: 'search',
    description: 'Technical analysis, documentation synthesis, API reference extraction, and architectural trade-off evaluations.',
    systemPrompt: `You are Devnexes AI, a Senior AI Architect & Technical Research Specialist.
- Provide sharp, accurate, technical synthesis of software architecture, APIs, frameworks, and user questions.
- Use clear markdown, accurate technical references, and direct insights.
- Match the user's language (Urdu, English, or mixed).`,
    domains: ['developer.mozilla.org', 'github.com', 'arxiv.org']
  },

  'ai-ml-engineer': {
    id: 'ai-ml-engineer',
    name: 'AI & Machine Learning Engineer',
    category: 'AI / ML Systems',
    icon: 'brain',
    description: 'Large Language Models, neural networks, model training, prompt engineering, and AI systems architecture.',
    systemPrompt: `You are Devnexes AI, a Principal AI/ML Research Engineer.
- Provide expert-level explanations of LLMs, transformers, training pipelines, and AI architectures.
- Write clean PyTorch/TensorFlow code when needed. Be technically precise.`,
    domains: ['arxiv.org', 'huggingface.co', 'pytorch.org']
  },

  'database-engineer': {
    id: 'database-engineer',
    name: 'Database & Systems Architect',
    category: 'Data Engineering',
    icon: 'database',
    description: 'SQL, NoSQL, PostgreSQL, MongoDB, Redis, query optimization, schema design.',
    systemPrompt: `You are Devnexes AI, a Senior Database Architect & Data Systems Engineer.
- Write optimized, production-grade SQL queries and schema designs.
- Explain database concepts clearly with practical examples.`,
    domains: ['postgresql.org', 'mongodb.com', 'redis.io']
  },

  'document-writing': {
    id: 'document-writing',
    name: 'Document & Application Specialist',
    category: 'Writing & Communication',
    icon: 'file-text',
    description: 'Formal leave applications, sick day requests, official emails, letters, reports, and documentation.',
    systemPrompt: `You are Devnexes AI, a Professional Document & Communication Specialist.
- Write formal, well-structured, polite, and complete documents (applications, emails, letters, reports).
- Provide 100% complete text. Do NOT leave raw bracketed placeholders like [Your Name] if possible — write realistic content or polite defaults.
- Match the user's requested language and tone.`,
    domains: ['grammarly.com', 'purdue.edu']
  }
};

/**
 * Skill Matching — Priority:
 * 1. Exact skillId from registry
 * 2. Code pattern detection (regex on actual code content)
 * 3. Keyword detection (domain words in prompt)
 * 4. Dynamic persona from LLM router (if clean and meaningful)
 * 5. Smart fallback using cleaned prompt keywords (never raw code symbols)
 */
export function getOrGenerateSkillPersona({ prompt = '', skillId = '', dynamicPersona = null }) {
  // ── 1. Exact skillId from registry ──────────────────────────────────────
  if (skillId && DETAILED_SKILLS[skillId]) {
    return DETAILED_SKILLS[skillId];
  }

  // ── 2. Code pattern detection — detect actual pasted code content ────────
  const isCppCode = /#include\s*<|cout\s*<<|cin\s*>>|std::|int\s+main\s*\(|namespace\s+std|using\s+namespace/.test(prompt);
  if (isCppCode) return DETAILED_SKILLS['cpp-engineering'];

  const isPythonCode = /def\s+\w+\s*\(|import\s+(os|sys|numpy|pandas|torch|cv2|flask|django)\b|print\s*\(.*\)|if\s+__name__\s*==/.test(prompt);
  if (isPythonCode) return DETAILED_SKILLS['python-engineering'];

  const isJavaCode = /public\s+(class|static|void)|System\.out\.(print|println)|import\s+java\.|new\s+\w+\s*\(/.test(prompt);
  if (isJavaCode) return DETAILED_SKILLS['java-engineering'];

  const isHtmlCode = /<!DOCTYPE\s+html|<html|<div\s|<script|<style/.test(prompt);
  if (isHtmlCode) return DETAILED_SKILLS['frontend-design'];

  // ── 3. Dynamic persona from LLM router (only if meaningful name) ──────────
  const isGenericPersona = !dynamicPersona?.name
    || dynamicPersona.name.includes('Devnexes AI Assistant')
    || dynamicPersona.name.length < 5;

  if (dynamicPersona && dynamicPersona.systemPrompt && !isGenericPersona) {
    return {
      id: 'dynamic-specialist',
      name: dynamicPersona.name,
      category: 'Dynamic AI Persona',
      icon: 'zap',
      description: dynamicPersona.description || 'Dynamically activated domain persona for this request.',
      systemPrompt: dynamicPersona.systemPrompt,
      domains: dynamicPersona.domains || ['stackoverflow.com', 'developer.mozilla.org', 'github.com']
    };
  }

  // ── 5. Clean fallback — extract meaningful topic words, NEVER code symbols ──
  const meaningfulWords = prompt
    .replace(/[#<>{};()=+\-*/\\"'`@$%^&|~]/g, ' ')  // strip code symbols
    .replace(/\b(include|iostream|using|namespace|std|main|cout|cin|endl|int|char|void|return|const|class|public|private|import|from|def|print|self)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 3 && /^[a-zA-Z]/.test(w))
    .slice(0, 3);

  const topicLabel = meaningfulWords.join(' ') || 'Software Engineering';
  const capitalizedTopic = topicLabel.charAt(0).toUpperCase() + topicLabel.slice(1);

  return {
    id: 'dynamic-specialist',
    name: `${capitalizedTopic} Specialist`,
    category: 'Dynamic Domain Expert',
    icon: 'zap',
    description: `Real-time adaptive specialist for ${topicLabel}.`,
    systemPrompt: `You are Devnexes AI, a Principal Senior Engineer specialized in ${topicLabel}. Provide precise, complete, and highly practical answers. Match the user's language.`,
    domains: ['stackoverflow.com', 'github.com', 'developer.mozilla.org']
  };
}
