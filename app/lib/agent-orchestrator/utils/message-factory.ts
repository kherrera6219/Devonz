
import { v4 as uuidv4 } from 'uuid';
import type { AgentMessage } from '../state/types';

export class MessageFactory {
  static create(
    from: AgentMessage['from'],
    to: AgentMessage['to'],
    type: string,
    payload: any,
    context?: any,
    options: Partial<AgentMessage> = {}
  ): AgentMessage {
    return {
      id: uuidv4(),
      from,
      to,
      type,
      priority: options.priority || 'normal',
      payload,
      context: context || {},
      timestamp: Date.now(),
      requiresResponse: options.requiresResponse ?? true,
      correlationId: options.correlationId,
      metadata: options.metadata,
    };
  }

  static task(to: AgentMessage['to'], task: string, payload: any, correlationId?: string): AgentMessage {
    return this.create('coordinator', to, 'TASK_ASSIGNMENT', { task, ...payload }, {}, { correlationId });
  }

  static researchRequest(query: string, context: any, correlationId?: string): AgentMessage {
    return this.create('coordinator', 'researcher', 'RESEARCH_REQUEST', { query }, context, { correlationId });
  }

  static result(from: AgentMessage['from'], type: string, payload: any, correlationId?: string): AgentMessage {
    return this.create(from, 'coordinator', type, payload, {}, { correlationId, requiresResponse: false });
  }

  static text(from: AgentMessage['from'], to: AgentMessage['to'], text: string): AgentMessage {
      return this.create(from, to, 'TEXT_MESSAGE', { text }, {}, { requiresResponse: false });
  }
}
