# 知墨编辑器（zhimo-editor）

> 基于 [TipTap v3](https://tiptap.dev) 的 React 富文本编辑器组件 · 中文优先的现代化编辑体验

知墨编辑器是一个开箱即用的 React 富文本编辑器组件库：内置中文工具栏、选中浮动菜单、斜杠命令菜单、表格增强与图片上传能力，支持受控/非受控双模式与 HTML/JSON 内容格式，样式基于 CSS 变量可整体换肤。

## 功能特性

- **中文工具栏**：段落格式（正文 / 标题 1-3）、加粗 / 斜体 / 下划线 / 删除线 / 行内代码、有序 / 无序列表、引用 / 代码块 / 分割线、链接 / 图片 / 表格插入、撤销 / 重做
- **浮动气泡菜单**：选中文本即出现格式操作
- **斜杠命令菜单**：输入 `/` 弹出分组命令面板，支持关键字过滤与键盘导航（`↑` `↓` `Enter` `Esc`）
- **表格增强**：光标进入表格自动出现上下文工具条（插入 / 删除行列、删除表格）
- **图片**：URL 插入、粘贴 / 拖拽上传（配置 `uploadImage` 后自动启用，含上传中占位与失败回滚）
- **链接编辑**：设置 / 移除链接弹层，外链自动 `noopener noreferrer` 安全属性
- **双模式**：受控（`value` + `onChange`）与非受控（`defaultValue`）
- **双格式**：HTML / JSON 内容序列化
- **可扩展**：`extensions` 追加扩展，与内置同名时覆盖默认配置
- **主题定制**：CSS 变量（`--zm-*`）一键换肤
- **中文输入法友好**：斜杠菜单与浮动菜单对 composition 安全

## 快速开始

```bash
npm install zhimo-editor
# 依赖（peer）：react、react-dom、@tiptap/*（v3）、lucide-react
```

```tsx
import { ZhimoEditor } from 'zhimo-editor'
import 'zhimo-editor/styles.css'

function App() {
  return (
    <ZhimoEditor
      defaultValue="<p>你好，知墨。</p>"
      placeholder="开始输入…"
      onChange={(html) => console.log(html)}
    />
  )
}
```

### 受控模式

```tsx
const [html, setHtml] = useState('<p>受控内容</p>')

<ZhimoEditor value={html} onChange={setHtml} />
```

### 图片上传

```tsx
<ZhimoEditor
  uploadImage={async (file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    return (await res.json()).url
  }}
/>
```

配置后编辑器内粘贴 / 拖拽图片文件即自动上传插入；未配置时粘贴图片会给出提示，仅支持 URL 插入。

### 自定义扩展

```tsx
import Underline from '@tiptap/extension-underline'

<ZhimoEditor extensions={[Underline.configure({ HTMLAttributes: {} })]} />
```

## API

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 受控内容（与 `onChange` 配合） |
| `defaultValue` | `string` | — | 非受控初始内容 |
| `format` | `'html' \| 'json'` | `'html'` | 内容序列化格式（JSON 为字符串化的 JSONContent） |
| `onChange` | `(content: string) => void` | — | 内容变化回调 |
| `placeholder` | `string` | `请输入内容…` | 空文档占位符 |
| `disabled` | `boolean` | `false` | 只读模式 |
| `uploadImage` | `(file: File) => Promise<string>` | — | 图片上传回调 |
| `extensions` | `AnyExtension[]` | — | 追加 / 覆盖扩展 |
| `toolbar` | `boolean \| ReactNode` | `true` | 内置工具栏开关或自定义工具栏 |
| `bubbleMenu` | `boolean` | `true` | 选中浮动菜单开关 |
| `slashMenu` | `boolean` | `true` | 斜杠命令菜单开关 |
| `onCreate` | `(editor) => void` | — | 编辑器创建完成 |
| `onFocus` / `onBlur` | `(props) => void` | — | 聚焦 / 失焦 |
| `onSelectionUpdate` | `(props) => void` | — | 选区变化 |
| `className` / `style` | — | — | 根节点样式 |

## 主题定制

主题通过 `.zhimo-editor` 上的 CSS 变量控制，覆盖任意变量即可换肤：

```css
.zhimo-editor {
  --zm-primary: #16a34a;          /* 主色 */
  --zm-primary-hover: #15803d;    /* 主色 hover */
  --zm-primary-soft: #f0fdf4;     /* 主色浅底 */
  --zm-text: #1f2329;             /* 正文色 */
  --zm-text-secondary: #646a73;   /* 次级文本 */
  --zm-text-muted: #9ca3af;       /* 弱化文本 */
  --zm-border: #e5e7eb;           /* 边框 */
  --zm-border-strong: #d1d5db;    /* 强调边框 */
  --zm-bg: #ffffff;               /* 背景 */
  --zm-bg-hover: #f3f4f6;         /* hover 背景 */
  --zm-bg-active: #eef2ff;        /* 激活背景 */
  --zm-danger: #dc2626;           /* 危险色 */
  --zm-radius: 8px;               /* 圆角 */
  --zm-font: 'PingFang SC', system-ui, sans-serif;
  --zm-font-mono: ui-monospace, Menlo, Consolas, monospace;
}
```

## 开发

```bash
npm install          # 安装依赖
npm run dev          # 启动 Playground（http://localhost:5173）
npm run lint         # oxlint 检查
npm run test         # vitest 单元测试
npm run build:dist   # 构建库产物（dist/zhimo-editor.js + .d.ts + .css）
npm run build        # 构建 Playground 应用
```

## 目录结构

```
src/
  editor/            # 组件库源码（发布入口 src/editor/index.ts）
    ZhimoEditor.tsx  # 主组件
    useZhimoEditor.ts# useEditor 封装（扩展装配 / 受控同步 / 禁用态）
    extensions/      # 内置扩展（表格、图片上传等）
    toolbar/         # 工具栏（按钮 / 下拉 / 命令注册）
    menus/           # 浮动菜单（气泡 / 斜杠 / 链接 / 图片 / 表格工具条）
    styles/index.css # Tailwind v4 入口 + CSS 变量主题
  playground/        # 开发演示应用
vite.lib.config.ts   # 组件库构建配置
```

## 技术栈

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · TipTap v3 · lucide-react · Vitest

## License

MIT
