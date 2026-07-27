import React, { useState } from 'react';
import { Key, X, ExternalLink, Check, Info } from 'lucide-react';
import { getGroqApiKey, setGroqApiKey } from '../services/groqService';

export default function ApiKeyModal({ isOpen, onClose, onSave }) {
  const [apiKey, setApiKeyInput] = useState(getGroqApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setGroqApiKey(apiKey);
    setSavedSuccess(true);
    if (onSave) onSave(apiKey);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Key size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Groq API Key Setup</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Set environment variable or local key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/40 flex items-start space-x-2.5 text-xs text-orange-800 dark:text-orange-300">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              You can also specify your API key inside the <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border font-mono">.env</code> file as <code className="font-mono">VITE_GROQ_API_KEY=gsk_...</code>.
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Groq API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-orange-500 hover:underline flex items-center space-x-1"
            >
              <span>Get Groq API Key</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
