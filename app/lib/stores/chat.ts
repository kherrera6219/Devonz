import { map } from 'nanostores';
import { createAction } from './middleware';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
  pendingMessage: null as string | null,
});

// Helper to set a pending message that will be picked up by the chat input
export const setPendingChatMessage = createAction('chatStore', 'setPendingChatMessage', (message: string) => {
  chatStore.setKey('pendingMessage', message);
});

// Helper to clear the pending message after it's been consumed
export const clearPendingChatMessage = createAction('chatStore', 'clearPendingChatMessage', () => {
  chatStore.setKey('pendingMessage', null);
});
