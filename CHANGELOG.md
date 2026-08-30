# Changelog

本文件记录知墨编辑器（zhimo-editor）的重要变更。

## Unreleased

### 工程 / 质量
- 构建产物内置 TipTap v3（含 prosemirror）与 lucide-react，使用方零 tiptap / 图标库运行时依赖；`peerDependencies` 仅保留 react / react-dom
- 开启 TypeScript `strict`（app 与 node 配置），`vite.lib.config.ts` 纳入类型检查
- lint 排除构建产物（`dist/**`、`dist-playground/**`），lint 输出恢复纯净
- `dist/` 移出版本控制并加入 `.gitignore`（产物由 `prepare` 构建）
- d.ts 产物排除 `test-utils.tsx`，发布包不再携带测试辅助声明
- 新增 GitHub Actions CI：lint / typecheck / 测试（含覆盖率）/ 库构建 / Playground 构建
- 新增 `LICENSE`（MIT）与 `CHANGELOG.md`；补齐 `repository` / `homepage` / `bugs` / `author` / `engines` 元数据
- 移除未使用的 `@tiptap/extension-table-cell/header/row` devDependencies

### 重构
- 新增 `usePopoverAnchor` / `usePopoverFlip`，统一气泡菜单、链接/图片弹层、斜杠菜单、表格工具条的锚点定位与翻转判定；斜杠菜单补齐滚动/缩放复测
- 新增共享命令注册表 `commands.ts`，工具栏、段落下拉、斜杠命令菜单同源消费，新命令只登记一次
- `ImageUpload` 上传流程（命令与粘贴/拖拽入口）合并为单一 `startUpload`；占位节点以 `data-upload-id` 唯一标识，修复并发上传时替换错节点的竞态
- 拖拽图片未配置上传时与粘贴行为一致：拦截并提示（`imageUploadBlocked`）

## 0.1.0

- 首个版本：基于 TipTap v3 的 React 富文本编辑器组件
