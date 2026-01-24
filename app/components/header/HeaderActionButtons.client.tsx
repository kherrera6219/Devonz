import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { DeployButton } from '~/components/deploy/DeployButton';
import { HeaderAvatar } from './HeaderAvatar.client';
import { AutoFixStatus } from './AutoFixStatus.client';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const currentView = useStore(workbenchStore.currentView);
  const activePreview = previews[activePreviewIndex];

  const shouldShowButtons = activePreview;

  const handleVersionsClick = () => {
    // Toggle between versions and code view
    if (currentView === 'versions') {
      workbenchStore.currentView.set('code');
    } else {
      workbenchStore.currentView.set('versions');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Auto-Fix Status Indicator */}
      <AutoFixStatus />

      {/* Versions Button */}
      {shouldShowButtons && (
        <button
          onClick={handleVersionsClick}
          className={`rounded-md items-center justify-center px-3 py-1.5 text-xs bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-4 hover:text-accent-400 outline-accent-500 flex gap-1.5 transition-colors ${currentView === 'versions' ? 'text-accent-400 border-accent-500/50' : ''
            }`}
        >
          <div className="i-ph:clock-counter-clockwise" />
          Versions
        </button>
      )}

      {/* Deploy Button */}
      {shouldShowButtons && <DeployButton />}

      {/* Avatar */}
      <HeaderAvatar />
    </div>
  );
}
