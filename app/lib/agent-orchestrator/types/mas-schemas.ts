/**
 * STRICT MULTI-AGENT SYSTEM SCHEMAS
 *
 * This file defines the core contracts for the architecture alignment.
 * All agents and nodes must align with these types.
 */

/*
 * ==========================================
 * 1. Core Run State (Source of Truth)
 * ==========================================
 */

export type RunMode = 'single' | '3agent_fast' | '3agent_hardened' | '3agent_strict';

export interface RunState {
  runId: string;
  conversationId: string;
  userId: string;
  createdAt: string; // ISO8601
  mode: RunMode;

  agentModels: {
    coordinator: { provider: string; model: string };
    researcher: { provider: string; model: string };
    architect: { provider: string; model: string };
  };

  status: RunStatus;
  inputs: UserInputs;

  // Domain States
  plan: PlanState;
  research: ResearchState;
  artifacts: ArtifactState;
  qc: QCState;

  // Event History (Append-only)
  events: EventLogEntry[];

  // Optional Diagnostics
  cost?: { totalTokens: number; estimatedCost: number };
  warnings?: string[];
  errors?: string[];

  // Dynamic Content (Optional adapters for legacy/simple flows)
  response?: string;
  error?: string | Error | { message: string };
}

export interface RunStatus {
  stage: StageId;
  stageState: 'queued' | 'running' | 'waiting_user' | 'completed' | 'failed';
  progress: {
    percent: number;
    label: string;
    iteration?: { current: number; max: number };
  };
  activeAgents: ActiveAgentState[];
}

export interface ActiveAgentState {
  agentId: AgentId;
  status: 'idle' | 'working' | 'blocked' | 'done' | 'error';
  currentTask: string;
  startedAt?: string;
  updatedAt?: string;
}

export type StageId =
  | 'COORD_PLAN'
  | 'RESEARCH_TECH_AND_SKILLS'
  | 'ARCH_BUILD'
  | 'QC1_SYNTAX_STYLE'
  | 'QC2_SECURITY_PERF'
  | 'QC2_COMPLETENESS'
  | 'ARCH_FIX'
  | 'COORD_POLISH_DELIVER'
  | 'FINALIZE'
  | 'END';

export type AgentId = 'coordinator' | 'researcher' | 'architect' | 'qc' | 'system';

export interface UserInputs {
  requestText: string;
  constraints: {
    language: 'typescript' | 'javascript' | 'mixed';
    framework?: string;
    securityLevel: 'normal' | 'hardened' | 'strict';
    testLevel: 'none' | 'basic' | 'standard' | 'high';
    styleGuide?: string;
  };
  acceptanceCriteria?: string[];
  repoContextSnapshot?: string; // Reference/ID
}

/*
 * ==========================================
 * 2. Domain States
 * ==========================================
 */

export interface PlanState {
  tasks: Array<{
    id: string;
    description: string;
    assignedTo: AgentId;
    status: 'pending' | 'in_progress' | 'complete' | 'failed';
  }>;
  acceptanceCriteria: string[];
  constraints: string[];
}

export interface ResearchState {
  techReality?: TechRealityReport;
  competencyMap?: CompetencyMap;
  codebaseAnalysis?: any;
  lastUpdated: string;
}

export interface ArtifactState {
  currentFiles: Record<string, string>; // In-memory snapshot or ref
  patches: PatchSet[];
  bundleUrl?: string;
}

export interface QCState {
  issues: QCIssue[];
  severityCounts: { critical: number; high: number; medium: number; low: number };
  pass: boolean;
  iteration: number;
  maxIterations: number;
}

/*
 * ==========================================
 * 3. Communication: Work Packets
 * ==========================================
 */

export interface WorkPacket {
  packetId: string;
  runId: string;
  stage: StageId;
  toAgent: AgentId;
  objective: string;

  context: {
    repo: { framework: string; packageManager?: string };
    summarySoFar: string;
  };

  inputs: {
    files?: string[]; // Paths only, unless specific content needed
    plan?: PlanState;
    research?: ResearchState;
    qcIssues?: QCIssue[];
  };

  constraints: {
    writeMode: 'patch_only' | 'no_write';
    maxFilesTouched: number;
    mustFollow: string[];
    avoid: string[];
  };

  outputContract: string; // e.g., "ResearchReport.v1"
  stopConditions: {
    askCoordinatorIf: string[];
    haltIf: string[];
  };
}

/*
 * ==========================================
 * 4. Reporting Schemas
 * ==========================================
 */

export interface QCIssue {
  issueId: string;
  stage: 'QC1_SYNTAX_STYLE' | 'QC2_SECURITY_PERF' | 'QC2_COMPLETENESS';
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  lineRange?: { start: number; end: number };
  title: string;
  description: string;
  recommendation: string;
  fixStatus: 'open' | 'fixed' | 'waived';
}

export interface TechRealityReport {
  generatedAt: string;
  stackSummary: string;
  recommendedPins: Array<{ name: string; recommended: string; reason: string }>;
  compatibilityWarnings: Array<{ area: string; description: string; impact: string }>;
  securityAdvisories: Array<{ issue: string; severity: string; recommendation: string }>;
}

export interface CompetencyMap {
  generatedAt: string;
  skills: Array<{ name: string; importance: string; why: string; whatWeWillEnforce: string[] }>;
  standardsAnchors: Array<{ name: string; whyRelevant: string; link: string }>;
  learningResources: Array<{ title: string; link: string; useFor: string }>;
}

export interface PatchSet {
  patchId: string;
  description: string;
  unifiedDiff: string;
  filesTouched: string[];
}

/*
 * ==========================================
 * 5. Event Log (UI Streaming)
 * ==========================================
 */

export interface EventLogEntry {
  eventId: string;
  runId: string;
  timestamp: string;
  type: EventType;
  stage: StageId;
  agent: AgentId;
  summary: string;
  details?: Record<string, any>; // Structured payload for Expert Mode
  visibility: 'user' | 'expert' | 'internal';
}

export type EventType =
  | 'run_started'
  | 'stage_started'
  | 'stage_completed'
  | 'agent_status'
  | 'tool_called'
  | 'artifact_ready'
  | 'patch_applied'
  | 'qc_review'
  | 'qc_issues_found'
  | 'qc_passed'
  | 'qc_failed'
  | 'iteration_started'
  | 'iteration_completed'
  | 'warning'
  | 'error'
  | 'run_completed';
