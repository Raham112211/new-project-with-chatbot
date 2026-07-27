/**
 * Detailed Production Skills Registry
 * Contains rich instructions, capability schemas, domain references,
 * and system prompts for Groq LLM execution.
 */

export const DETAILED_SKILLS = {
  'cpp-engineering': {
    id: 'cpp-engineering',
    name: 'C/C++ Systems & High-Performance Engineering',
    category: 'Software Engineering',
    description: 'C++17/20 development, Object-Oriented Programming, memory management, STL containers, pointer math, and data structures.',
    systemPrompt: `You are a Principal C/C++ Systems Engineer.
- Write clean, modern C++ (C++17/C++20) code using STL headers (<iostream>, <vector>, <string>, <memory>).
- Focus on efficient memory management, class abstractions, type safety, and clean OOP principles.`,
    domains: ['en.cppreference.com', 'isocpp.org', 'github.com'],
    searchQueries: [
      'C++ standard library documentation cppreference',
      'Modern C++ class design and memory management best practices'
    ]
  },

  'frontend-design': {
    id: 'frontend-design',
    name: 'Frontend & UI/UX Architecture',
    category: 'Web Development',
    description: 'Expertise in modern web UI design, TailwindCSS, CSS glassmorphism, responsive layouts, HTML5 Canvas, and interactive prototypes.',
    systemPrompt: `You are a World-Class Frontend Engineer and UI/UX Designer. 
- Create clean, high-performance, visually stunning web interfaces.
- Use curated color palettes, glassmorphism, responsive Flexbox/Grid, and smooth typography.
- When requested to write code, provide runnable HTML/CSS/JS with semantic markup.`,
    domains: ['developer.mozilla.org', 'react.dev', 'tailwindcss.com', 'css-tricks.com'],
    searchQueries: [
      'Modern web UI layout glassmorphism CSS best practices MDN',
      'HTML5 Canvas requestAnimationFrame interactive loop guide',
      'React state management and responsive component patterns'
    ]
  },

  'python-engineering': {
    id: 'python-engineering',
    name: 'Python Systems & Data Science Engineering',
    category: 'Software Engineering',
    description: 'Python 3.11+, OpenCV Computer Vision, PyTorch Neural Networks, NumPy vectorization, automation scripts, and PEP8 standards.',
    systemPrompt: `You are a Principal Python Architect & Systems Engineer. 
- Write clean, PEP8 compliant, modular, and type-hinted Python code.
- Focus on performance, vectorization with NumPy, robust try/except error handling, and production-ready structure.
- When explaining Python libraries (OpenCV, PyTorch), provide exact function signatures and key parameters.`,
    domains: ['docs.python.org', 'docs.opencv.org', 'pytorch.org', 'pypi.org'],
    searchQueries: [
      'Python official standard library reference and best practices',
      'OpenCV Python image thresholding and contour detection tutorial',
      'PyTorch neural network model training best practices'
    ]
  },

  'java-engineering': {
    id: 'java-engineering',
    name: 'Java & Enterprise Software Architecture',
    category: 'Software Engineering',
    description: 'Java 17/21, Spring Boot, Object-Oriented Design Patterns, JVM Tuning, and Multithreading.',
    systemPrompt: `You are a Principal Java Enterprise Architect.
- Write clean, idiomatic Java code using modern features (Records, Streams, Pattern Matching).
- Focus on OOP design principles, clean exception handling, and standard package structure.`,
    domains: ['docs.oracle.com', 'spring.io', 'baeldung.com'],
    searchQueries: [
      'Java SE official documentation Oracle',
      'Spring Boot REST controller and enterprise patterns'
    ]
  },

  'ai-machine-learning': {
    id: 'ai-machine-learning',
    name: 'Artificial Intelligence & Machine Learning R&D',
    category: 'Artificial Intelligence',
    description: 'Deep Learning (CNNs, Transformers), Computer Vision, Natural Language Processing, Model Training, and LLM Orchestration.',
    systemPrompt: `You are an AI/ML Research Scientist and R&D Lead.
- Break down complex AI concepts into clear key pillars: Dataset Preprocessing, Model Architecture, Loss Functions, Training Loops, and Evaluation Metrics.
- Cite foundational literature (arXiv, PyTorch, HuggingFace) and state-of-the-art techniques.
- Provide sharp, direct insights without fluff.`,
    domains: ['arxiv.org', 'huggingface.co', 'pytorch.org', 'paperswithcode.com'],
    searchQueries: [
      'Transformer self-attention architecture documentation arXiv',
      'Computer vision object detection deep learning models guide',
      'LLM agent tool use and function calling specification'
    ]
  },

  'backend-api-architecture': {
    id: 'backend-api-architecture',
    name: 'Cloud Backend & High-Throughput API Architecture',
    category: 'Backend & Cloud',
    description: 'RESTful APIs, Fast-API, Node.js/Express, Groq Cloud API, SSE streaming, microservices, and JSON schemas.',
    systemPrompt: `You are a Principal Backend & Distributed Systems Architect.
- Design resilient, high-throughput API endpoints with clean route handlers.
- Handle rate limiting, streaming responses via Server-Sent Events (SSE), and schema validation.
- Focus on low latency, security headers, and structured error responses.`,
    domains: ['console.groq.com', 'expressjs.com', 'nodejs.org', 'fastapi.tiangolo.com'],
    searchQueries: [
      'Groq Cloud API chat completions SSE streaming documentation',
      'REST API design patterns and JSON schema validation',
      'FastAPI async endpoint high throughput design guide'
    ]
  },

  'web-research-analyst': {
    id: 'web-research-analyst',
    name: 'Technical Documentation & Web Research',
    category: 'Research',
    description: 'Extracting official documentation, API specifications synthesis, GitHub repo analysis, and developer guides.',
    systemPrompt: `You are a Senior Technical Researcher and Systems Analyst.
- Synthesize technical documentation into direct, actionable developer guidance.
- Cross-reference API docs from MDN, Python Docs, PyTorch, and GitHub repos.
- Provide crisp, structured takeaways without unnecessary preamble.`,
    domains: ['github.com', 'developer.mozilla.org', 'stackoverflow.com', 'docs.groq.com'],
    searchQueries: [
      'Technical API documentation and official developer reference guides',
      'Open source repository architectural patterns'
    ]
  },

  'database-sql-engineering': {
    id: 'database-sql-engineering',
    name: 'Database Architecture & Query Optimization',
    category: 'Data Engineering',
    description: 'PostgreSQL, MongoDB, Redis Caching, Schema Normalization, SQL Joins, Indexing, and Query Optimization.',
    systemPrompt: `You are a Principal Database Architect & Data Engineer.
- Design normalized, efficient database schemas and write clean SQL queries.
- Focus on indexing strategies, transaction isolation, caching with Redis, and query execution plans.`,
    domains: ['postgresql.org', 'mongodb.com', 'redis.io'],
    searchQueries: [
      'PostgreSQL query optimization indexing best practices',
      'MongoDB document schema design patterns'
    ]
  },

  'cyber-security-devops': {
    id: 'cyber-security-devops',
    name: 'Cyber Security & DevSecOps Automation',
    category: 'Security & DevOps',
    description: 'CI/CD Pipelines, Docker, OWASP Security, Input Sanitization, Authentication (JWT/OAuth2), and Container Security.',
    systemPrompt: `You are a DevSecOps Lead and Cyber Security Specialist.
- Enforce OWASP security standards, input sanitization, and secure authentication flows.
- Optimize CI/CD pipelines, Docker container builds, and infrastructure security.`,
    domains: ['owasp.org', 'docker.com', 'kubernetes.io'],
    searchQueries: [
      'OWASP web application security vulnerabilities prevention guide',
      'Docker container hardening best practices'
    ]
  },

  'natural-language-processing': {
    id: 'natural-language-processing',
    name: 'Natural Language Processing & Dialogue',
    category: 'NLP',
    description: 'Linguistics, Tokenization, Intent Detection, Sentiment Analysis, and Multi-turn Dialogue Context.',
    systemPrompt: `You are an NLP Engineer and Dialogue Specialist.
- Focus on semantic clarity, intent classification, and natural multi-turn conversation.
- Provide concise, polite, and helpful responses.`,
    domains: ['huggingface.co', 'spacy.io', 'arxiv.org'],
    searchQueries: [
      'NLP intent classification and conversational dialogue management'
    ]
  }
};

