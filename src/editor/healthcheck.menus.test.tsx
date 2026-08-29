import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Editor } from '@tiptap/react'
import { renderEditor, editorReady, typeInto, deferred, pasteImageFile } from './test-utils'

/**
 * 模拟「DOM 选区可见」：jsdom 中 window.getSelection 的几何测量全为 0，
 * BubbleMenu 依赖非零矩形决定是否显示。这里用 Proxy 包装真实 Selection，
 * 仅覆盖 BubbleMenu 读取的字段，其余行为委托给真实实现。
 */
function mockBubbleSelection() {
  const realSel = window.getSelection()!
  const fakeRange = {
    getBoundingClientRect: () => ({
      top: 10,
      bottom: 30,
      left: 5,
      width: 60,
      height: 20,
      right: 65,
      toJSON: () => ({}),
    }),
    getClientRects: () => [],
  }
  const fakeSel = new Proxy(realSel, {
    get(target, prop) {
      if (prop === 'rangeCount') return 1
      if (prop === 'isCollapsed') return false
      if (prop === 'getRangeAt') return () => fakeRange
      const v = Reflect.get(target, prop)
      return typeof v === 'function' ? v.bind(target) : v
    },
  })
  return vi.spyOn(window, 'getSelection').mockReturnValue(fakeSel as unknown as Selection)
}

describe('体检：选中浮动气泡菜单', () => {
  it('选中文本后出现气泡菜单，点击加粗生效', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>气泡文本</p>' })
    const editor = await editorReady(getEditor)
    const spy = mockBubbleSelection()
    act(() => {
      editor.view.dom.focus()
      editor.commands.setTextSelection({ from: 1, to: 5 })
    })
    const bubble = await screen.findByRole('toolbar', { name: '文本格式' })
    expect(bubble).toBeTruthy()
    await userEvent.click(within(bubble).getByRole('button', { name: '加粗' }))
    expect(editor.isActive('bold')).toBe(true)
    expect(editor.getHTML()).toContain('<strong>')
    spy.mockRestore()
  })

  it('气泡菜单状态同步选区（active 按钮）', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p><em>斜体选区</em></p>' })
    const editor = await editorReady(getEditor)
    const spy = mockBubbleSelection()
    act(() => {
      editor.view.dom.focus()
      editor.commands.setTextSelection({ from: 1, to: 7 })
    })
    const bubble = await screen.findByRole('toolbar', { name: '文本格式' })
    await waitFor(() =>
      expect(within(bubble).getByRole('button', { name: '斜体' }).getAttribute('aria-pressed')).toBe(
        'true',
      ),
    )
    spy.mockRestore()
  })

  it('bubbleMenu={false} 不渲染气泡菜单', async () => {
    const { getEditor } = renderEditor({ bubbleMenu: false, defaultValue: '<p>文本</p>' })
    const editor = await editorReady(getEditor)
    const spy = mockBubbleSelection()
    act(() => {
      editor.view.dom.focus()
      editor.commands.setTextSelection({ from: 1, to: 3 })
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('toolbar', { name: '文本格式' })).toBeNull()
    spy.mockRestore()
  })
})

describe('体检：斜杠命令菜单完整路径', () => {
  it('点击「链接」命令：删除 /、插入占位文本并打开链接弹层', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeInto(editor, '/')
    const listbox = await screen.findByRole('listbox')
    await userEvent.click(within(listbox).getByRole('option', { name: /链接/ }))
    await screen.findByRole('dialog', { name: '编辑链接' })
    expect(editor.getText()).not.toContain('/')
    expect(editor.getText()).toContain('链接')
  })

  it('点击「图片」命令打开图片弹层', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeInto(editor, '/')
    const listbox = await screen.findByRole('listbox')
    await userEvent.click(within(listbox).getByRole('option', { name: /图片/ }))
    await screen.findByRole('dialog', { name: '插入图片' })
    expect(editor.getText()).not.toContain('/')
  })

  it('点击「表格」命令插入 3x3 表格', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeInto(editor, '/')
    const listbox = await screen.findByRole('listbox')
    await userEvent.click(within(listbox).getByRole('option', { name: /表格/ }))
    await waitFor(() => expect(editor.isActive('table')).toBe(true))
    const rows = (editor.getHTML().match(/<tr>/g) ?? []).length
    expect(rows).toBe(3)
  })

  it('无匹配命令时显示空态', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeInto(editor, '/xyz')
    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getByText('没有匹配的命令')).toBeTruthy()
  })
})

