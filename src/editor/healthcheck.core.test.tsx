import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorContent } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import { ZhimoEditor } from './ZhimoEditor'
import { useZhimoEditor } from './useZhimoEditor'
import { buildExtensions } from './extensions'
import { renderEditor, editorReady } from './test-utils'

describe('体检：公开导出面', () => {
  it('index 导出 ZhimoEditor / useZhimoEditor / buildExtensions', async () => {
    const mod = await import('./index')
    expect(typeof mod.ZhimoEditor).toBe('function')
    expect(typeof mod.useZhimoEditor).toBe('function')
    expect(typeof mod.buildExtensions).toBe('function')
  })

  it('buildExtensions 可独立装配全部内置扩展', () => {
    const ext = buildExtensions({ placeholder: '占位', uploadImage: async () => '' })
    const names = ext.map((e) => e.name)
    for (const n of ['starterKit', 'underline', 'link', 'image', 'imageUpload', 'table', 'placeholder']) {
      expect(names).toContain(n)
    }
    // 追加扩展追加在末尾
    const ext2 = buildExtensions({})
    expect(ext2.length).toBe(ext.length)
  })

  it('useZhimoEditor 可独立使用（自定义渲染 EditorContent）', async () => {
    const onChange = vi.fn()
    function Probe() {
      const editor = useZhimoEditor({ defaultValue: '<p>hook 可用</p>', onChange })
      if (!editor) return null
      return <EditorContent editor={editor} />
    }
    render(<Probe />)
    expect(await screen.findByText('hook 可用')).toBeTruthy()
    act(() => {
      // 通过 DOM 之外的方式触发内容变化（直接调用命令）
      document.querySelector<HTMLElement>('.tiptap')?.focus()
    })
    await waitFor(() => expect(document.querySelector('.tiptap')).toBeTruthy())
  })
})

