import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Editor } from '@tiptap/react'
import { ZhimoEditor } from './ZhimoEditor'
import type { ZhimoEditorProps } from './types'

/** 渲染编辑器并通过 onCreate 捕获 editor 实例 */
function renderEditor(props: ZhimoEditorProps = {}) {
  let editor: Editor | null = null
  const utils = render(
    <ZhimoEditor {...props} onCreate={(e) => (editor = e)} />,
  )
  return {
    ...utils,
    getEditor: () => editor,
  }
}

/** 等待编辑器实例就绪 */
async function editorReady(getEditor: () => Editor | null) {
  await waitFor(() => expect(getEditor()).toBeTruthy())
  return getEditor()!
}

describe('ZhimoEditor 基础渲染', () => {
  it('渲染 defaultValue 内容', async () => {
    render(
      <ZhimoEditor defaultValue="<h1>你好知墨</h1><p>第一段</p>" />,
    )
    expect(await screen.findByText('你好知墨')).toBeTruthy()
    expect(screen.getByText('第一段')).toBeTruthy()
  })

  it('空文档时渲染占位符（data-placeholder）', async () => {
    const { container } = render(<ZhimoEditor placeholder="请输入内容…" />)
    await waitFor(() =>
      expect(
        container.querySelector('.tiptap [data-placeholder="请输入内容…"]'),
      ).toBeTruthy(),
    )
  })

  it('disabled 时编辑器只读', async () => {
    const { getEditor } = renderEditor({ disabled: true })
    const editor = await editorReady(getEditor)
    expect(editor.isEditable).toBe(false)
  })

  it('disabled 动态切换', async () => {
    const { getEditor, rerender } = renderEditor({})
    const editor = await editorReady(getEditor)
    expect(editor.isEditable).toBe(true)
    rerender(<ZhimoEditor disabled />)
    await waitFor(() => expect(editor.isEditable).toBe(false))
  })
})

describe('ZhimoEditor 内容与事件', () => {
  it('内容变化触发 onChange（HTML）', async () => {
    const onChange = vi.fn()
    const { getEditor } = renderEditor({ onChange })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setContent('<p>hello</p>')
    })
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange.mock.calls.at(-1)![0]).toContain('<p>hello</p>')
  })

  it('JSON 格式：初始内容与 onChange 均使用 JSON 字符串', async () => {
    const onChange = vi.fn()
    const initial = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'JSON 内容' }] },
      ],
    })
    const { getEditor } = renderEditor({ format: 'json', defaultValue: initial, onChange })
    expect(await screen.findByText('JSON 内容')).toBeTruthy()
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setContent('<p>new</p>')
    })
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const payload = onChange.mock.calls.at(-1)![0]
    expect(() => JSON.parse(payload)).not.toThrow()
    expect(JSON.parse(payload).content[0].content[0].text).toBe('new')
  })

  it('受控模式：外部 value 更新同步文档', async () => {
    const { rerender } = render(
      <ZhimoEditor value="<p>v1</p>" onChange={() => {}} />,
    )
    expect(await screen.findByText('v1')).toBeTruthy()
    rerender(<ZhimoEditor value="<p>v2</p>" onChange={() => {}} />)
    expect(await screen.findByText('v2')).toBeTruthy()
  })

  it('受控模式：onCreate 回调可拿到编辑器实例', async () => {
    const onCreate = vi.fn()
    render(<ZhimoEditor onCreate={onCreate} />)
    await waitFor(() => expect(onCreate).toHaveBeenCalled())
  })
})

describe('ZhimoEditor 工具栏', () => {
  it('点击加粗按钮使选中文本加粗', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>加粗文本</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 5 })
    })
    await userEvent.click(screen.getByRole('button', { name: '加粗' }))
    expect(editor.isActive('bold')).toBe(true)
    expect(editor.getHTML()).toContain('<strong>')
  })

  it('插入表格按钮创建表格', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    await userEvent.click(screen.getByRole('button', { name: '插入表格' }))
    expect(editor.isActive('table')).toBe(true)
  })
})

