import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Editor } from '@tiptap/react'
import { renderEditor, editorReady, typeInto, deferred, pasteImageFile, dropImageFile } from './test-utils'

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

  it('aria-activedescendant 随键盘导航更新', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeInto(editor, '/')
    const listbox = await screen.findByRole('listbox')
    // 初始高亮第一项（正文）
    expect(listbox.getAttribute('aria-activedescendant')).toBe('zm-slash-option-p')
    act(() => {
      editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    await waitFor(() =>
      expect(listbox.getAttribute('aria-activedescendant')).toBe('zm-slash-option-h1'),
    )
    expect(screen.getByRole('option', { name: /标题 1/ }).getAttribute('id')).toBe(
      'zm-slash-option-h1',
    )
  })

  it('IME 组合输入期间不拦截键盘（isComposing 守卫）', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    typeInto(editor, '/')
    const listbox = await screen.findByRole('listbox')
    const before = listbox.getAttribute('aria-activedescendant')
    act(() => {
      editor.view.dom.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, isComposing: true }),
      )
    })
    // 组合期 ↑↓ 属于输入法选字，菜单不消费：高亮项不变
    expect(listbox.getAttribute('aria-activedescendant')).toBe(before)
  })

  it('键盘导航后高亮项滚入可视区', async () => {
    // jsdom 未实现 scrollIntoView：临时定义再断言调用
    const spy = vi.fn()
    Object.defineProperty(HTMLButtonElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: spy,
    })
    try {
      const { getEditor } = renderEditor({})
      const editor = await editorReady(getEditor)
      typeInto(editor, '/')
      await screen.findByRole('listbox')
      act(() => {
        editor.view.dom.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        )
      })
      await waitFor(() => expect(spy).toHaveBeenCalledWith({ block: 'nearest' }))
    } finally {
      delete (HTMLButtonElement.prototype as Partial<HTMLButtonElement>).scrollIntoView
    }
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

  it('点击面板外部关闭', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>选择我</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    await screen.findByRole('dialog', { name: '编辑链接' })
    fireEvent.mouseDown(document.body)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '编辑链接' })).toBeNull())
  })

  it('文档级 Esc 关闭（输入框未聚焦时同样生效）', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>选择我</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    await userEvent.click(screen.getByRole('button', { name: '链接' }))
    const { input } = await openLinkDialog()
    act(() => {
      input.blur()
    })
    fireEvent.keyDown(document, { key: 'Escape' })
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

  it('弹层挂载在编辑器根节点内（作用域样式/主题变量生效，不落到 body 末尾）', async () => {
    const { getEditor } = renderEditor({})
    const dialog = await openImageDialog(getEditor)
    // 回归防护：曾以 createPortal(…, document.body) 渲染，导致
    // `.zhimo-editor .zm-popover`（fixed 定位）与 --zm-* 主题变量全部失效，
    // 弹层变成页面底部（body 末尾）的无样式输入框
    expect(dialog.parentElement).not.toBe(document.body)
    expect(dialog.closest('.zhimo-editor')).toBeTruthy()
  })

  it('未配置 uploadImage 时仍保留上传入口（内置 FileReader dataURL）', async () => {
    const { getEditor } = renderEditor({})
    const dialog = await openImageDialog(getEditor)
    expect(within(dialog).getByRole('button', { name: '上传本地图片' })).toBeTruthy()

    const file = new File(['x'], 'a.png', { type: 'image/png' })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })
    // 选文件后面板立即关闭，内置上传替换占位为 dataURL image
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
    await waitFor(() => {
      const html = getEditor()!.getHTML()
      expect(html).toContain('src="data:image/png;base64,')
      expect(html).not.toContain('data-uploading')
    })
  })

  it('配置 uploadImage 后本地上传成功插入：选文件即关面板 → 占位 → 替换', async () => {
    const { promise, resolve } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    await openImageDialog(getEditor)

    const file = new File(['x'], 'a.png', { type: 'image/png' })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })
    expect(uploadImage).toHaveBeenCalledWith(file)
    // 选文件后面板立即关闭，插入流程交给编辑器（占位 → 替换）
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
    await waitFor(() =>
      expect(getEditor()!.getHTML()).toContain('data-uploading="true"'),
    )
    act(() => resolve('https://cdn.example.com/a.png'))
    await waitFor(() => {
      expect(getEditor()!.getHTML()).toContain('src="https://cdn.example.com/a.png"')
      expect(getEditor()!.getHTML()).not.toContain('data-uploading')
    })
  })

  it('本地上传失败：面板已关闭、占位回滚并弹出错误提示', async () => {
    const { promise, reject } = deferred<string>()
    const { getEditor } = renderEditor({ uploadImage: vi.fn(() => promise) })
    await openImageDialog(getEditor)

    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
    act(() => reject(new Error('boom')))
    await waitFor(() => {
      expect(getEditor()!.getHTML()).not.toContain('<img')
      expect(getEditor()!.getHTML()).not.toContain('data-uploading')
    })
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('图片上传失败，请重试')
  })

  it('Esc 关闭面板', async () => {
    const { getEditor } = renderEditor({})
    const dialog = await openImageDialog(getEditor)
    const input = within(dialog).getByPlaceholderText('输入图片 URL')
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
  })

  it('再次点击图片按钮 toggle 关闭面板', async () => {
    renderEditor({})
    const btn = screen.getByRole('button', { name: '图片' })
    await userEvent.click(btn)
    await screen.findByRole('dialog', { name: '插入图片' })
    await userEvent.click(btn)
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
  })

  it('点击面板外关闭面板', async () => {
    const { getEditor } = renderEditor({})
    await openImageDialog(getEditor)
    fireEvent.mouseDown(document.body)
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
  })

  it('重开面板时表单重置（key 重建）', async () => {
    const { getEditor } = renderEditor({})
    const dialog = await openImageDialog(getEditor)
    await userEvent.type(within(dialog).getByPlaceholderText('输入图片 URL'), 'https://x')
    fireEvent.keyDown(within(dialog).getByPlaceholderText('输入图片 URL'), { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '插入图片' })).toBeNull(),
    )
    const dialog2 = await openImageDialog(getEditor)
    expect(
      (within(dialog2).getByPlaceholderText('输入图片 URL') as HTMLInputElement).value,
    ).toBe('')
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

  it('未配置 uploadImage：粘贴图片走内置上传（dataURL）', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    pasteImageFile(editor, new File(['x'], 'a.png', { type: 'image/png' }))
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    await waitFor(() => {
      const html = editor.getHTML()
      expect(html).toContain('src="data:image/png;base64,')
      expect(html).not.toContain('data-uploading')
    })
    // 不再出现「未配置上传」拦截提示
    expect(screen.queryByRole('alert')).toBeNull()
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

  it('uploadImage 同步抛出：移除占位并提示', async () => {
    const uploadImage = vi.fn(() => {
      throw new Error('boom')
    })
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    pasteImageFile(editor, new File(['x'], 'a.png', { type: 'image/png' }))
    await waitFor(() => expect(editor.getHTML()).not.toContain('<img'))
    expect(uploadImage).toHaveBeenCalled()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('图片上传失败，请重试')
  })
})

