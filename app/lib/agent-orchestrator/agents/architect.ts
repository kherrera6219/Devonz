import { ChatAnthropic } from '@langchain/anthropic';
import type { RunState, PatchSet, EventLogEntry, ResearchState } from '~/lib/agent-orchestrator/types/mas-schemas';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { safeInvoke, createErrorState } from '~/lib/agent-orchestrator/utils/agent-utils';
import { executeAgentTool } from '~/lib/services/agentToolsService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('architect-agent');

/**
 * Architect Agent (Internal)
 *
 * RESPONSIBILITIES:
 * - Implement tasks from PlanState
 * - Apply Research context
 * - Generate PatchSets (Unified Diff)
 */
export class ArchitectAgent {
  private readonly _name = 'architect';
  private _model: ChatAnthropic | null = null;
  private readonly _modelName = 'claude-opus-4-6-20260205';

  private _ensureModel(state: RunState) {
    if (this._model) {
      return;
    }

    const apiKey = state.status?.activeAgents?.find((a) => a.agentId === 'architect')
      ? process.env.ANTHROPIC_API_KEY
      : process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

    this._model = new ChatAnthropic({
      modelName: this._modelName,
      temperature: 0.5,
      maxTokens: 4096,
      anthropicApiKey: apiKey,
    });
  }

  /**
   * Main entry point
   */
  /**
   * Main entry point for the Architect Agent.
   * Identifies pending tasks and generates/applies patches to implement them.
   *
   * @param state The current run state.
   * @returns A partial state containing updated tasks, patches, and event logs.
   */
  async run(state: RunState): Promise<Partial<RunState>> {
    try {
      this._ensureModel(state);

      // 1. Identify Work
      const pendingTasks =
        state.plan?.tasks.filter((t) => t.assignedTo === 'architect' && t.status === 'pending') || [];

      if (pendingTasks.length === 0) {
        return {
          events: [
            {
              eventId: crypto.randomUUID(),
              runId: state.runId,
              timestamp: new Date().toISOString(),
              type: 'agent_status',
              stage: 'ARCH_BUILD',
              agent: 'architect',
              summary: 'No pending tasks found for architect',
              visibility: 'internal',
            },
          ],
        };
      }

      // 2. Prepare Context
      const researchContext = state.research || ({} as ResearchState);
      const tasksDescription = pendingTasks.map((t) => `- ${t.description} (ID: ${t.id})`).join('\n');
      const constraints = JSON.stringify(state.plan?.constraints || []);

      // 3. Generate Patches
      return await this._generatePatches(state, tasksDescription, researchContext, constraints, pendingTasks);
    } catch (error) {
      return createErrorState(this._name, state, error as Error);
    }
  }

  private async _generatePatches(
    state: RunState,
    tasks: string,
    research: ResearchState,
    constraints: string,
    pendingTasks: { id: string }[],
  ): Promise<Partial<RunState>> {
    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(
      `You are the Architect Agent (Claude).

      GOAL: Implement the following tasks by generating FILE PATCHES.

      Tasks:
      {tasks}

      Research Context:
      {research}

      Constraints:
      {constraints}

      Generate a JSON object containing a list of PATCHES.
      Use standard Unified Diff format for content change.

      Respond with JSON matching this schema:
      {{
        "patches": [
          {{
            "patchId": "uuid",
            "description": "Implementation of task X",
            "filesTouched": ["path/to/file.ts"],
            "unifiedDiff": "diff --git a/path/to/file.ts b/path/to/file.ts\\n..."
          }}
        ],
        "summary": "Brief explanation of changes"
      }}

      {format_instructions}`,
    );

    const chain = prompt.pipe(this._model!).pipe(parser);
    const result = (await safeInvoke(this._name, chain, {
      tasks,
      research: JSON.stringify(research),
      constraints,
      format_instructions: parser.getFormatInstructions(),
    })) as { patches: PatchSet[]; summary: string };

    // 4. Materialize Patches to Filesystem
    const appliedResults = await Promise.all(
      result.patches.map(async (patch) => {
        logger.info(`Materializing patch for ${patch.filesTouched.join(', ')}`);

        // Architect assumes first file is the primary target for the unified diff
        const targetPath = patch.filesTouched[0];

        if (!targetPath) {
          return { path: 'unknown', success: false, error: 'No target path in patch' };
        }

        return await executeAgentTool('devonz_apply_patch', {
          path: targetPath,
          patch: patch.unifiedDiff,
        });
      }),
    );

    const successfulPatches = appliedResults.filter((r) => r.success);
    const failedPatches = appliedResults.filter((r) => !r.success);

    // 5. Construct Updates
    const newEvents: EventLogEntry[] = [
      {
        eventId: crypto.randomUUID(),
        runId: state.runId,
        timestamp: new Date().toISOString(),
        type: 'patch_applied',
        stage: 'ARCH_BUILD',
        agent: 'architect',
        summary: `${result.summary} (${successfulPatches.length} applied, ${failedPatches.length} failed)`,
        visibility: 'user',
        details: {
          patchCount: result.patches.length,
          appliedCount: successfulPatches.length,
          failedCount: failedPatches.length,
          errors: failedPatches.map((f) => f.error),
        },
      },
    ];

    // Mark tasks as complete
    const updatedTasks = state.plan!.tasks.map((t) => {
      if (pendingTasks.find((pt) => pt.id === t.id)) {
        return { ...t, status: 'completed' as const };
      }

      return t;
    });

    return {
      artifacts: {
        currentFiles: {
          /* In real system, would reflect fs */
        },
        patches: [...(state.artifacts?.patches || []), ...result.patches],
      },
      plan: {
        ...state.plan!,
        tasks: updatedTasks,
      },
      events: newEvents,
      status: {
        ...state.status,
        stage: 'QC1_SYNTAX_STYLE',
        stageState: 'queued',
        progress: {
          percent: 100,
          label: 'Architecture Complete',
          iteration: state.status?.progress?.iteration || 0,
        },
        activeAgents:
          state.status?.activeAgents?.map((a) => (a.agentId === 'architect' ? { ...a, status: 'done' } : a)) || [],
      },
    } as Partial<RunState>;
  }
}