describe('ZhimoEditor 斜杠菜单', () => {
  /** 聚焦并输入 /（jsdom 下通过 view.dom.focus() 触发聚焦） */
  function typeSlash(editor: Editor, text = '/') {
    act(() => {
      editor.view.dom.focus()
      editor.commands.insertContent(text)
    })
  }

  it('输入 / 弹出命令菜单，Enter 执行并删除 /', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeSlash(editor)
    const listbox = await screen.findByRole('listbox')
    expect(listbox).toBeTruthy()
    act(() => {
      editor.view.dom.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
    })
    await waitFor(() => expect(editor.getText()).not.toContain('/'))
  })

  it('键盘导航：ArrowDown 后 Enter 插入标题 1', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeSlash(editor)
    await screen.findByRole('listbox')
    // 首项为「正文」，ArrowDown 一次选中「标题 1」
    act(() => {
      editor.view.dom.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      )
    })
    act(() => {
      editor.view.dom.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
    })
    await waitFor(() => expect(editor.isActive('heading', { level: 1 })).toBe(true))
  })

  it('Esc 关闭命令菜单', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeSlash(editor)
    await screen.findByRole('listbox')
    act(() => {
      editor.view.dom.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
    })
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('输入过滤：/标 只显示标题命令', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeSlash(editor, '/标')
    const listbox = await screen.findByRole('listbox')
    const options = listbox.querySelectorAll('[role="option"]')
    expect(options.length).toBeGreaterThan(0)
    const labels = Array.from(options).map((o) => o.textContent)
    expect(labels.some((l) => l?.includes('标题'))).toBe(true)
    expect(labels.some((l) => l?.includes('表格'))).toBe(false)
  })
})

describe('ZhimoEditor 受控值回调', () => {
  const settle = () => act(() => new Promise((r) => setTimeout(r, 20)))

  it.each([
    ['空串', { value: '' }],
    ['HTML', { value: '<p>你好</p>' }],
    ['非受控', { defaultValue: '<p>你好</p>' }],
    ['JSON', { value: '', format: 'json' as const }],
    ['禁用', { value: '<p>你好</p>', disabled: true }],
    ['以标题结尾', { value: '<h1>标题</h1>' }],
  ])('挂载时不触发 onChange（%s）', async (_, props) => {
    const onChange = vi.fn()
    const { getEditor } = renderEditor({ ...props, onChange })
    await editorReady(getEditor)
    await settle()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('切换 disabled 不触发 onChange', async () => {
    const onChange = vi.fn()
    let editor: Editor | null = null
    const { rerender } = render(
      <ZhimoEditor value="<p>a</p>" onChange={onChange} onCreate={(e) => (editor = e)} />,
    )
    await editorReady(() => editor)
    rerender(<ZhimoEditor value="<p>a</p>" disabled onChange={onChange} />)
    await settle()
    expect(editor!.isEditable).toBe(false)
    rerender(<ZhimoEditor value="<p>a</p>" onChange={onChange} />)
    await settle()
    expect(editor!.isEditable).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each(['html', 'json'] as const)('清空内容后回调空串（%s），与 value="" 对称', async (format) => {
    const onChange = vi.fn()
    const initial =
      format === 'json'
        ? JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] })
        : '<p>x</p>'
    const { getEditor } = renderEditor({ format, defaultValue: initial, onChange })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.clearContent(true)
    })
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange.mock.calls.at(-1)![0]).toBe('')
  })

  it('空标题等非默认空结构不会被序列化为空串', async () => {
    const onChange = vi.fn()
    const { getEditor } = renderEditor({ onChange })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setHeading({ level: 1 })
    })
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    // StarterKit 的 TrailingNode 会在标题后补一个空段落
    expect(onChange.mock.calls.at(-1)![0]).toBe('<h1></h1><p></p>')
  })
})
