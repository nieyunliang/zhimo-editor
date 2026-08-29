/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/editor/**/*.{ts,tsx}'],
      exclude: [
        'src/editor/**/*.test.{ts,tsx}',
        'src/editor/test-utils.tsx',
        // 纯导出/纯类型文件，无运行时逻辑
        'src/editor/index.ts',
        'src/editor/types.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 85,
        lines: 95,
      },
    },
  },
  build: {
    // Playground 应用构建独立于组件库产物（dist/），避免互相覆盖
    outDir: 'dist-playground',
  },
})
