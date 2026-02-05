import { BaseMessage } from '@langchain/core/messages';

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
  status: 'idle' | 'planning' | 'researching' | 'architecting' | 'qc' | 'complete' | 'error';
  error?: GraphError | string;
}
