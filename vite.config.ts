import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/inkitt-intelligence/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    testTimeout: 120_000,
    include: ['src/test/**/*.js', 'src/**/*.test.{js,ts}'],
  },
})
