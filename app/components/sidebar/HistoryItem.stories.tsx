import type { Meta, StoryObj } from '@storybook/react-vite';
import { HistoryItem } from './HistoryItem';
import { createRemixStub } from '@remix-run/testing';

const meta = {
  title: 'Sidebar/HistoryItem',
  component: HistoryItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (storyComponent: React.ComponentType) => {
      const RemixStub = createRemixStub([
        {
          path: '/chat/:id',
          Component: storyComponent,
        },
        {
          path: '/',
          Component: storyComponent,
        },
      ]);
      return <RemixStub initialEntries={['/']} />;
    },
  ],
} satisfies Meta<typeof HistoryItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockItem = {
  id: '1',
  urlId: 'chat-1',
  description: 'Project Planning',
  messages: [],
  timestamp: new Date().toISOString(),
};

export const Default: Story = {
  args: {
    item: mockItem,
    exportChat: (id) => alert(`Export ${id}`),
    onDelete: () => alert('Delete'),
    onDuplicate: (id) => alert(`Duplicate ${id}`),
  },
};

export const Active: Story = {
  decorators: [
    (storyComponent: React.ComponentType) => {
      const RemixStub = createRemixStub([
        {
          path: '/',
          Component: storyComponent,
        },
      ]);
      return <RemixStub initialEntries={['/chat/chat-1']} />;
    },
  ],
  args: {
    item: mockItem,
    exportChat: (id) => alert(`Export ${id}`),
    onDelete: () => alert('Delete'),
    onDuplicate: (id) => alert(`Duplicate ${id}`),
  },
};

export const SelectionMode: Story = {
  args: {
    item: mockItem,
    selectionMode: true,
    isSelected: false,
    exportChat: (id) => alert(`Export ${id}`),
  },
};

export const Selected: Story = {
  args: {
    item: mockItem,
    selectionMode: true,
    isSelected: true,
    exportChat: (id) => alert(`Export ${id}`),
  },
};
