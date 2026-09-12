/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: 'hidden',
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
  plugins: [
    react(
      mode === 'test'
        ? {}
        : {
            babel: {
              plugins: [
                'react-dev-locator',
              ],
            },
          }
    ),
    ...(mode === 'test'
      ? []
      : [
          traeBadgePlugin({
            variant: 'dark',
            position: 'bottom-right',
            prodOnly: true,
            clickable: true,
            clickUrl: 'https://www.trae.ai/solo?showJoin=1',
            autoTheme: true,
            autoThemeTarget: '#root'
          }),
        ]),
    tsconfigPaths()
  ],
}))
