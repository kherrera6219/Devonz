import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';
import { useState } from 'react';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

type OptionType = 'opt1' | 'opt2' | 'opt3';

export const TwoOptions: Story = {
  render: () => {
    const [selected, setSelected] = useState<OptionType>('opt1');
    return (
      <Slider<OptionType>
        selected={selected}
        setSelected={setSelected}
        options={{
          left: { value: 'opt1', text: 'Option 1' },
          right: { value: 'opt2', text: 'Option 2' },
        }}
      />
    );
  },
};

export const ThreeOptions: Story = {
  render: () => {
    const [selected, setSelected] = useState<OptionType>('opt2');
    return (
      <Slider<OptionType>
        selected={selected}
        setSelected={setSelected}
        options={{
          left: { value: 'opt1', text: 'Left' },
          middle: { value: 'opt2', text: 'Middle' },
          right: { value: 'opt3', text: 'Right' },
        }}
      />
    );
  },
};
