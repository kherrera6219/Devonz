import type { JSONValue } from 'ai';

export interface AgentState {
  agentId: string;
  status: 'idle' | 'working' | 'blocked' | 'done' | 'error';
  currentTask: string;
  model?: string;
}

export interface RunStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: string;
}

export interface QCReport {
  issues?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface LogEvent {
  type: string;
  payload?: unknown;
  stage: string;
  summary?: string;
  details?: {
    max_iterations?: number;
    issues?: unknown;
  };
  agent?: string;
}

export interface RunUIState {
  progress: number;
  stageLabel: string;
  activeAgents: AgentState[];
  stats: {
    filesTouched: number;
    qcIssues: { critical: number; high: number; medium: number; low: number };
  };
  runStages: RunStage[];
  statusLines: string[];
  iteration?: { current: number; max: number };
  events: LogEvent[];
  lastQCReport?: QCReport;
}

const INITIAL_STAGES: RunStage[] = [
  { name: 'Planning', status: 'pending' },
  { name: 'Implementation', status: 'pending' },
  { name: 'Review', status: 'pending' },
];

export function processRunEvents(data: JSONValue[] | undefined): RunUIState {
  // Default State
  const state: RunUIState = {
    progress: 0,
    stageLabel: 'Initializing',
    activeAgents: [],
    stats: { filesTouched: 0, qcIssues: { critical: 0, high: 0, medium: 0, low: 0 } },
    runStages: [...INITIAL_STAGES],
    statusLines: [],
    events: [],
  };

  if (!data || !Array.isArray(data)) {
    return state;
  }

  // Filter only event logs
  const eventLogs = (data as Record<string, unknown>[])
    .filter((item) => item && item.type === 'event_log' && item.payload)
    .map((item) => item.payload as LogEvent);

  state.events = eventLogs;

  // Reduce events to state
  for (const event of eventLogs) {
    // 1. Run / Stage Lifecycle
    if (event.type === 'run_started') {
      state.progress = 5;
      state.stageLabel = 'Starting Run';
    }

    if (event.type === 'stage_started') {
      state.stageLabel = event.stage;

      // rudimentary mapping
      if (event.stage.includes('PLAN')) {
        updateStageStatus(state.runStages, 'Planning', 'running');
        state.progress = 10;
      } else if (event.stage.includes('EXEC') || event.stage.includes('FIX')) {
        updateStageStatus(state.runStages, 'Implementation', 'running');
        state.progress = 40;
      } else if (event.stage.includes('QC')) {
        updateStageStatus(state.runStages, 'Review', 'running');
        state.progress = 80;
      }
    }

    if (event.type === 'stage_completed') {
      if (event.stage.includes('PLAN')) {
        updateStageStatus(state.runStages, 'Planning', 'completed', event.summary);
        state.progress = 30;
      } else if (event.stage.includes('EXEC')) {
        updateStageStatus(state.runStages, 'Implementation', 'completed', event.summary);
        state.progress = 70;
      } else if (event.stage.includes('QC')) {
        updateStageStatus(state.runStages, 'Review', 'completed', event.summary);
        state.progress = 100;
      }

      const summary = event.summary || event.stage;
      state.statusLines.unshift(`Completed: ${summary}`);
    }

    // 2. Iteration (Fix Loops)
    if (event.type === 'iteration_started') {
      state.iteration = {
        current: (state.iteration?.current || 0) + 1,
        max: event.details?.max_iterations || 3,
      };
      state.statusLines.unshift(`Starting Fix Loop ${state.iteration.current}`);
    }

    // 3. Agent Status
    if (event.type === 'agent_status') {
      const existingAgent = state.activeAgents.find((a) => a.agentId === event.agent);

      if (existingAgent) {
        existingAgent.currentTask = event.summary || 'Working...';
        existingAgent.status = 'working';
      } else if (event.agent) {
        state.activeAgents.push({
          agentId: event.agent,
          status: 'working',
          currentTask: event.summary || 'Working...',
          model: 'GPT-4o', // Placeholder or derived
        });
      }

      if (event.summary) {
        state.statusLines.unshift(`[${event.agent}] ${event.summary}`);
      }
    }

    // 4. Artifacts / Patches (Stats)
    if (event.type === 'patch_applied' || event.type === 'artifact_ready') {
      state.stats.filesTouched++;

      if (event.summary) {
        state.statusLines.unshift(`Generated: ${event.summary}`);
      }
    }

    // 5. QC Issues
    if (event.type === 'qc_issues_found') {
      // Assuming details has severity counts
      if (event.details?.issues) {
        // simple increment for demo if details structure varies
        state.stats.qcIssues.critical += 1;
      }

      if (event.summary) {
        state.statusLines.unshift(`QC Issues Found: ${event.summary}`);
      }
    }

    // Cap status lines
    if (state.statusLines.length > 5) {
      state.statusLines = state.statusLines.slice(0, 5);
    }
  }

  return state;
}

function updateStageStatus(stages: RunStage[], name: string, status: RunStage['status'], summary?: string) {
  const stage = stages.find((s) => s.name === name);

  if (stage) {
    stage.status = status;

    if (summary) {
      stage.summary = summary;
    }
  }
}
