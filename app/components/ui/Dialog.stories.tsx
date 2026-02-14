import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogButton, DialogDescription, DialogTitle, DialogClose, DialogRoot } from './Dialog';
import { Button } from './Button';
import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
        <RadixDialog.Trigger asChild>
          <Button>Open Dialog</Button>
        </RadixDialog.Trigger>
        <Dialog onClose={() => setIsOpen(false)}>
          <div className="p-6 bg-bolt-elements-bg-depth-1">
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm">
                  Name
                </label>
                <input
                  id="name"
                  defaultValue="Pedro Duarte"
                  className="col-span-3 p-2 border rounded bg-bolt-elements-background-depth-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <DialogButton type="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton type="primary" onClick={() => setIsOpen(false)}>
                Save changes
              </DialogButton>
            </div>
          </div>
        </Dialog>
      </DialogRoot>
    );
  },
};
