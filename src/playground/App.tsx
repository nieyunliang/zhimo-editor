import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ZhimoEditor, type ZhimoEditorProps } from '../editor'
import './App.css'

/** 模拟上传：FileReader 转 dataURL + 800ms 延迟 */
function mockUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      setTimeout(() => resolve(reader.result as string), 800)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

const INITIAL_HTML = `
<h1>知墨编辑器</h1>
<p>基于 <a href="https://tiptap.dev" target="_blank" rel="noopener noreferrer nofollow">TipTap v3</a> 的 React 富文本编辑器组件。选中文字试试浮动菜单，输入 <code>/</code> 试试命令菜单。</p>
<blockquote>知墨 · 落笔成章</blockquote>
<ul><li>受控 / 非受控双模式</li><li>HTML / JSON 内容格式</li><li>中文工具栏与斜杠命令</li></ul>
<p>支持表格、图片（URL 与上传）、链接编辑：</p>
<table><tbody><tr><th>功能</th><th>说明</th></tr><tr><td>表格</td><td>光标移入表格内可插入/删除行列</td></tr><tr><td>图片</td><td>粘贴、拖拽或 URL 插入</td></tr></tbody></table>
`.trim()

export default function App() {
  // —— 演示一：基础用法（非受控） ——
  const [html, setHtml] = useState('')

  // —— 演示二：受控模式 ——
  const [ctrlValue, setCtrlValue] = useState('<p>受控模式：外部状态驱动内容。</p>')
  const [ctrlFormat, setCtrlFormat] = useState<NonNullable<ZhimoEditorProps['format']>>('html')
  const extraCount = useRef(0)
  const setExternal = () => {
    extraCount.current += 1
    const extra = `<p><strong>第 ${extraCount.current} 次外部更新</strong> — 由外部按钮写入。</p>`
    if (ctrlFormat === 'json') {
      // JSON 格式下以 JSON 字符串受控
      setCtrlValue(JSON.stringify([...JSON.parse(ctrlValue), ...JSON.parse(JSON.stringify(extra))]))
    } else {
      setCtrlValue(ctrlValue + extra)
    }
  }

  // —— 演示三：配置与主题 ——
  const [disabled, setDisabled] = useState(false)
  const [noToolbar, setNoToolbar] = useState(false)
  const [primary, setPrimary] = useState('#2563eb')
  const themeStyle = { '--zm-primary': primary } as CSSProperties

  return (
    <main className="page">
      <header className="page-header">
        <h1>知墨编辑器</h1>
        <p>基于 TipTap v3 的 React 富文本编辑器组件 · Playground</p>
      </header>

      <section className="demo-card">
        <h2 className="demo-title">基础用法（非受控）</h2>
        <ZhimoEditor
          defaultValue={INITIAL_HTML}
          placeholder="开始输入内容，输入 / 打开命令菜单…"
          onChange={setHtml}
        />
        <details className="output">
          <summary>查看 HTML 输出</summary>
          <pre>{html || '（尚未产生内容变化）'}</pre>
        </details>
      </section>

      <section className="demo-card">
        <h2 className="demo-title">
          受控模式
          <span className="demo-controls">
            <button type="button" className="demo-btn" onClick={setExternal}>
              外部写入内容
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() =>
                setCtrlFormat((f) => (f === 'html' ? 'json' : 'html'))
              }
            >
              切换为 {ctrlFormat === 'html' ? 'JSON' : 'HTML'} 格式
            </button>
          </span>
        </h2>
        <ZhimoEditor
          value={ctrlValue}
          format={ctrlFormat}
          onChange={setCtrlValue}
          placeholder="受控模式：试试右上角的外部写入"
        />
        <details className="output">
          <summary>查看受控值（{ctrlFormat.toUpperCase()}）</summary>
          <pre>{ctrlValue}</pre>
        </details>
      </section>

      <section className="demo-card">
        <h2 className="demo-title">
          配置与主题
          <span className="demo-controls">
            <label className="demo-toggle">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
              />
              只读
            </label>
            <label className="demo-toggle">
              <input
                type="checkbox"
                checked={noToolbar}
                onChange={(e) => setNoToolbar(e.target.checked)}
              />
              隐藏工具栏
            </label>
            <label className="demo-toggle">
              主题色
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
              />
            </label>
          </span>
        </h2>
        <ZhimoEditor
          style={themeStyle}
          disabled={disabled}
          toolbar={!noToolbar}
          placeholder="配置项演示：只读 / 工具栏 / 主题色（CSS 变量）"
          uploadImage={mockUpload}
          defaultValue={`
<p>本示例配置了 <code>uploadImage</code>：可以粘贴或拖拽图片到编辑区试试（模拟 800ms 上传）。</p>
<p>主题色通过 <code>--zm-primary</code> CSS 变量定制。</p>
          `.trim()}
        />
      </section>
    </main>
  )
}
