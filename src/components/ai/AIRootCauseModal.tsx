/**
 * AI-Powered Semiconductor Diagnostics & FMEA Analysis Modal (Gemini API)
 */

import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { X, Sparkles, BrainCircuit, RefreshCw, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIRootCauseModalProps {
  deviceId: string;
  onClose: () => void;
}

export const AIRootCauseModal: React.FC<AIRootCauseModalProps> = ({ deviceId, onClose }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ engine: string; analysis: string; contextSnapshot: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (userPrompt?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runAIDiagnostics(deviceId, userPrompt || question);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute AI diagnostics');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runAnalysis();
  }, [deviceId]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <span>Solid-State Failure Analysis & FMEA Assistant</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {deviceId}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                AI physics grounding & Arrhenius / TDDB failure mechanism analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 text-xs">
          {loading && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
              <div className="font-mono text-xs">Correlating real-time silicon telemetry with Solid-State Physics models...</div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              {/* Engine Badge */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400">Diagnostic Engine:</span>
                <span className="text-purple-400 font-semibold">{result.engine}</span>
              </div>

              {/* Analysis Markdown */}
              <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none text-xs">
                <Markdown>{result.analysis}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Query Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) runAnalysis(question);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask custom physics failure question (e.g. 'What is the electromigration risk at 90C?')..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none font-sans"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Query</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
