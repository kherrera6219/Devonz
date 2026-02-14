import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownItem, DropdownSeparator } from './Dropdown';
import { Button } from './Button';

const meta = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dropdown trigger={<Button>Open Menu</Button>}>
      <DropdownItem onSelect={() => alert('Profile clicked')}>Profile</DropdownItem>
      <DropdownItem onSelect={() => alert('Billing clicked')}>Billing</DropdownItem>
      <DropdownItem onSelect={() => alert('Settings clicked')}>Settings</DropdownItem>
      <DropdownSeparator />
      <DropdownItem onSelect={() => alert('Logout clicked')} className="text-red-500 hover:bg-red-500/10">
        Logout
      </DropdownItem>
    </Dropdown>
  ),
};
