/**
 * Technical Interview Hub & Role Coverage Matrix View
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Code,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const InterviewHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'QUESTIONS'>('MATRIX');
  const [roleMatrix, setRoleMatrix] = useState<any[]>([]);
  const [interviewCategories, setInterviewCategories] = useState<any[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      const [matrixRes, questionsRes] = await Promise.all([
        api.getRoleCoverage(),
        api.getInterviewQuestions()
      ]);
      setRoleMatrix(matrixRes.roles || []);
      setInterviewCategories(questionsRes.categories || []);
    } catch (err) {
      console.error('Failed to load interview hub data:', err);
    }
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MODULE 29 &amp; 37 • TECHNICAL INTERVIEW &amp; JD COVERAGE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              8 JD TRACKS MAPPED
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Award className="w-6 h-6 text-emerald-400" />
            <span>Technical Interview Hub &amp; Role Coverage Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Exhaustive mapping of all 8 VLSI Technology JD roles against implemented architecture, with interview deep-dives and model answers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'MATRIX', label: '1. Role Coverage Matrix (8 JD Tracks)', icon: CheckCircle2 },
          { id: 'QUESTIONS', label: '2. Technical Interview Questions & Answers', icon: HelpCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROLE COVERAGE MATRIX */}
      {activeTab === 'MATRIX' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-200 uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Job Description Requirements vs Implementation Proof</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              Coverage: <span className="text-emerald-400 font-bold">100% (8/8 Tracks Complete)</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] divide-y divide-slate-800">
              <thead className="text-slate-400 bg-slate-950 uppercase">
                <tr>
                  <th className="p-3">Role / Track</th>
                  <th className="p-3">JD Requirement</th>
                  <th className="p-3">Implemented Architecture</th>
                  <th className="p-3">Demonstrable Module</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roleMatrix.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-950/40 text-slate-300">
                    <td className="p-3 font-bold text-emerald-400">{r.role}</td>
                    <td className="p-3 text-slate-400 text-[10px] max-w-xs">{r.jdRequirement}</td>
                    <td className="p-3 text-slate-200">{r.implementedTechnology}</td>
                    <td className="p-3 font-mono text-cyan-400">{r.demonstrableFeature}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'IMPLEMENTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL INTERVIEW QUESTIONS */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-6 font-mono text-xs">
          {interviewCategories.map((cat: any, cIdx: number) => (
            <div key={cIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>{cat.category}</span>
              </h3>

              <div className="space-y-3">
                {cat.questions?.map((q: any, qIdx: number) => {
                  const qKey = `${cIdx}-${qIdx}`;
                  const isOpen = expandedQuestions[qKey];
                  return (
                    <div key={qIdx} className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(qKey)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-900/60 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-xs">{q.question}</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                              {q.difficulty}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">Ref: {q.projectLink}</div>
                        </div>

                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3 text-xs">
                          <div>
                            <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Expected Model Answer:</div>
                            <p className="text-slate-300 leading-relaxed">{q.expectedAnswer}</p>
                          </div>

                          <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80">
                            <div className="text-[10px] text-amber-400 uppercase font-bold mb-0.5">Potential Follow-Up Question:</div>
                            <p className="text-slate-400 text-[11px]">{q.followUp}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
