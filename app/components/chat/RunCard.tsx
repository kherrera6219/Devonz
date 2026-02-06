import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, FileCode } from 'lucide-react';

interface RunCardProps {
  statusLines: string[]; // 3 lines max
  stages: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    summary?: string;
  }>;
  lastQC?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  onAction?: (action: string) => void;
}

export const RunCard: React.FC<RunCardProps> = ({ statusLines, stages, lastQC, onAction }) => {
  return (
    <div className="w-full max-w-3xl mx-auto my-4 bg-[#0A0A0A] border border-[#333] rounded-xl overflow-hidden shadow-lg">
      {/* Live Status Area */}
      <div className="bg-[#111] p-4 border-b border-[#222]">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Live Activity</h4>
        <div className="space-y-2 font-mono text-sm h-[80px] overflow-hidden">
          {statusLines.length === 0 && <span className="text-gray-600 italic">Initializing...</span>}
          {statusLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 text-gray-300"
            >
              <span className="text-blue-500 mt-1">›</span>
              <span>{line}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stage History */}
      <div className="p-4 space-y-4">
        {stages.map((stage, i) => (
          <div key={i} className={`flex gap-3 ${stage.status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
            <div className="mt-1">
              {stage.status === 'completed' && (
                <div className="w-5 h-5 rounded-full bg-green-900/30 border border-green-500/50 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
              )}
              {stage.status === 'running' && (
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              )}
              {stage.status === 'pending' && <div className="w-5 h-5 rounded-full border border-gray-700" />}
              {stage.status === 'failed' && (
                <div className="w-5 h-5 rounded-full bg-red-900/30 border border-red-500/50 flex items-center justify-center">
                  <X className="w-3 h-3 text-red-400" />
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-200">{stage.name}</div>
              {stage.summary && <div className="text-xs text-gray-400 mt-0.5">{stage.summary}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats / Actions Footer */}
      {(lastQC || onAction) && (
        <div className="bg-[#111] p-3 border-t border-[#222] flex items-center justify-between">
          {lastQC ? (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-500 font-medium">LATEST QC</span>
              <div className="flex gap-3">
                <span className={`${lastQC.critical > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                  {lastQC.critical} Critical
                </span>
                <span className={`${lastQC.high > 0 ? 'text-orange-400' : 'text-gray-400'}`}>{lastQC.high} High</span>
                <span className="text-gray-400">{lastQC.medium} Med</span>
              </div>
            </div>
          ) : (
            <div />
          )}

          {onAction && (
            <div className="flex gap-2">
              <button
                onClick={() => onAction('view_changes')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-xs text-gray-300 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" /> Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
