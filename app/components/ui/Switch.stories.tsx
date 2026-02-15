import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';
import { Label } from './Label';
import { useState } from 'react';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex items-center space-x-2">
        <Switch className="mx-auto" checked={checked} onCheckedChange={setChecked} {...args} />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );
  },
};

export const Checked: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch checked={true} {...args} />
      <Label htmlFor="checked-mode">Always On</Label>
    </div>
  ),
};
