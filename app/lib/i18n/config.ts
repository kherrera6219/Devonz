import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fallback translations if the application fails to load locale files
const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        retry: 'Retry',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        devonz: 'Devonz',
        ai: 'AI',
        you: 'You',
        user: 'User',
        image: 'Image',
      },
      header: {
        devonz: 'Devonz',
        hide_chat: 'Hide Chat',
        show_chat: 'Show Chat',
      },
      sidebar: {
        start_new_chat: 'Start new chat',
        search_chats: 'Search chats...',
        your_chats: 'Your Chats',
        no_previous_conversations: 'No previous conversations',
        no_matches_found: 'No matches found',
        delete_chat_title: 'Delete Chat?',
        delete_chat_description: 'You are about to delete {{description}}',
        delete_confirmation: 'Are you sure you want to delete this chat?',
      },
      chat: {
        intro_subtitle: 'Build anything with AI. Just describe what you want.',
        go_to_last_message: 'Go to last message',
        terminal_toggle: 'Toggle Terminal',
        sync_files: 'Sync Files',
        syncing: 'Syncing...',
        select_model_title: 'Select AI Model and Provider',
        select_model_desc: 'Choose an AI provider and model for your chat session',
        selected_for_inspection: 'selected for inspection',
        clear: 'Clear',
        ask_build: 'Ask Devonz to build...',
        ask_discuss: 'What would you like to discuss?',
        upload_file: 'Upload file',
        enhance_prompt: 'Enhance prompt',
        prompt_enhanced: 'Prompt enhanced!',
        discuss: 'Discuss',
        select_model: 'Select Model',
        multi_agent: 'Multi-Agent',
        shift_return_new_line: 'Use <kbd>Shift</kbd> + <kbd>Return</kbd> for a new line',
        persistence_unavailable: 'Chat persistence is not available',
        fork_failed: 'Failed to fork chat: {{error}}',
        summary: 'Summary',
        context: 'Context',
        tokens: 'tokens',
        revert: 'Revert to this message',
        fork: 'Fork chat from this message',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
