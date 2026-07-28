import React, { useState } from 'react';
import { X, ExternalLink, Check, Info, Settings } from 'lucide-react';
import { getTavilyApiKey, setTavilyApiKey, getOpenRouterApiKey, setOpenRouterApiKey } from '../services/groqService';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [tavilyKey, setTavilyKeyInput] = useState(getTavilyApiKey());
  const [openRouterKey, setOpenRouterKeyInput] = useState(getOpenRouterApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setTavilyApiKey(tavilyKey);
    setOpenRouterApiKey(openRouterKey);
    setSavedSuccess(true);
    setTimeout(() => { setSavedSuccess(false); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Settings size={16} className="text-[#0066FF]" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Workspace Settings</h2>
              <p className="text-xs text-slate-500">Configure your API Keys</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-start space-x-2.5 text-xs text-blue-800">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              Keys can also be configured in <code className="bg-white px-1 py-0.5 rounded border font-mono">.env</code> as <code className="font-mono">VITE_TAVILY_API_KEY</code> and <code className="font-mono">VITE_OPENROUTER_API_KEY</code>.
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Tavily API Key <span className="text-blue-600 font-normal">(Real-time Live Web Search)</span>
            </label>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKeyInput(e.target.value)}
              placeholder="tvly-..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
            />
            <a href="https://tavily.com" target="_blank" rel="noreferrer" className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center space-x-1">
              <span>Get Free Tavily Key</span>
              <ExternalLink size={10} />
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              OpenRouter API Key <span className="text-purple-600 font-normal">(Cloud LLMs like Llama 3, DeepSeek)</span>
            </label>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKeyInput(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono"
            />
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="mt-1 text-[11px] text-purple-600 hover:underline flex items-center space-x-1">
              <span>Get OpenRouter Key</span>
              <ExternalLink size={10} />
            </a>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-medium bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-1.5">
              {savedSuccess ? <><Check size={14} /><span>Saved!</span></> : <span>Save Search Key</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
