import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
  artifactId: string;
}

export const Artifact = memo(({ artifactId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[artifactId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      // Filter out Supabase actions except for migrations
      return Object.values(actions).filter((action) => {
        // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
        return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
      });
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find(
        (action) => action.status !== 'complete' && !(action.type === 'start' && action.status === 'running'),
      );

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions, artifact.type, allActionFinished]);

  // Determine the dynamic title based on state for bundled artifacts
  const dynamicTitle =
    artifact?.type === 'bundled'
      ? allActionFinished
        ? artifact.id === 'restored-project-setup'
          ? 'Project Restored' // Title when restore is complete
          : 'Project Created' // Title when initial creation is complete
        : artifact.id === 'restored-project-setup'
          ? 'Restoring Project...' // Title during restore
          : 'Creating Project...' // Title during initial creation
      : artifact?.title; // Fallback to original title for non-bundled or if artifact is missing

  return (
    <>
      <div
        className="artifact border border-white/10 flex flex-col overflow-hidden rounded-xl w-full transition-all duration-150"
        style={{ background: 'linear-gradient(180deg, #1a2332 0%, #131a24 100%)' }}
      >
        {/* Header - Glossy dark style */}
        <button
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/5 transition-colors"
          onClick={toggleActions}
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="i-ph:wrench-duotone text-blue-400 text-lg" />
            <span className="text-sm text-white/90">
              Used tools {actions.length > 0 && <span className="text-white/50">{actions.length} times</span>}
            </span>
          </div>
          <div
            className={classNames('transition-transform duration-200 text-white/40', showActions ? 'rotate-180' : '')}
          >
            <div className="i-ph:caret-down" />
          </div>
        </button>

        {/* Collapsible Actions List */}
        <AnimatePresence>
          {showActions && actions.length > 0 && (
            <motion.div
              className="actions"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: cubicEasingFn }}
            >
              {/* To-dos header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-t border-white/8"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="i-ph:list-checks text-white/40 text-sm" />
                  <span className="text-xs text-white/60">To-dos</span>
                </div>
                <span className="text-xs text-white/40">
                  {actions.filter((a) => a.status === 'complete').length} of {actions.length} Done
                </span>
              </div>

              {/* Action list */}
              <div className="px-4 py-3" style={{ background: 'rgba(0,0,0,0.1)' }}>
                <ActionList actions={actions} />
              </div>

              {/* Workbench button */}
              <button
                className="flex items-center gap-3 w-full px-4 py-3 border-t border-white/8 hover:bg-white/5 transition-colors group"
                onClick={() => {
                  const showWorkbench = workbenchStore.showWorkbench.get();
                  workbenchStore.showWorkbench.set(!showWorkbench);
                }}
                style={{ background: 'rgba(0,0,0,0.15)' }}
              >
                <div className="i-ph:code-duotone text-blue-400 text-lg" />
                <div className="flex-1 text-left">
                  <div className="text-sm text-white/90">{dynamicTitle}</div>
                  <div className="text-xs text-white/50">Click to open Workbench</div>
                </div>
                <div className="i-ph:pencil-simple text-white/40 group-hover:text-white/70 transition-colors" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bundled artifact status */}
        {artifact.type === 'bundled' && (
          <div className="flex items-center gap-2.5 px-4 py-3 border-t border-white/8">
            <div className={classNames('text-lg', getIconColor(allActionFinished ? 'complete' : 'running'))}>
              {allActionFinished ? (
                <div className="i-ph:check-circle-fill"></div>
              ) : (
                <div className="i-svg-spinners:90-ring-with-bg"></div>
              )}
            </div>
            <div className="text-white/90 text-sm">
              {allActionFinished
                ? artifact.id === 'restored-project-setup'
                  ? 'Restore files from snapshot'
                  : 'Initial files created'
                : 'Creating initial files'}
            </div>
          </div>
        )}
      </div>
    </>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: shellHighlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <div className="space-y-1">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isComplete = status === 'complete';
          const isRunning = status === 'running';
          const isFailed = status === 'failed' || status === 'aborted';
          const isExpanded = expandedIndex === index;

          // Determine action label and file info
          let actionLabel = '';
          let fileName = '';

          if (type === 'file') {
            actionLabel = 'Create';
            fileName = action.filePath || '';
          } else if (type === 'shell') {
            actionLabel = 'Run command';
          } else if (type === 'start') {
            actionLabel = 'Start Application';
          }

          return (
            <motion.div
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.2, ease: cubicEasingFn }}
            >
              {/* Action Card - compact, no background */}
              <button
                onClick={() => {
                  if (type === 'file') {
                    openArtifactInWorkbench(action.filePath);
                  } else if (content) {
                    setExpandedIndex(isExpanded ? null : index);
                  }
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                style={{ background: 'transparent' }}
              >
                {/* Smaller circular outlined checkmark */}
                <div
                  className={classNames(
                    'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                    isComplete
                      ? 'border border-green-500/80 text-green-500'
                      : isRunning
                        ? 'border border-blue-400/80'
                        : isFailed
                          ? 'border border-red-500/80 text-red-500'
                          : 'border border-white/30',
                  )}
                >
                  {isComplete ? (
                    <div className="i-ph:check" style={{ fontSize: '10px' }} />
                  ) : isRunning ? (
                    <div className="i-svg-spinners:ring-resize text-blue-400" style={{ fontSize: '10px' }} />
                  ) : isFailed ? (
                    <div className="i-ph:x" style={{ fontSize: '10px' }} />
                  ) : null}
                </div>

                {/* Action label - smaller */}
                <span className="text-xs text-white/60">{actionLabel}</span>

                {/* File badge - darker, smaller */}
                {type === 'file' && fileName && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-mono truncate max-w-[180px] text-white/80"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    {fileName}
                  </span>
                )}

                {/* Expand arrow for shell commands */}
                {(type === 'shell' || type === 'start') && content && (
                  <div
                    className={classNames(
                      'ml-auto transition-transform duration-200 text-white/40',
                      isExpanded ? 'rotate-180' : '',
                    )}
                  >
                    <div className="i-ph:caret-down" style={{ fontSize: '10px' }} />
                  </div>
                )}
              </button>

              {/* Expandable content */}
              <AnimatePresence>
                {isExpanded && content && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-8"
                  >
                    <div className="py-2">
                      <ShellCodeBlock classsName="opacity-80" code={content} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
