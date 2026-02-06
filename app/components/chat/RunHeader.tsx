import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Layers, RotateCw } from 'lucide-react';

interface RunHeaderProps {
  progress: number; // 0-100
  stageLabel: string;
  iteration?: { current: number; max: number };
  activeAgents: Array<{
    agentId: string;
    status: 'idle' | 'working' | 'blocked' | 'done' | 'error';
    currentTask: string;
    model?: string;
  }>;
  stats: {
    filesTouched: number;
    qcIssues: { critical: number; high: number; medium: number; low: number };
  };
  onToggleExpert: () => void;
  isExpertOpen: boolean;
}

const AgentChip = ({ agent }: { agent: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse';
      case 'done':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#333] px-3 py-1.5 rounded-full text-xs">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
      <div className="flex flex-col">
        <span className="font-medium text-gray-200 uppercase tracking-wider text-[10px]">
          {agent.agentId} <span className="text-gray-500 ml-1">{agent.model}</span>
        </span>
        <span className="text-gray-400 truncate max-w-[120px]">{agent.currentTask || 'Idle'}</span>
      </div>
    </div>
  );
};

export const RunHeader: React.FC<RunHeaderProps> = ({
  progress,
  stageLabel,
  iteration,
  activeAgents,
  stats,
  onToggleExpert,
  isExpertOpen,
}) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full bg-[#111]/90 backdrop-blur-md border-b border-[#333] shadow-xl"
    >
      {/* Top Bar: Progress & Stage */}
      <div className="h-1 bg-[#222] w-full mt-14 absolute top-0"> {/* Should be relative? No, fixed structure */}</div>

      <div className="flex flex-col gap-2 p-3">
        {/* Row 1: Progress Bar & Primary Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#222] border border-[#333]">
              {progress >= 100 ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <RotateCw className="w-5 h-5 text-blue-400 animate-spin-slow" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="tex-sm font-semibold text-white tracking-wide">{stageLabel}</h3>
                {iteration && (
                  <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">
                    Fix Loop {iteration.current}/{iteration.max}
                  </span>
                )}
              </div>
              <div className="w-[300px] h-1.5 bg-[#222] rounded-full mt-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400" title="Files Touched">
                <Layers className="w-3.5 h-3.5" />
                <span>{stats.filesTouched}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400" title="QC Issues">
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${stats.qcIssues.critical > 0 ? 'text-red-500' : 'text-gray-400'}`}
                />
                <div className="flex gap-1">
                  {stats.qcIssues.critical > 0 && (
                    <span className="text-red-400 font-bold">{stats.qcIssues.critical}C</span>
                  )}
                  {stats.qcIssues.high > 0 && <span className="text-orange-400">{stats.qcIssues.high}H</span>}
                  {stats.qcIssues.critical === 0 && stats.qcIssues.high === 0 && <span>0 issues</span>}
                </div>
              </div>
            </div>

            <button
              onClick={onToggleExpert}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isExpertOpen
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-[#222] text-gray-400 border-[#333] hover:text-white'
              }`}
            >
              Expert View
            </button>
          </div>
        </div>

        {/* Row 2: Active Agents */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
          {activeAgents.map((agent) => (
            <AgentChip key={agent.agentId} agent={agent} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
