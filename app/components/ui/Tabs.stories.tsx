import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="p-4 border rounded-md mt-2 bg-bolt-elements-background-depth-2">
          <h3 className="text-lg font-medium">Account</h3>
          <p className="text-sm text-bolt-elements-textSecondary">Make changes to your account here.</p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="p-4 border rounded-md mt-2 bg-bolt-elements-background-depth-2">
          <h3 className="text-lg font-medium">Password</h3>
          <p className="text-sm text-bolt-elements-textSecondary">Change your password here.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};
