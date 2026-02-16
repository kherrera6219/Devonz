import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, ShieldCheck, BookOpen, GitCommit } from 'lucide-react';

interface ExpertEvent {
  type: string;
  agent: string;
  timestamp: string;
  summary: string;
  details?: unknown; // Keeping details loose for now as it varies greatly
}

interface ResearchData {
  techReality: {
    stackSummary: string;
    recommendedPins?: Array<{ name: string; recommended: string; reason: string }>;
  };
  codebaseAnalysis?: {
    summary: string;
    files?: string[];
    architecturalNotes?: string;
    bottlenecks?: string[];
  };
  patchCount?: number;
  [key: string]: unknown;
}

interface QCReport {
  issues?: Array<{ title: string; description: string }>;
  [key: string]: unknown;
}

interface ExpertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: ExpertEvent[];
  qcReport?: QCReport;
}

export const ExpertDrawer: React.FC<ExpertDrawerProps> = ({ isOpen, onClose, events, qcReport: _qcReport }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'qc' | 'research' | 'changes'>('timeline');

  // Extract latest data from events
  const { researchData, patchEvents, qcEvents } = React.useMemo(() => {
    const researchEvent = [...events].reverse().find((e) => e.type === 'artifact_ready' && e.agent === 'researcher');
    const patches = events.filter((e) => e.type === 'patch_applied');
    const qcs = events.filter((e) => e.type === 'qc_issues_found' || e.type === 'qc_passed' || e.type === 'qc_failed');

    return {
      researchData: (researchEvent?.details as ResearchData) || {
        techReality: { stackSummary: '' },
      },
      patchEvents: patches,
      qcEvents: qcs,
    };
  }, [events]);

  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 h-full w-[500px] bg-[#0A0A0A] border-l border-[#333] shadow-2xl z-[60] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#222]">
        <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          RUN DETAILS (EXPERT)
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-[#222] rounded text-gray-400" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222]">
        {[
          { id: 'timeline', icon: Activity, label: 'Timeline' },
          { id: 'qc', icon: ShieldCheck, label: 'QC Report' },
          { id: 'research', icon: BookOpen, label: 'Research' },
          { id: 'changes', icon: GitCommit, label: 'Changes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'timeline' | 'qc' | 'research' | 'changes')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'timeline' && (
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div
                key={i}
                className="flex gap-3 text-xs p-2 hover:bg-[#111] rounded border border-transparent hover:border-[#222]"
              >
                <span className="text-gray-600 font-mono w-[60px]">
                  {new Date(ev.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                                ${
                                  ev.type === 'error'
                                    ? 'bg-red-500/20 text-red-500'
                                    : ev.type === 'qc_issues_found'
                                      ? 'bg-orange-500/20 text-orange-500'
                                      : 'bg-gray-800 text-gray-400'
                                }`}
                    >
                      {ev.type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">{ev.agent}</span>
                  </div>
                  <p className="text-gray-300">{ev.summary}</p>
                </div>
              </div>
            ))}
            {events.length === 0 && <div className="text-gray-600 text-center py-10">No events recorded yet.</div>}
          </div>
        )}

        {activeTab === 'qc' && (
          <div className="space-y-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Issue List</div>
            {qcEvents.length > 0 ? (
              qcEvents.map((ev, i) => (
                <div key={i} className="p-3 border border-[#222] bg-[#111] rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 capitalize">{ev.summary}</span>
                    <span className="text-[10px] text-gray-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {(ev.details as QCReport)?.issues?.map((issue: { title: string; description: string }, j: number) => (
                    <div key={j} className="text-xs text-gray-300 pl-2 border-l border-orange-500/30">
                      <div className="font-bold">{issue.title}</div>
                      <div className="text-gray-500">{issue.description}</div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="p-10 border border-dashed border-[#222] rounded text-gray-500 text-center text-sm">
                No QC findings recorded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'research' && (
          <div className="space-y-6">
            {researchData ? (
              <>
                {researchData.techReality && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-tight">
                      <BookOpen className="w-3 h-3" /> Tech Reality
                    </h3>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                      <p className="text-xs text-blue-100/70 mb-2">{researchData.techReality.stackSummary}</p>
                      <ul className="space-y-1">
                        {researchData.techReality.recommendedPins?.map(
                          (p: { name: string; recommended: string; reason: string }, i: number) => (
                            <li key={i} className="text-[11px] text-gray-400">
                              <span className="text-blue-300 font-mono">
                                {p.name}@{p.recommended}
                              </span>
                              : {p.reason}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </section>
                )}

                {researchData.codebaseAnalysis && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold text-green-400 flex items-center gap-2 uppercase tracking-tight">
                      <Activity className="w-3 h-3" /> Codebase Analysis
                    </h3>
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded">
                      <p className="text-xs text-green-100/70">{researchData.codebaseAnalysis.architecturalNotes}</p>
                      <div className="mt-2 grid grid-cols-1 gap-1">
                        {researchData.codebaseAnalysis.bottlenecks?.map((b: string, i: number) => (
                          <div
                            key={i}
                            className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20"
                          >
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-sm text-center py-10">Research artifacts will appear here.</div>
            )}
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="space-y-4">
            {patchEvents.length > 0 ? (
              patchEvents.map((ev, i) => (
                <div key={i} className="p-3 border border-[#222] bg-[#111] rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200">{ev.summary}</span>
                    <span className="text-[10px] text-gray-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 bg-black/50 p-2 rounded max-h-[150px] overflow-y-auto">
                    {(ev.details as ResearchData)?.patchCount} file(s) modified
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-10">File changes will appear here.</div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
