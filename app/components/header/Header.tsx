import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { sidebarStore } from '~/lib/stores/sidebar';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { t } = useTranslation();
  const chat = useStore(chatStore);
  const sidebarOpen = useStore(sidebarStore.open);
  const showChat = chat.showChat;

  return (
    <header
      className={classNames('flex items-center px-5 border-b h-[var(--header-height)] bg-transparent', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-3 z-logo text-bolt-elements-textPrimary cursor-pointer">
        {!sidebarOpen && (
          <div
            className="i-ph:sidebar-simple text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            onClick={() => sidebarStore.toggle()}
            title={sidebarOpen ? '' : t('header.show_sidebar', 'Show Sidebar')}
          />
        )}
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textSecondary text-sm">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-3">
                <div
                  className={classNames(
                    'text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors cursor-pointer',
                    {
                      'i-ph:chat-circle-dots-fill': showChat,
                      'i-ph:chat-circle-dots': !showChat,
                    },
                  )}
                  onClick={() => {
                    chatStore.setKey('showChat', !showChat);
                  }}
                  title={showChat ? t('header.hide_chat', 'Hide Chat') : t('header.show_chat', 'Show Chat')}
                />
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
