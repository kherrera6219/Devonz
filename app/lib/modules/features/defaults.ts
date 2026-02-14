export interface FeatureConfig {
  id: string;
  enabled: boolean;
  description: string;
}

export const DEFAULT_FEATURES: Record<string, FeatureConfig> = {
  'experimental-code-search': {
    id: 'experimental-code-search',
    enabled: false,
    description: 'Enable semantic code search (experimental)',
  },
  'new-settings-ui': {
    id: 'new-settings-ui',
    enabled: true,
    description: 'Use the new settings interface',
  },
  'voice-input': {
    id: 'voice-input',
    enabled: true,
    description: 'Enable voice input for chat',
  },
  'multi-agent-orchestrator': {
    id: 'multi-agent-orchestrator',
    enabled: false,
    description: 'Enable multi-agent orchestration capabilities',
  },
};

export type FeatureKey = keyof typeof DEFAULT_FEATURES;
