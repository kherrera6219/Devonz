import type { Meta, StoryObj } from '@storybook/react';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { createRemixStub } from '@remix-run/testing';

const meta = {
  title: 'Components/HeaderActionButtons',
  component: HeaderActionButtons,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (StoryComponent) => {
      const RemixStub = createRemixStub([
        {
          path: '/',
          Component: StoryComponent,
        },
      ]);
      return <RemixStub />;
    },
  ],
} satisfies Meta<typeof HeaderActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChatStarted: Story = {
  args: {
    chatStarted: true,
  },
};

export const ChatNotStarted: Story = {
  args: {
    chatStarted: false,
  },
};
