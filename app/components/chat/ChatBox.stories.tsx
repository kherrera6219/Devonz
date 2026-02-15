// eslint-disable-next-line storybook/no-renderer-packages
import type { Meta, StoryObj } from '@storybook/react';
import { ChatBox } from './ChatBox';

// import { createRemixStub } from '@remix-run/testing';

const meta = {
  title: 'Features/ChatBox',
  component: ChatBox,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isStreaming: { control: 'boolean' },
    input: { control: 'text' },
  },
} satisfies Meta<typeof ChatBox>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultProps = {
  isModelSettingsCollapsed: false,
  setIsModelSettingsCollapsed: () => {},
  provider: { name: 'OpenAI', staticModels: [], getApiKeyLink: '' },
  providerList: [],
  modelList: [],
  apiKeys: {},
  isModelLoading: undefined,
  onApiKeysChange: () => {},
  uploadedFiles: [],
  imageDataList: [],
  textareaRef: { current: null },
  input: '',
  handlePaste: () => {},
  TEXTAREA_MIN_HEIGHT: 50,
  TEXTAREA_MAX_HEIGHT: 200,
  isStreaming: false,
  handleSendMessage: () => {},
  isListening: false,
  startListening: () => {},
  stopListening: () => {},
  chatStarted: false,
  qrModalOpen: false,
  setQrModalOpen: () => {},
  handleFileUpload: () => {},
};

export const Default: Story = {
  args: {
    ...defaultProps,
  },
};

export const WithInput: Story = {
  args: {
    ...defaultProps,
    input: 'Can you help me build a website?',
  },
};

export const Streaming: Story = {
  args: {
    ...defaultProps,
    input: 'Generating code...',
    isStreaming: true,
    chatStarted: true,
  },
};

export const WithFiles: Story = {
  args: {
    ...defaultProps,
    uploadedFiles: [new File(['content'], 'example.txt', { type: 'text/plain' })],
  },
};
