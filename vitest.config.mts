import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Default environment for unit tests
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    
    // Configure different test types
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/*.e2e.{test,spec}.{js,ts,tsx}'
    ],
    
    // Browser mode configuration (for E2E tests)
    browser: {
      enabled: false, // Disabled by default, enable with --browser flag
      name: 'chromium',
      provider: 'playwright',
      headless: true,
      api: {
        port: 63315
      }
    },
  },
})