describe('体检：链接编辑弹层', () => {
  /**
   * 打开链接弹层并等待输入框获得焦点。
   * LinkPopover 在 rAF 中 focus+select 输入框；jsdom 的 rAF 可能与后续输入
   * 交错（select() 会吃掉首个字符），真实浏览器中 rAF 先于用户按键完成。
   */
  async function openLinkDialog() {
    const dialog = await screen.findByRole('dialog', { name: '编辑链接' })
    const input = within(dialog).getByPlaceholderText('输入链接地址')
    await waitFor(() => expect(document.activeElement).toBe(input))
    return { dialog, input }
  }

  it('设置链接：href 生效并带安全属性', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>选择我</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    const { input } = await openLinkDialog()
    await userEvent.type(input, 'https://example.com')
    await userEvent.click(screen.getByRole('button', { name: '确定' }))
    await waitFor(() =>
      expect(editor.getHTML()).toContain('href="https://example.com"'),
    )
    expect(editor.getHTML()).toContain('rel="noopener noreferrer nofollow"')
    expect(editor.getHTML()).toContain('target="_blank"')
    expect(editor.isActive('link')).toBe(true)
  })

  it('再次打开预填 URL，可移除链接', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>选择我</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    const { input } = await openLinkDialog()
    await userEvent.type(input, 'https://example.com')
    await userEvent.click(screen.getByRole('button', { name: '确定' }))

    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    const { input: input2, dialog: dialog2 } = await openLinkDialog()
    expect((input2 as HTMLInputElement).value).toBe('https://example.com')
    await userEvent.click(within(dialog2).getByRole('button', { name: '移除链接' }))
    await waitFor(() => expect(editor.getHTML()).not.toContain('<a'))
  })

  it('Enter 提交 / Esc 关闭', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>选择我</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    const { input } = await openLinkDialog()
    await userEvent.type(input, 'https://a.b')
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(editor.getHTML()).toContain('href="https://a.b"'))

    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    const { input: input2 } = await openLinkDialog()
    fireEvent.keyDown(input2, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '编辑链接' })).toBeNull())
  })
})

describe('体检：图片插入弹层', () => {
  async function openImageDialog(getEditor: () => Editor | null) {
    await editorReady(getEditor)
    await userEvent.click(screen.getByRole('button', { name: '图片' }))
    return screen.findByRole('dialog', { name: '插入图片' })
  }

  it('URL 插入图片', async () => {
    const { getEditor } = renderEditor({})
    const dialog = await openImageDialog(getEditor)
    await userEvent.type(within(dialog).getByPlaceholderText('输入图片 URL'), 'https://a.com/x.png')
    await userEvent.click(within(dialog).getByRole('button', { name: '插入' }))
    await waitFor(() => expect(getEditor()!.getHTML()).toContain('src="https://a.com/x.png"'))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull())
  })

  it('未配置 uploadImage 时无上传入口', async () => {
    const { getEditor } = renderEditor({})
    const dialog = await openImageDialog(getEditor)
    expect(within(dialog).queryByRole('button', { name: '上传本地图片' })).toBeNull()
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })

  it('配置 uploadImage 后本地上传成功插入', async () => {
    const { promise, resolve } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage })
    const dialog = await openImageDialog(getEditor)

    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(uploadImage).toHaveBeenCalledWith(file)
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: '上传中…' })).toBeTruthy(),
    )
    act(() => resolve('https://cdn.example.com/a.png'))
    await waitFor(() =>
      expect(getEditor()!.getHTML()).toContain('src="https://cdn.example.com/a.png"'),
    )
  })

  it('本地上传失败展示错误并保留弹层', async () => {
    const { promise, reject } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage })
    const dialog = await openImageDialog(getEditor)

    const file = new File(['x'], 'a.png', { type: 'image/png' })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })
    act(() => reject(new Error('boom')))
    await waitFor(() =>
      expect(within(dialog).getByText('图片上传失败，请重试')).toBeTruthy(),
    )
    expect(getEditor()!.getHTML()).not.toContain('<img')
    // 恢复后可重试
    expect(within(dialog).getByRole('button', { name: '上传本地图片' })).toBeTruthy()
  })
})

