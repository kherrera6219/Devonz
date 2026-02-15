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

/*
export const Default: Story = {
  args: {
    isStreaming: false,
    input: '',
    messages: [],
  },
  decorators: [
    (Story) => {
      const RemixStub = createRemixStub([
        {
          path: '/',
          Component: Story,
        },
      ]);
      return <RemixStub />;
    },
  ],
  setIsModelSettingsCollapsed: () => {},
  provider: { name: 'OpenAI', staticModels: [], getApiKeyLink: 'https://platform.openai.com/account/api-keys' },
  providerList: [
    { name: 'OpenAI', staticModels: [], getApiKeyLink: '' },
    { name: 'Anthropic', staticModels: [], getApiKeyLink: '' },
  ],
  modelList: [{ name: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', maxTokenAllowed: 8192 }],
  apiKeys: {},
  isModelLoading: undefined,
  onApiKeysChange: () => {},
  uploadedFiles: [],
  imageDataList: [],
  textareaRef: { current: null },
  input: '',
  handlePaste: () => {},
  TEXTAREA_MIN_HEIGHT: 76,
  TEXTAREA_MAX_HEIGHT: 200,
  isStreaming: false,
  handleSendMessage: (e: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    alert('Send Message');
  },
  isListening: false,
  startListening: () => {},
  stopListening: () => {},
  chatStarted: false,
  qrModalOpen: false,
  setQrModalOpen: () => {},
  handleFileUpload: () => {},
  handleInputChange: () => {},
  setUploadedFiles: () => {},
  setImageDataList: () => {},
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
