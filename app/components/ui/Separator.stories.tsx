import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './Separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-[300px] space-y-4">
      <div className="text-sm font-medium">Header</div>
      <Separator {...args} />
      <div className="text-sm">Content below separator</div>
    </div>
  ),
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-[50px] items-center space-x-4">
      <div className="text-sm">Left</div>
      <Separator {...args} />
      <div className="text-sm">Right</div>
    </div>
  ),
  args: {
    orientation: 'vertical',
  },
};
