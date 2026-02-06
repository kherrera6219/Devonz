import type { BaseMessage } from '@langchain/core/messages';

export interface AgentMessage {
  id: string;
  from: 'coordinator' | 'researcher' | 'architect' | 'qc' | 'user';
  to: 'coordinator' | 'researcher' | 'architect' | 'qc' | 'user';
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  payload: any;
  context: any;
  timestamp: number;
  requiresResponse: boolean;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface GraphError {
  message: string;
  agent: string;
  timestamp: number;
  stack?: string;
}

export interface BoltState {
  // Communication
  messages: BaseMessage[];
  agentMessages: AgentMessage[];
  apiKeys?: Record<string, string>;
  thought?: string;
  response?: string;
  currentAction?: { type: string; description: string };
  plan?: string[];

  // Context
  userRequest: string;
  conversationId: string;

  // Research Phase
  researchQuery?: string;
  researchFindings?: {
    techStack: Record<string, string>;
    securityAdvisories: any[];
    compatibilityIssues: any[];
    projectCompetencyMap: {
      domains: any[];
      skills: any[];
      standards: any[];
      resources: any[];
    };
  };

  // Architecture Phase
  specifications?: any;
  generatedArtifacts?: {
    files: Array<{
      path: string;
      content: string;
      language: string;
      description?: string;
    }>;
    diffs?: any[];
    docs?: any[];
  };

  // QC Phase
  qcStage?: 'structural' | 'security' | 'refinement' | 'polish';
  qcFindings?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    description: string;
    suggestion?: string;
  }>;
  qcIteration: number;
  maxQcIterations: number;

  // Workflow Status
  status:
    | 'idle'
    | 'planning'
    | 'awaiting_clarification'
    | 'researching'
    | 'architecting'
    | 'qc'
    | 'fixing'
    | 'complete'
    | 'delivered'
    | 'error';
  progressStage?: 'Understanding Request' | 'Research' | 'Build' | 'QC' | 'Fix' | 'Final';
  acceptanceCriteria?: string[];
  error?: GraphError | string;

  // Reflection Phase
  reflectionFeedback?: string;
  reflectionScore?: number;
  planReflection?: string;
  needsReplan?: boolean;
  replanSuggestion?: string;
  iterationCount?: number;
}
