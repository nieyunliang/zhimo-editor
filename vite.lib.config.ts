import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { esmExternalRequirePlugin } from 'rolldown/plugins'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import dts from 'vite-plugin-dts'

const entryDir = import.meta.dirname

/**
 * 组件库构建：
 * - 产物：dist/zhimo-editor.js（ESM）+ dist/index.d.ts（打包类型）
 * - react / react-dom 外部化（peerDependencies）
 * - @tiptap/*、prosemirror 与 lucide-react 全部内置进产物：使用方零 tiptap / 图标库运行时依赖
 * - 样式由 @tailwindcss/cli 单独产出 dist/zhimo-editor.css（见 build:css）
 */
export default defineConfig({
  // lib 模式不复制 public/，只产出库产物
  publicDir: false,
  // prosemirror/tiptap CJS 代码内置后自带 process.env.NODE_ENV 分支；
  // lib 模式下 Vite 不会自动替换，必须显式定义，否则浏览器直接加载产物会抛 ReferenceError
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    dts({
      tsconfigPath: './tsconfig.app.json',
      entryRoot: 'src/editor',
      include: ['src/editor'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/editor/test-utils.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(entryDir, 'src/editor/index.ts'),
      formats: ['es'],
      fileName: () => 'zhimo-editor.js',
    },
    rollupOptions: {
      plugins: [
        // tiptap/react 等 CJS 代码被内联后仍含 require('react')（如 use-sync-external-store）；
        // 该插件将其改写为静态 import，保证产物在纯 ESM 环境（无 require）可直接加载。
        // 注意：插件必须独占其 external 列表——react/react-dom 不能再出现在下方
        // 顶层 external 中（顶层优先会导致插件跳过、产物残留 require 调用）
        esmExternalRequirePlugin({
          external: [/^react(\/|$)/, /^react-dom(\/|$)/],
        }),
      ],
      // @tiptap 一族、prosemirror 与 lucide-react 均被内置；仅 react/react-dom 交由上方插件标记为 external
      external: [],
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
