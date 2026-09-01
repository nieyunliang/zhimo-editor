# Changelog

本文件记录知墨编辑器（zhimo-editor）的重要变更。

## 0.2.0

### 修复
- 链接编辑弹层补齐「点击外部关闭」与文档级 Esc（此前弹层开启后无法正常关闭，会残留并跟随光标）
- 斜杠菜单 / 段落下拉 / 链接与图片弹层：IME 组合输入期间不拦截键盘事件（`isComposing` 守卫），修复中文输入法下 Enter / ↑↓ 被菜单消费
- 斜杠菜单键盘导航后高亮项自动滚入可视区（菜单 `max-height` 会裁剪后半列表，键盘用户此前无法到达末尾项）
- 全库弹层新增横向钳制（窄屏右缘触发不再溢出视口）；表格工具条补齐向上翻转
- 图片上传流程补齐编辑器销毁守卫：上传完成 / 失败后编辑器已卸载时不再访问编辑器状态
- 表格工具条合并 / 拆分可用性经 `useEditorState` 订阅（修复 React Compiler 记忆化 `editor.can()` 导致状态不更新的隐患）

### 功能
- 表格上下文工具条新增「合并 / 拆分单元格」（单格选中时禁用，跨格选中可用）
- 新增 `editorAriaLabel` prop：编辑区 aria-label（默认「编辑器」）
- 编辑区最小高度改为 `--zm-min-height` 变量（默认 240px，可覆盖）

### 重构
- 新增 `PopoverShell`：五个弹层（气泡 / 斜杠 / 链接 / 图片 / 表格工具条）的定位、翻转、钳制与门户渲染统一为单一来源
- `INLINE_MARKS` 上移至共享命令注册表 `commands.ts`，工具栏与气泡菜单同源消费（消除重复定义）
- 图片弹层不再重复传递 uploadImage 兜底（扩展内部默认，单一职责）

### 样式 / 可访问性
- 深色模式补 `color-scheme: dark`（原生滚动条 / 控件跟随深色）
- 统一 `:focus-visible` 焦点环；编辑器根节点补 `:focus-within` 焦点指示（替代移除的 contenteditable outline）
- 尊重 `prefers-reduced-motion`（上传占位动画与过渡降级）
- 工具栏按钮触控优化（`touch-action: manipulation` / `-webkit-tap-highlight-color`）；斜杠菜单 `overscroll-behavior: contain`
- 工具提示与图片缩放把手改用主题变量（不再硬编码 `#fff` / `#1f2937`）

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
