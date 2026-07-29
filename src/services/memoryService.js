/**
 * Devnexes AI — Dynamic Memory & Conversation Context Service
 * Handles conversation memory retrieval and Silent Memory Protocol.
 * 
 * Rules:
 * 1. The LLM has full awareness and memory of prior conversations and comments.
 * 2. Silent Memory Protocol: The LLM MUST NOT spontaneously bring up or mention past history
 *    UNLESS the user explicitly asks about past topics, memories, or prior discussions.
 * 3. When the user asks about previous chats/comments ("Purani baat kya hui thi", "Do you remember..."),
 *    the model retrieves and answers accurately from memory.
 */

/**
 * Detects if the user's prompt is explicitly asking to recall or discuss past memory/history
 */
export function isMemoryRecallRequested(prompt = '') {
  if (!prompt) return false;
  const p = prompt.toLowerCase();
  return (
    p.includes('remember') ||
    p.includes('purani') ||
    p.includes('purane') ||
    p.includes('earlier') ||
    p.includes('previous') ||
    p.includes('last time') ||
    p.includes('pehle kya') ||
    p.includes('pehly kya') ||
    p.includes('baat hui thi') ||
    p.includes('hamari baat') ||
    p.includes('humari baat') ||
    p.includes('past chat') ||
    p.includes('history') ||
    p.includes('summary of past') ||
    p.includes('what did we talk') ||
    p.includes('what did i ask') ||
    p.includes('do you recall') ||
    p.includes('past comments')
  );
}

/**
 * Builds formatted past context from active message history and stored conversations
 */
export function buildMemoryContext(messagesHistory = [], maxItems = 12) {
  if (!Array.isArray(messagesHistory) || messagesHistory.length === 0) {
    return [];
  }

  return messagesHistory.slice(-maxItems).map(m => {
    let contentStr = '';
    if (m.role === 'user') {
      contentStr = m.content || '';
    } else {
      const art = m.traceData?.steps?.find(s => s.type === 'artifact');
      if (art) {
        contentStr = `Generated ${art.language || 'artifact'} titled "${art.title || 'Solution'}"`;
      } else {
        contentStr = m.traceData?.steps?.find(s => s.type === 'response')?.content || m.content || 'Responded';
      }
    }

    return {
      role: m.role === 'user' ? 'user' : 'assistant',
      content: contentStr
    };
  });
}

/**
 * Generates the Dynamic Memory Protocol System Prompt Header
 */
export function getDynamicMemorySystemPrompt(isRecallNeeded = false) {
  if (isRecallNeeded) {
    return `MEMORY RECALL PROTOCOL ACTIVE:
- The user is explicitly asking about past conversations, previous discussions, or past memory.
- Use the provided conversation history memory to answer accurately, completely, and warmly.
- Match the user's input language (Roman Urdu, English, Urdu, etc.) EXACTLY.`;
  }

  return `DYNAMIC SILENT MEMORY PROTOCOL:
- You have full access and memory of the user's prior conversations and comments provided in history.
- CRITICAL SILENT RULE: Do NOT spontaneously mention, recall, boast, or bring up past conversation history or previous topics UNLESS the user explicitly asks about them (e.g., "What did we talk about earlier?", "Do you remember...", "Purani baat batao").
- Focus 100% on answering the user's current request directly and clearly without unprompted references to past conversations.`;
}
