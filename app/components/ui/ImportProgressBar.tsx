import React from 'react';
import { useStore } from '@nanostores/react';
import { importStore } from '~/lib/stores/importStore';
import { Progress } from './Progress';
import { classNames } from '~/utils/classNames';

export const ImportProgressBar: React.FC = () => {
  const { status, progress, currentFile, totalFiles, error, folderName } = useStore(importStore);

  if (status === 'idle') {
    return null;
  }

  const getStatusText = () => {
    switch (status) {
      case 'scanning':
        return 'Scanning files...';
      case 'storing':
        return `Storing files in MinIO... (${currentFile})`;
      case 'indexing':
        return `Indexing for RAG... (${currentFile})`;
      case 'syncing':
        return 'Syncing to workspace...';
      case 'complete':
        return 'Import complete!';
      case 'error':
        return `Error: ${error}`;
      default:
        return '';
    }
  };

  const isError = status === 'error';
  const isComplete = status === 'complete';

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg p-4 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-bolt-elements-textPrimary truncate">
            {folderName ? `Importing ${folderName}` : 'Project Import'}
          </span>
          {isComplete && <div className="i-ph:check-circle-fill text-green-500" />}
          {isError && <div className="i-ph:x-circle-fill text-red-500" />}
        </div>

        <Progress
          value={progress}
          className={classNames('h-1.5', {
            'bg-red-500/20': isError,
            'bg-green-500/20': isComplete,
          })}
        />

        <div className="flex flex-col gap-1">
          <span
            className={classNames('text-xs truncate', {
              'text-red-500': isError,
              'text-green-500': isComplete,
              'text-bolt-elements-textTertiary': !isError && !isComplete,
            })}
          >
            {getStatusText()}
          </span>
          {totalFiles > 0 && status !== 'complete' && status !== 'error' && (
            <span className="text-[10px] text-bolt-elements-textTertiary self-end">{progress.toFixed(0)}%</span>
          )}
        </div>

        {isComplete && (
          <button
            onClick={() => importStore.setKey('status', 'idle')}
            className="mt-1 text-xs text-bolt-elements-item-contentAccent hover:underline self-end"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
