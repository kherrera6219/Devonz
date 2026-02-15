
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';
import { vitePlugin as remixVitePlugin } from '@remix-run/dev';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config();

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // Remix plugin might be needed for some resolutions, but let's try without if it fails
    // remixVitePlugin({ future: { v3_singleFetch: true } }),
  ],
  test: {
    globals: true,
    environment: 'node', // Use node environment for backend tests
    include: ['app/**/*.spec.ts', 'app/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      'app/components/**', // Exclude UI component tests
      'app/root.tsx',
      'app/routes/**', // Exclude routes if they import UI
    ],
  },
});
