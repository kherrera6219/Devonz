import { memo } from 'react';

export const genericMemo: <T extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<unknown>>(
  component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean,
) => T & { displayName?: string } = memo;
