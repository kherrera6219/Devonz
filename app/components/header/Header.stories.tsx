import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';
import { createRemixStub } from '@remix-run/testing';
import { chatStore } from '~/lib/stores/chat';
import { sidebarStore } from '~/lib/stores/sidebar';

const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
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
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    // Reset stores
    chatStore.setKey('started', true);
    chatStore.setKey('showChat', true);
    sidebarStore.setKey('open', false);
    return <Header />;
  },
};

export const SidebarOpen: Story = {
  render: () => {
    chatStore.setKey('started', true);
    sidebarStore.setKey('open', true);
    return <Header />;
  },
};

export const ChatHidden: Story = {
  render: () => {
    chatStore.setKey('started', true);
    chatStore.setKey('showChat', false);
    return <Header />;
  },
};

export const NotStarted: Story = {
  render: () => {
    chatStore.setKey('started', false);
    return <Header />;
  },
};
