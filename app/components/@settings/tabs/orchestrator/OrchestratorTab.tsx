import React from 'react';
import { Switch } from '~/components/ui/Switch';
import { classNames } from '~/utils/classNames';

import { useSettings } from '~/lib/hooks/useSettings';

export default function OrchestratorTab() {
  const { orchestratorSettings: settings, updateOrchestratorSettings: updateSetting } = useSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="space-y-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Enable Agent Orchestration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Activate the 3-agent system (Coordinator, Researcher, Architect) for complex tasks.
          </p>
        </div>
        <Switch checked={settings.enabled} onCheckedChange={(checked) => updateSetting({ enabled: checked })} />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Orchestration Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['fast', 'hardened', 'security-strict'].map((mode) => (
            <div
              key={mode}
              className={classNames(
                'cursor-pointer border rounded-lg p-4 transition-all',
                settings.mode === mode
                  ? 'border-purple-500 bg-purple-50/10 ring-1 ring-purple-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-400',
              )}
              onClick={() => updateSetting({ mode: mode as 'fast' | 'hardened' | 'security-strict' })}
            >
              <div className="font-medium capitalize mb-1">{mode.replace('-', ' ')}</div>
              <div className="text-xs text-gray-500">
                {mode === 'fast' && 'Optimized for speed. Minimal QC loops.'}
                {mode === 'hardened' && 'Standard QC. Best for production code.'}
                {mode === 'security-strict' && 'Paranoid QC. Multiple security audits.'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Agent Models</h3>

        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-sm text-gray-600 dark:text-gray-400">Coordinator Agent</label>
            <div className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {settings.coordinatorModel} (Fixed)
            </div>
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-sm text-gray-600 dark:text-gray-400">Researcher Agent</label>
            <div className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {settings.researcherModel} (Fixed)
            </div>
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
            <label className="text-sm text-gray-600 dark:text-gray-400">Architect Agent</label>
            <div className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {settings.architectModel} (Fixed)
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 italic">
          * Model selection customization coming in future updates. Currently locked to optimal models per role.
        </p>
      </div>
    </div>
  );
}
