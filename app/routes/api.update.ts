import { json, type ActionFunction } from '@remix-run/node';
import { withSecurity } from '~/lib/security';

export const action: ActionFunction = withSecurity(
  async ({ request: _request }) => {
    return json(
      {
        error: 'Updates must be performed manually in a server environment',
        instructions: [
          '1. Navigate to the project directory',
          '2. Run: git fetch upstream',
          '3. Run: git pull upstream main',
          '4. Run: pnpm install',
          '5. Run: pnpm run build',
        ],
      },
      { status: 400 },
    );
  },
  { allowedMethods: ['POST'] },
);
