
import { ChatAnthropic } from '@langchain/anthropic';
import type { BoltState, AgentMessage } from '~/lib/agent-orchestrator/state/types';
import { MessageFactory } from '~/lib/agent-orchestrator/utils/message-factory';
import { PromptTemplate } from '@langchain/core/prompts';
import { BaseAgent } from '~/lib/agent-orchestrator/agents/base';

export class ArchitectAgent extends BaseAgent {
  protected name = 'architect';
  private model: ChatAnthropic;

  constructor() {
    super();
    this.model = new ChatAnthropic({
      modelName: 'claude-4-opus', // Using latest requested opus model
      temperature: 0.5,
      maxTokens: 4096,
    });
  }

  async run(state: BoltState): Promise<Partial<BoltState>> {
    try {
        const lastMsg = state.agentMessages.find(m => m.to === 'architect' && m.type === 'ARCHITECT_SPECS');

        if (state.status === 'architecting' && lastMsg) {
            return await this.generateCode(state);
        }
    } catch (error: any) {
        return this.createErrorState(state, error);
    }

    return {};
  }

  private async generateCode(state: BoltState): Promise<Partial<BoltState>> {
    const specs = state.specifications;
    const findings = state.researchFindings;

    const prompt = PromptTemplate.fromTemplate(
      `You are the Architect Agent (Claude). Generate production-ready code.

      Specs: {specs}

      Research Findings: {findings}

      Competency Standards to Enforce:
      {standards}

      Generate a JSON object containing the file structure and content.
      Format:
      {{
        "files": [
          {{ "path": "path/to/file", "content": "..." }}
        ],
        "docs": []
      }}
      `
    );

    const chain = prompt.pipe(this.model);

    // Invoke LLM safely with retries
    const response = await this.safeInvoke<any>(chain, {
        specs: JSON.stringify(specs),
        findings: JSON.stringify(findings),
        standards: JSON.stringify(findings?.projectCompetencyMap?.standards || [])
    });

    // Helper to extract JSON from markdown block
    const content = response.content.toString();
    const jsonBlock = content.match(/```json\n([\s\S]*?)\n```/)?.[1] || content;

    let artifacts;
    try {
        artifacts = JSON.parse(jsonBlock);
    } catch (e) {
        console.error("Failed to parse Architect output", e);
        // Fallback or re-throw? For architect, structural failure is critical.
        throw new Error("Architect failed to produce valid JSON artifacts.");
    }

    return {
        status: 'qc',
        generatedArtifacts: artifacts,
        agentMessages: [
            ...state.agentMessages,
            MessageFactory.create('architect', 'coordinator', 'CODE_GENERATION_COMPLETE', artifacts)
        ]
    };
  }
}