describe('体检：图片粘贴上传', () => {
  it('配置 uploadImage：粘贴图片 → 占位 → 上传成功替换', async () => {
    const { promise, resolve } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    pasteImageFile(editor, file)
    expect(uploadImage).toHaveBeenCalledWith(file)
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    act(() => resolve('https://cdn.example.com/a.png'))
    await waitFor(() => {
      expect(editor.getHTML()).toContain('src="https://cdn.example.com/a.png"')
      expect(editor.getHTML()).not.toContain('data-uploading')
    })
  })

  it('上传失败：移除占位并弹出错误提示', async () => {
    const { promise, reject } = deferred<string>()
    const { getEditor } = renderEditor({ uploadImage: vi.fn(() => promise) })
    const editor = await editorReady(getEditor)
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    pasteImageFile(editor, file)
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    act(() => reject(new Error('boom')))
    await waitFor(() => {
      expect(editor.getHTML()).not.toContain('<img')
      expect(editor.getHTML()).not.toContain('data-uploading')
    })
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('图片上传失败，请重试')
  })

  it('未配置 uploadImage：粘贴图片被拦截并提示', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    pasteImageFile(editor, file)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('未配置图片上传，请使用 URL 插入')
    expect(editor.getHTML()).not.toContain('<img')
  })

  it('非图片文件粘贴不受影响', async () => {
    const uploadImage = vi.fn()
    const { getEditor } = renderEditor({ uploadImage })
    const editor = await editorReady(getEditor)
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    pasteImageFile(editor, file)
    await new Promise((r) => setTimeout(r, 50))
    expect(uploadImage).not.toHaveBeenCalled()
    expect(editor.getHTML()).not.toContain('<img')
  })
})

describe('体检：表格上下文工具条', () => {
  async function setupTable() {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    await userEvent.click(screen.getByRole('button', { name: '插入表格' }))
    const menu = await screen.findByRole('toolbar', { name: '表格操作' })
    return { editor, menu }
  }

  it('插入表格后出现工具条，可加行加列', async () => {
    const { editor, menu } = await setupTable()
    const rows = () => (editor.getHTML().match(/<tr\b/g) ?? []).length
    const cells = () => (editor.getHTML().match(/<t[dh]\b/g) ?? []).length
    expect(rows()).toBe(3)
    expect(cells()).toBe(9)

    await userEvent.click(within(menu).getByRole('button', { name: '下方插入行' }))
    await waitFor(() => expect(rows()).toBe(4))

    await userEvent.click(within(menu).getByRole('button', { name: '右侧插入列' }))
    await waitFor(() => expect(cells()).toBe(16)) // 4 行 × 4 列
  })

  it('可删除行 / 列 / 整表', async () => {
    const { editor, menu } = await setupTable()
    const rows = () => (editor.getHTML().match(/<tr\b/g) ?? []).length
    const cells = () => (editor.getHTML().match(/<t[dh]\b/g) ?? []).length

    await userEvent.click(within(menu).getByRole('button', { name: '删除当前行' }))
    await waitFor(() => expect(rows()).toBe(2))

    await userEvent.click(within(menu).getByRole('button', { name: '删除当前列' }))
    await waitFor(() => expect(cells()).toBe(4))

    await userEvent.click(within(menu).getByRole('button', { name: '删除表格' }))
    await waitFor(() => expect(editor.getHTML()).not.toContain('<table'))
    await waitFor(() =>
      expect(screen.queryByRole('toolbar', { name: '表格操作' })).toBeNull(),
    )
  })

  it('光标在表格外时不显示工具条', async () => {
    const { editor } = await setupTable()
    act(() => {
      editor.commands.setContent('<p>表格外</p>')
      editor.commands.setTextSelection({ from: 1, to: 2 })
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('toolbar', { name: '表格操作' })).toBeNull()
  })
})
