import type { Meta, StoryObj } from '@storybook/react-vite';
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
    (storyComponent: any) => {
      const RemixStub = createRemixStub([
        {
          path: '/',
          Component: storyComponent,
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
    sidebarStore.setOpen(false);

    return <Header />;
  },
};

export const SidebarOpen: Story = {
  render: () => {
    chatStore.setKey('started', true);
    sidebarStore.setOpen(true);

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
