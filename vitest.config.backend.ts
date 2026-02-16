import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config();

export default defineConfig({
  plugins: [
    tsconfigPaths(),
  ] as any[],
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
} as any);
