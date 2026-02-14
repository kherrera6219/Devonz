import type { Preview } from '@storybook/react-vite'

import '@unocss/reset/tailwind-compat.css';
import 'react-toastify/dist/ReactToastify.css';
import '../app/styles/index.scss';
import '../app/styles/liquid-metal.css';
import '@xterm/xterm/css/xterm.css';
import 'virtual:uno.css';

import { I18nextProvider } from 'react-i18next';
import i18n from '../app/lib/i18n/config';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;