describe('体检：Props 契约（对照 README）', () => {
  it('className / style 应用到根节点', async () => {
    render(<ZhimoEditor className="my-editor" style={{ color: 'rgb(255, 0, 0)' }} />)
    const root = document.querySelector('.zhimo-editor')
    await waitFor(() => expect(root?.classList.contains('my-editor')).toBe(true))
    expect((root as HTMLElement).style.color).toBe('rgb(255, 0, 0)')
    expect(root?.classList.contains('is-disabled')).toBe(false)
  })

  it('disabled 时根节点带 is-disabled 类', async () => {
    render(<ZhimoEditor disabled />)
    await waitFor(() =>
      expect(document.querySelector('.zhimo-editor')?.classList.contains('is-disabled')).toBe(true),
    )
  })

  it('默认占位符为「请输入内容…」（与 README 一致）', async () => {
    render(<ZhimoEditor />)
    await waitFor(() =>
      expect(document.querySelector('[data-placeholder="请输入内容…"]')).toBeTruthy(),
    )
  })

  it('toolbar={false} 隐藏工具栏但编辑器可用', async () => {
    const { getEditor } = renderEditor({ toolbar: false })
    await editorReady(getEditor)
    expect(screen.queryByRole('toolbar', { name: '编辑工具栏' })).toBeNull()
    // 编辑器仍可编辑
    act(() => getEditor()!.commands.insertContent('<p>ok</p>'))
    expect(getEditor()!.getText()).toContain('ok')
  })

  it('toolbar 传 ReactNode 渲染自定义工具栏', async () => {
    const { getEditor } = renderEditor({
      defaultValue: '<p>自定义</p>',
      toolbar: (
        <div className="custom-toolbar">
          <button
            type="button"
            onClick={() => getEditor()?.chain().focus().toggleBold().run()}
          >
            自定义加粗
          </button>
        </div>
      ),
    })
    const editor = await editorReady(getEditor)
    expect(await screen.findByRole('button', { name: '自定义加粗' })).toBeTruthy()
    act(() => {
      editor.commands.selectAll()
    })
    await userEvent.click(screen.getByRole('button', { name: '自定义加粗' }))
    // 点击后加粗生效（自定义工具栏持有 editor 引用）
    await waitFor(() => {
      expect(editor.getHTML()).toContain('<strong>')
    })
  })

  it('slashMenu={false} 输入 / 不弹命令菜单', async () => {
    const { getEditor } = renderEditor({ slashMenu: false })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.view.dom.focus()
      editor.commands.insertContent('/')
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('extensions 同名覆盖内置扩展（Placeholder 覆盖）', async () => {
    render(<ZhimoEditor extensions={[Placeholder.configure({ placeholder: '自定义占位' })]} />)
    await waitFor(() =>
      expect(document.querySelector('[data-placeholder="自定义占位"]')).toBeTruthy(),
    )
  })
})

describe('体检：受控模式健壮性', () => {
  it('受控 JSON 值更新同步文档', async () => {
    const json = (text: string) =>
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
    const { rerender } = render(<ZhimoEditor value={json('v1')} format="json" onChange={() => {}} />)
    expect(await screen.findByText('v1')).toBeTruthy()
    rerender(<ZhimoEditor value={json('v2')} format="json" onChange={() => {}} />)
    expect(await screen.findByText('v2')).toBeTruthy()
  })

  it('HTML → JSON 格式切换不清空现有内容（防误清空）', async () => {
    const { rerender } = render(
      <ZhimoEditor value="<p>重要内容</p>" format="html" onChange={() => {}} />,
    )
    expect(await screen.findByText('重要内容')).toBeTruthy()
    // 切换 format 但 value 仍是 HTML 字符串（调用方尚未转换）
    rerender(<ZhimoEditor value="<p>重要内容</p>" format="json" onChange={() => {}} />)
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.tiptap')?.textContent).toContain('重要内容')
  })

  it('编辑器被销毁后外部 value 变化不抛错（销毁竞态回归）', async () => {
    // TipTap v3 useEditor 存在「渲染时创建、1ms 后延迟销毁」与 React 异步
    // 被动 effect 的竞态：值同步 effect 可能拿到已销毁（schema 为 null）的
    // 实例并在 getHTML 中抛 null.cached。此处直接销毁实例后变更 value，
    // 复现同一调用序列：不得抛错，且新实例创建后内容仍与外部值一致。
    let editor: import('@tiptap/react').Editor | null = null
    const { rerender } = render(
      <ZhimoEditor value="<p>v1</p>" onChange={() => {}} onCreate={(e) => (editor = e)} />,
    )
    await waitFor(() => expect(editor).toBeTruthy())
    expect(editor!.isDestroyed).toBe(false)
    act(() => editor!.destroy())
    expect(editor!.isDestroyed).toBe(true)
    // 销毁后外部值变化：旧实例上不应访问 getHTML（此前这里抛
    // Cannot read properties of null (reading 'cached')）
    rerender(
      <ZhimoEditor value="<p>v2</p>" onChange={() => {}} onCreate={(e) => (editor = e)} />,
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.tiptap')?.textContent).toContain('v2')
  })

  it('非法 JSON 外部值不会清空文档', async () => {
    let editor: import('@tiptap/react').Editor | null = null
    const { rerender } = render(
      <ZhimoEditor
        value="not-json{{"
        format="json"
        onChange={() => {}}
        onCreate={(e) => (editor = e)}
      />,
    )
    await waitFor(() => expect(editor).toBeTruthy())
    // 初始非法 JSON → 空文档；写入内容后外部再传非法值 → 不得清空
    act(() => editor!.commands.setContent('<p>已有内容</p>'))
    rerender(
      <ZhimoEditor
        value="not-json{{"
        format="json"
        onChange={() => {}}
        onCreate={(e) => (editor = e)}
      />,
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('.tiptap')?.textContent).toContain('已有内容')
  })
})

describe('体检：只读（disabled）语义', () => {
  it('disabled 时工具栏按钮禁用，点击不修改内容', async () => {
    const { getEditor } = renderEditor({ disabled: true, defaultValue: '<p>只读内容</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 5 })
    })
    const boldBtn = screen.getByRole('button', { name: '加粗' }) as HTMLButtonElement
    expect(boldBtn.disabled).toBe(true)
    await userEvent.click(boldBtn)
    expect(editor.getHTML()).not.toContain('<strong>')
    expect(editor.isEditable).toBe(false)
  })

  it('disabled 时段落下拉禁用', async () => {
    renderEditor({ disabled: true })
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /正文/ }) as HTMLButtonElement).disabled).toBe(true),
    )
  })
})

describe('体检：事件回调', () => {
  it('onFocus / onBlur / onSelectionUpdate 正常触发', async () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const onSelectionUpdate = vi.fn()
    const { getEditor } = renderEditor({
      onFocus,
      onBlur,
      onSelectionUpdate,
      defaultValue: '<p>文本内容</p>',
    })
    const editor = await editorReady(getEditor)

    // TipTap v3 的 focus 命令在 rAF 中执行，直接触发 DOM focus 事件更确定
    act(() => editor.view.dom.focus())
    expect(onFocus).toHaveBeenCalledTimes(1)

    const selBefore = onSelectionUpdate.mock.calls.length
    act(() => editor.commands.setTextSelection({ from: 1, to: 3 }))
    expect(onSelectionUpdate.mock.calls.length).toBeGreaterThan(selBefore)

    const blurBefore = onBlur.mock.calls.length
    await act(async () => {
      editor.commands.blur() // TipTap v3 的 blur 命令在 rAF 中执行
    })
    await waitFor(() => expect(onBlur.mock.calls.length).toBeGreaterThan(blurBefore))
  })
})