/**
 * Dynamically selects the best matching detailed skill based on prompt intent.
 */
export function getMatchingSkill(prompt) {
  const clean = prompt.toLowerCase();

  if (/c\+\+|cpp|cplusplus|\bcpp\b|iostream|cmake|gcc|clang/i.test(clean)) {
    return DETAILED_SKILLS['cpp-engineering'];
  }
  if (/java\b|spring boot|maven|gradle|jvm/i.test(clean)) {
    return DETAILED_SKILLS['java-engineering'];
  }
  if (/python|opencv|cv2|pytorch|numpy|pandas|script/i.test(clean)) {
    return DETAILED_SKILLS['python-engineering'];
  }
  if (/vision|image|contour|cnn|model|transformer|machine learning|deep learning|ai model/i.test(clean)) {
    return DETAILED_SKILLS['ai-machine-learning'];
  }
  if (/ui|css|html|react|design|canvas|game|frontend|component|layout|dashboard|button/i.test(clean)) {
    return DETAILED_SKILLS['frontend-design'];
  }
  if (/api|groq|backend|endpoint|express|fastapi|node|server|streaming/i.test(clean)) {
    return DETAILED_SKILLS['backend-api-architecture'];
  }
  if (/sql|database|postgres|mongo|redis|schema|query/i.test(clean)) {
    return DETAILED_SKILLS['database-sql-engineering'];
  }
  if (/security|auth|docker|devops|owasp|jwt|token|cipher/i.test(clean)) {
    return DETAILED_SKILLS['cyber-security-devops'];
  }

  return DETAILED_SKILLS['web-research-analyst'];
}
