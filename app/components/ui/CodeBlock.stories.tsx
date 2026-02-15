import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from './CodeBlock';

const meta = {
  title: 'UI/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCode = `import React from 'react';
import { Button } from './Button';

export function App() {
  return (
    <div>
      <h1>Hello World</h1>
      <Button>Click me</Button>
    </div>
  );
}`;

export const Default: Story = {
  args: {
    code: sampleCode,
    language: 'tsx',
    filename: 'App.tsx',
  },
};

export const NoFilename: Story = {
  args: {
    code: sampleCode,
    language: 'typescript',
  },
};

export const NoLineNumbers: Story = {
  args: {
    code: 'console.log("Hello simple world");',
    language: 'javascript',
    showLineNumbers: false,
    filename: 'script.js',
  },
};
