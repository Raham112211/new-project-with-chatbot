import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink } from 'lucide-react';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0d0f15] shadow-2xs overflow-hidden font-mono text-[11.5px]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100 dark:bg-[#090a0e] border-b border-slate-200 dark:border-slate-800 text-[10.5px]">
        <span className="text-[#0066FF] dark:text-blue-400 font-bold uppercase tracking-wider font-sans">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-sans"
        >
          {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-3.5 overflow-x-auto text-slate-800 dark:text-slate-200 leading-relaxed custom-scrollbar font-mono">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-body font-sans text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 space-y-1.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-lustria text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block"></span>
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-lustria text-[14.5px] font-bold text-slate-900 dark:text-white mt-2.5 mb-1 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block"></span>
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-lustria text-[13.5px] font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-700 dark:text-slate-300 leading-normal my-1">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 my-1.5 pl-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 text-slate-700 dark:text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start space-x-1.5 text-slate-700 dark:text-slate-300">
              <span className="text-[#0066FF] font-bold mt-0.5 select-none shrink-0 text-xs">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">
              {children}
            </strong>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            } else if (!inline && codeString.includes('\n')) {
              return <CodeBlock language="text" code={codeString} />;
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11.5px] font-mono border border-slate-200 dark:border-slate-700/80 font-medium">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-1.5 pl-2.5 py-1 border-l-2 border-[#0066FF] bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 rounded-r text-xs italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-1.5 text-[11px] font-bold uppercase">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-[11.5px] border-t border-slate-100 dark:border-slate-800/60">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[#0066FF] font-semibold hover:underline inline-flex items-center space-x-0.5"
            >
              <span>{children}</span>
              <ExternalLink size={9} className="shrink-0" />
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
