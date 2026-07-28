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
    <div className="relative my-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] shadow-2xs overflow-hidden font-mono text-[11.5px]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-100 border-b border-slate-200 text-[10.5px]">
        <span className="text-[#0066FF] font-bold uppercase tracking-wider font-sans">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-0.5 rounded text-slate-700 hover:bg-slate-200/60 transition-colors font-sans"
        >
          {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-3.5 overflow-x-auto text-slate-900 leading-relaxed custom-scrollbar font-mono">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-body font-sans text-[14px] sm:text-[14.5px] leading-relaxed text-slate-900 space-y-1.5 font-normal tracking-normal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-sans text-base font-bold text-slate-950 mt-3 mb-1.5 pb-1 border-b border-slate-200 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block"></span>
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-sans text-[14.5px] font-bold text-slate-950 mt-2.5 mb-1 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block"></span>
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-sans text-[13.5px] font-bold text-slate-900 mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-900 leading-relaxed my-1 font-normal">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 my-1.5 pl-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 text-slate-900">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start space-x-1.5 text-slate-900">
              <span className="text-[#0066FF] font-bold mt-0.5 select-none shrink-0 text-xs">•</span>
              <span className="flex-1 text-slate-900">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-950">
              {children}
            </strong>
          ),
          code: ({ inline, className, children }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            } else if (!inline && codeString.includes('\n')) {
              return <CodeBlock language="text" code={codeString} />;
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 text-[11.5px] font-mono border border-slate-200 font-medium">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-1.5 pl-2.5 py-1 border-l-2 border-[#0066FF] bg-slate-50 text-slate-900 rounded-r text-xs italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left text-slate-900 divide-y divide-slate-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-slate-950 font-bold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-950">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-[11.5px] border-t border-slate-100 text-slate-900">{children}</td>
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
