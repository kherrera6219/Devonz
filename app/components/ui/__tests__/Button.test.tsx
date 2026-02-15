import { render } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { Button } from '~/components/ui/Button';
import { axe } from 'vitest-axe';

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have violations for different variants', async () => {
    const { container } = render(
      <div role="main">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
