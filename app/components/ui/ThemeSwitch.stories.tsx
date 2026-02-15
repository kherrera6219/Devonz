import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeSwitch } from './ThemeSwitch';

const meta = {
  title: 'UI/ThemeSwitch',
  component: ThemeSwitch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
