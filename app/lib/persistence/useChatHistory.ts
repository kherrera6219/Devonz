import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect, useCallback } from 'react';
import { atom } from 'nanostores';
import { type JSONValue, type Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { versionsStore } from '~/lib/stores/versions';
import { logStore } from '~/lib/stores/logs'; // Import logStore
import {
  getMessages,
  getNextId,
  getUrlId,
  openDatabase,
  setMessages,
  duplicateChat,
  createChatFromMessages,
  getSnapshot,
  setSnapshot,
  type IChatMetadata,
} from './db';
import type { FileMap } from '~/lib/stores/files';
import type { Snapshot } from './types';
import { webcontainer } from '~/lib/webcontainer';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: IChatMetadata;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

export const dbStore = atom<IDBDatabase | undefined>(undefined);

export let db: IDBDatabase | undefined;

dbStore.subscribe((value) => {
  db = value;
});

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<IChatMetadata | undefined>(undefined);
export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  useEffect(() => {
    const initializeDb = async () => {
      if (!persistenceEnabled) {
        setReady(true);
        return;
      }

      let currentDb = dbStore.get();

      if (!currentDb) {
        try {
          currentDb = await openDatabase();

          if (currentDb) {
            dbStore.set(currentDb);
          }
        } catch (error) {
          console.error('Failed to open database:', error);
          logStore.logError('Chat persistence initialization failed', error as Error);
          toast.error('Chat persistence is unavailable');
          setReady(true);

          return;
        }
      }

      if (!currentDb) {
        setReady(true);
        return;
      }

      if (mixedId) {
        try {
          // First get messages to find the actual internal chatId, then get snapshot with correct ID
          const storedMessages = await getMessages(currentDb, mixedId);

          if (!storedMessages || storedMessages.messages.length === 0) {
            navigate('/', { replace: true });
            setReady(true);

            return;
          }

          const internalChatId = storedMessages.id;
          const snapshot = await getSnapshot(currentDb, internalChatId);
          const validSnapshot = snapshot || { chatIndex: '', files: {} };

          const rewindId = searchParams.get('rewindTo');
          let filteredMessages = storedMessages.messages;

          if (rewindId) {
            const endingIdx = storedMessages.messages.findIndex((m) => m.id === rewindId) + 1;

            if (endingIdx > 0) {
              filteredMessages = storedMessages.messages.slice(0, endingIdx);

              await setMessages(
                currentDb,
                internalChatId,
                filteredMessages,
                storedMessages.urlId,
                storedMessages.description,
                undefined,
                storedMessages.metadata,
              );

              await setSnapshot(currentDb, internalChatId, { chatIndex: rewindId, files: {} });

              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('rewindTo');
              window.history.replaceState({}, '', newUrl);
            }
          }

          setArchivedMessages([]);

          if (validSnapshot?.files && Object.keys(validSnapshot.files).length > 0) {
            workbenchStore.isRestoringSession.set(true);
            restoreSnapshot(mixedId, validSnapshot);
          }

          setInitialMessages(filteredMessages);
          setUrlId(storedMessages.urlId);
          description.set(storedMessages.description);
          chatId.set(storedMessages.id);
          chatMetadata.set(storedMessages.metadata);
          versionsStore.syncFromMessages(filteredMessages);
        } catch (error) {
          console.error(error);
          logStore.logError('Failed to load chat messages or snapshot', error as Error);
          toast.error('Failed to load chat: ' + (error as any).message);
        } finally {
          setReady(true);
        }
      } else {
        setReady(true);
      }
    };

    initializeDb();
  }, [mixedId, navigate, searchParams]);

  const takeSnapshot = useCallback(
    async (chatIdx: string, files: FileMap, _chatId?: string | undefined, chatSummary?: string) => {
      const id = chatId.get();
      const currentDb = dbStore.get();

      if (!id || !currentDb) {
        return;
      }

      const snapshot: Snapshot = {
        chatIndex: chatIdx,
        files,
        summary: chatSummary,
      };

      try {
        await setSnapshot(currentDb, id, snapshot);
      } catch (error) {
        console.error('Failed to save snapshot:', error);
        toast.error('Failed to save chat snapshot.');
      }
    },
    [],
  );

  const restoreSnapshot = useCallback(async (id: string, snapshot?: Snapshot) => {
    const container = await webcontainer;

    const validSnapshot = snapshot || { chatIndex: '', files: {} };

    if (!validSnapshot?.files || Object.keys(validSnapshot.files).length === 0) {
      return;
    }

    // Set the restoring flag BEFORE any file operations
    workbenchStore.isRestoringSession.set(true);

    // Sync files directly to workbench store for instant UI update
    const currentFiles = workbenchStore.files.get();
    const mergedFiles = { ...currentFiles, ...validSnapshot.files };
    workbenchStore.files.set(mergedFiles);
    workbenchStore.setDocuments(mergedFiles);

    // Write files to WebContainer in parallel (for runtime)
    const dirPromises: Promise<string>[] = [];
    const filePromises: Promise<void>[] = [];

    Object.entries(validSnapshot.files).forEach(([key, value]) => {
      let adjustedKey = key;

      if (adjustedKey.startsWith(container.workdir)) {
        adjustedKey = adjustedKey.replace(container.workdir, '');
      }

      if (value?.type === 'folder') {
        dirPromises.push(container.fs.mkdir(adjustedKey, { recursive: true }));
      } else if (value?.type === 'file') {
        filePromises.push(
          container.fs.writeFile(adjustedKey, value.content, { encoding: value.isBinary ? undefined : 'utf8' }),
        );
      }
    });

    // Create dirs first, then files
    await Promise.all(dirPromises);
    await Promise.all(filePromises);
  }, []);

  return {
    ready: !mixedId || ready,
    initialMessages,
    updateChatMestaData: async (metadata: IChatMetadata) => {
      const id = chatId.get();
      const currentDb = dbStore.get();

      if (!currentDb || !id) {
        return;
      }

      try {
        await setMessages(currentDb, id, initialMessages, urlId, description.get(), undefined, metadata);
        chatMetadata.set(metadata);
      } catch (error) {
        toast.error('Failed to update chat metadata');
        console.error(error);
      }
    },
    storeMessageHistory: async (messages: Message[]) => {
      const currentDb = dbStore.get();

      if (!currentDb || messages.length === 0) {
        return;
      }

      const { firstArtifact } = workbenchStore;
      messages = messages.filter((m) => !m.annotations?.includes('no-store'));

      let _urlId = urlId;

      if (!urlId && firstArtifact?.id) {
        const urlId = await getUrlId(currentDb, firstArtifact.id);
        _urlId = urlId;
        navigateChat(urlId);
        setUrlId(urlId);
      }

      let chatSummary: string | undefined = undefined;
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === 'assistant') {
        const annotations = lastMessage.annotations as JSONValue[];
        const filteredAnnotations = (annotations?.filter(
          (annotation: JSONValue) =>
            annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
        ) || []) as { type: string; value: any } & { [key: string]: any }[];

        if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
          chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
        }
      }

      takeSnapshot(messages[messages.length - 1].id, workbenchStore.files.get(), _urlId, chatSummary);

      if (!description.get() && firstArtifact?.title) {
        description.set(firstArtifact?.title);
      }

      if (initialMessages.length === 0 && !chatId.get()) {
        const nextId = await getNextId(currentDb);

        chatId.set(nextId);

        if (!urlId) {
          navigateChat(nextId);
        }
      }

      // Ensure chatId.get() is used for the final setMessages call
      const finalChatId = chatId.get();

      if (!finalChatId) {
        console.error('Cannot save messages, chat ID is not set.');
        toast.error('Failed to save chat messages: Chat ID missing.');

        return;
      }

      await setMessages(
        currentDb,
        finalChatId, // Use the potentially updated chatId
        [...archivedMessages, ...messages],
        urlId,
        description.get(),
        undefined,
        chatMetadata.get(),
      );
    },
    duplicateCurrentChat: async (listItemId: string) => {
      const currentDb = dbStore.get();

      if (!currentDb || (!mixedId && !listItemId)) {
        return;
      }

      try {
        const newId = await duplicateChat(currentDb, mixedId || listItemId);
        navigate(`/chat/${newId}`);
        toast.success('Chat duplicated successfully');
      } catch (error) {
        toast.error('Failed to duplicate chat');
        console.log(error);
      }
    },
    importChat: async (description: string, messages: Message[], metadata?: IChatMetadata) => {
      const currentDb = dbStore.get();

      if (!currentDb) {
        return;
      }

      try {
        const newId = await createChatFromMessages(currentDb, description, messages, metadata);
        window.location.href = `/chat/${newId}`;
        toast.success('Chat imported successfully');
      } catch (error) {
        if (error instanceof Error) {
          toast.error('Failed to import chat: ' + error.message);
        } else {
          toast.error('Failed to import chat');
        }
      }
    },
    exportChat: async (id = urlId) => {
      const currentDb = dbStore.get();

      if (!currentDb || !id) {
        return;
      }

      const chat = await getMessages(currentDb, id);
      const chatData = {
        messages: chat.messages,
        description: chat.description,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
}

function navigateChat(nextId: string) {
  /**
   * FIXME: Using the intended navigate function causes a rerender for <Chat /> that breaks the app.
   *
   * `navigate(`/chat/${nextId}`, { replace: true });`
   */
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  window.history.replaceState({}, '', url);
}