describe('体检：图片拖拽上传', () => {
  it('配置 uploadImage：拖拽图片 → 占位 → 上传成功替换', async () => {
    const { promise, resolve } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    const file = new File(['x'], 'b.png', { type: 'image/png' })
    dropImageFile(editor, file)
    expect(uploadImage).toHaveBeenCalledWith(file)
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    act(() => resolve('https://cdn.example.com/b.png'))
    await waitFor(() => {
      expect(editor.getHTML()).toContain('src="https://cdn.example.com/b.png"')
      expect(editor.getHTML()).not.toContain('data-uploading')
    })
  })

  it('未配置 uploadImage：拖拽图片走内置上传（dataURL，与粘贴一致）', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    dropImageFile(editor, new File(['x'], 'b.png', { type: 'image/png' }))
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    await waitFor(() => {
      const html = editor.getHTML()
      expect(html).toContain('src="data:image/png;base64,')
      expect(html).not.toContain('data-uploading')
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('并发上传：完成顺序颠倒时各占位精确落位（不串图）', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const uploadImage = vi
      .fn()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise)
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    const a = new File(['a'], 'a.png', { type: 'image/png' })
    const b = new File(['b'], 'b.png', { type: 'image/png' })
    pasteImageFile(editor, a)
    pasteImageFile(editor, b)
    await waitFor(() => {
      expect((editor.getHTML().match(/data-uploading="true"/g) ?? []).length).toBe(2)
    })
    // 第二张先完成（无 data-upload-id 时按「距锚点最近」匹配会串图）
    act(() => fast.resolve('https://cdn.example.com/fast.png'))
    await waitFor(() =>
      expect(editor.getHTML()).toContain('src="https://cdn.example.com/fast.png"'),
    )
    // 第一张后完成
    act(() => slow.resolve('https://cdn.example.com/slow.png'))
    await waitFor(() => {
      expect(editor.getHTML()).toContain('src="https://cdn.example.com/slow.png"')
      expect(editor.getHTML()).toContain('src="https://cdn.example.com/fast.png"')
      expect(editor.getHTML()).not.toContain('data-uploading')
    })
  })
})

describe('体检：只读模式图片上传守卫', () => {
  it('disabled：粘贴图片不触发上传、不插入内容', async () => {
    const uploadImage = vi.fn()
    const { getEditor } = renderEditor({
      disabled: true,
      uploadImage,
      defaultValue: '<p>只读内容</p>',
    })
    const editor = await editorReady(getEditor)
    pasteImageFile(editor, new File(['x'], 'a.png', { type: 'image/png' }))
    await new Promise((r) => setTimeout(r, 50))
    expect(uploadImage).not.toHaveBeenCalled()
    expect(editor.getHTML()).not.toContain('<img')
  })

  it('disabled：拖拽图片不触发上传、不插入内容', async () => {
    const uploadImage = vi.fn()
    const { getEditor } = renderEditor({
      disabled: true,
      uploadImage,
      defaultValue: '<p>只读内容</p>',
    })
    const editor = await editorReady(getEditor)
    dropImageFile(editor, new File(['x'], 'b.png', { type: 'image/png' }))
    await new Promise((r) => setTimeout(r, 50))
    expect(uploadImage).not.toHaveBeenCalled()
    expect(editor.getHTML()).not.toContain('<img')
  })

  it('disabled：uploadAndInsertImage 命令拒绝执行', async () => {
    const uploadImage = vi.fn()
    const { getEditor } = renderEditor({
      disabled: true,
      uploadImage,
      defaultValue: '<p>只读内容</p>',
    })
    const editor = await editorReady(getEditor)
    let result = true
    act(() => {
      result = editor.commands.uploadAndInsertImage(
        new File(['x'], 'c.png', { type: 'image/png' }),
      )
    })
    expect(result).toBe(false)
    expect(uploadImage).not.toHaveBeenCalled()
    expect(editor.getHTML()).not.toContain('<img')
  })
})

describe('体检：uploadAndInsertImage 命令', () => {
  it('上传成功：先占位后替换为真实图片', async () => {
    const { promise, resolve } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    const file = new File(['x'], 'c.png', { type: 'image/png' })
    act(() => {
      editor.commands.uploadAndInsertImage(file)
    })
    expect(uploadImage).toHaveBeenCalledWith(file)
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    act(() => resolve('https://cdn.example.com/c.png'))
    await waitFor(() => {
      expect(editor.getHTML()).toContain('src="https://cdn.example.com/c.png"')
      expect(editor.getHTML()).not.toContain('data-uploading')
    })
  })

  it('上传失败：移除占位并广播 imageUploadError', async () => {
    const { promise, reject } = deferred<string>()
    const uploadImage = vi.fn(() => promise)
    const { getEditor } = renderEditor({ uploadImage, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.uploadAndInsertImage(
        new File(['x'], 'c.png', { type: 'image/png' }),
      )
    })
    await waitFor(() => expect(editor.getHTML()).toContain('data-uploading="true"'))
    const error = vi.fn()
    editor.on('imageUploadError', error)
    act(() => reject(new Error('boom')))
    await waitFor(() => expect(editor.getHTML()).not.toContain('<img'))
    expect(error).toHaveBeenCalledWith({ message: '图片上传失败，请重试' })
  })
})

describe('体检：图片缩放', () => {
  it('插入图片后渲染缩放容器与右下角把手（可编辑态）', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setImage({ src: 'https://a.com/x.png', width: 100, height: 75 })
    })
    await waitFor(() =>
      expect(document.querySelector('[data-resize-container]')).toBeTruthy(),
    )
    expect(
      document.querySelector('[data-resize-handle="bottom-right"]'),
    ).toBeTruthy()
  })

  it('拖拽右下角把手：等比缩放并提交 width/height 属性', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setImage({ src: 'https://a.com/x.png', width: 100, height: 75 })
    })
    const handle = (await waitFor(
      () => document.querySelector('[data-resize-handle]') as HTMLElement,
    ))!
    const img = document.querySelector('[data-resize-wrapper] img') as HTMLImageElement
    // jsdom 无布局：让 offsetWidth/offsetHeight 从 style 反解，模拟真实布局尺寸
    Object.defineProperty(img, 'offsetWidth', {
      configurable: true,
      get: () => parseFloat(img.style.width) || 100,
    })
    Object.defineProperty(img, 'offsetHeight', {
      configurable: true,
      get: () => parseFloat(img.style.height) || 75,
    })
    act(() => {
      handle.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }),
      )
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 160, clientY: 160 }))
      document.dispatchEvent(new MouseEvent('mouseup', { clientX: 160, clientY: 160 }))
    })
    await waitFor(() => {
      const html = editor.getHTML()
      expect(html).toContain('width="160"')
      expect(html).toContain('height="120"')
    })
  })

  it('只读模式不渲染缩放把手', async () => {
    const { getEditor } = renderEditor({ disabled: true, defaultValue: '<p>段落</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setImage({ src: 'https://a.com/x.png' })
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(document.querySelector('[data-resize-handle]')).toBeNull()
  })

  it('dataURL 图片在 HTML 往返解析中保留（allowBase64）', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    const src = 'data:image/png;base64,eA=='
    act(() => {
      editor.commands.setContent(`<p>段落</p><img src="${src}">`)
    })
    expect(editor.getHTML()).toContain(src)
    expect(editor.getJSON().content?.some((n) => n.type === 'image')).toBe(true)
  })

  it('width/height 属性随 HTML 往返保留', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.setContent('<img src="https://a.com/x.png" width="320" height="240">')
    })
    const html = editor.getHTML()
    expect(html).toContain('width="320"')
    expect(html).toContain('height="240"')
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

  it('提供合并 / 拆分单元格：单格选中时禁用，跨格选中后可合并', async () => {
    const { editor, menu } = await setupTable()
    const merge = within(menu).getByRole('button', { name: '合并单元格' }) as HTMLButtonElement
    const split = within(menu).getByRole('button', { name: '拆分单元格' }) as HTMLButtonElement
    expect(merge.disabled).toBe(true)
    expect(split.disabled).toBe(true)

    // 跨格选区（第 1 行前两列）→ 合并可用（anchorCell/headCell 为单元格起始位置）
    const cellPositions: number[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        cellPositions.push(pos)
      }
    })
    expect(cellPositions.length).toBeGreaterThanOrEqual(2)
    const [firstCell, secondCell] = cellPositions
    act(() => {
      editor.commands.setCellSelection({
        anchorCell: firstCell!,
        headCell: secondCell!,
      })
    })
    await waitFor(() => {
      expect(
        (within(menu).getByRole('button', { name: '合并单元格' }) as HTMLButtonElement).disabled,
      ).toBe(false)
    })
    await userEvent.click(merge)
    await waitFor(() => expect(editor.getHTML()).toContain('colspan="2"'))
  })
})
