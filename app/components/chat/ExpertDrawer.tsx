
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, ShieldCheck, BookOpen, GitCommit } from 'lucide-react';

interface ExpertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: any[];
  qcReport?: any;
}

export const ExpertDrawer: React.FC<ExpertDrawerProps> = ({ isOpen, onClose, events, qcReport }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'qc' | 'research' | 'changes'>('timeline');

  if (!isOpen) return null;

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
         <button onClick={onClose} className="p-1 hover:bg-[#222] rounded text-gray-400">
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
          ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
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
                    <div key={i} className="flex gap-3 text-xs p-2 hover:bg-[#111] rounded border border-transparent hover:border-[#222]">
                       <span className="text-gray-600 font-mono w-[60px]">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</span>
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                             <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                                ${ev.type === 'error' ? 'bg-red-500/20 text-red-500' :
                                  ev.type === 'qc_issues_found' ? 'bg-orange-500/20 text-orange-500' :
                                  'bg-gray-800 text-gray-400'}`}>
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
                 {/* Placeholder for QC List from QCReport */}
                 <div className="p-3 border border-dashed border-[#333] rounded text-gray-500 text-center text-sm">
                    Running QC checks...
                 </div>
             </div>
          )}

          {/* Placeholders for other tabs */}
           {activeTab === 'research' && <div className="text-gray-500 text-sm text-center py-10">Research artifacts will appear here.</div>}
           {activeTab === 'changes' && <div className="text-gray-500 text-sm text-center py-10">File changes will appear here.</div>}
      </div>

    </motion.div>
  );
};
