import type { Meta, StoryObj } from '@storybook/react';
import Popover from './Popover';
import { Button } from './Button';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    side: 'bottom',
    align: 'center',
  },
  render: (args) => (
    <Popover trigger={<Button variant="outline">Open Popover</Button>} {...args}>
      <div className="w-64 p-2">
        <h4 className="font-medium mb-2 text-bolt-elements-textPrimary">Popover Title</h4>
        <p className="text-sm text-bolt-elements-textSecondary">
          This is the content of the popover. It can contain any React nodes.
        </p>
      </div>
    </Popover>
  ),
};
