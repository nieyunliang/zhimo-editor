import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import dts from 'vite-plugin-dts'

const entryDir = import.meta.dirname

/**
 * 组件库构建：
 * - 产物：dist/zhimo-editor.js（ESM）+ dist/index.d.ts（打包类型）
 * - react / react-dom / @tiptap / lucide-react 全部外部化（peerDependencies）
 * - 样式由 @tailwindcss/cli 单独产出 dist/zhimo-editor.css（见 build:css）
 */
export default defineConfig({
  // lib 模式不复制 public/，只产出库产物
  publicDir: false,
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    dts({
      tsconfigPath: './tsconfig.app.json',
      entryRoot: 'src/editor',
      include: ['src/editor'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(entryDir, 'src/editor/index.ts'),
      formats: ['es'],
      fileName: () => 'zhimo-editor.js',
    },
    rollupOptions: {
      external: [
        /^react$/,
        /^react\//,
        /^react-dom$/,
        /^react-dom\//,
        /^@tiptap\//,
        /^lucide-react$/,
      ],
      output: {
        // 提示使用方按需引入
        exports: 'named',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
})
