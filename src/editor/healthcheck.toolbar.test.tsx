import { describe, expect, it } from 'vitest'
import { act, cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderEditor, editorReady } from './test-utils'

describe('体检：工具栏全部按钮', () => {
  /** 选中全文并点击指定按钮，返回编辑器 HTML */
  async function toggleAll(buttonName: string) {
    cleanup() // 避免同一测试内多次渲染残留 DOM 导致按钮重名
    const { getEditor } = renderEditor({ defaultValue: '<p>待格式化文本</p>' })
    const editor = await editorReady(getEditor)
    act(() => {
      editor.commands.selectAll()
    })
    await userEvent.click(screen.getByRole('button', { name: buttonName }))
    return editor
  }

  it('加粗/斜体/下划线/删除线/行内代码 可切换且状态激活', async () => {
    const cases: Array<[string, string, string]> = [
      ['加粗', 'bold', '<strong>'],
      ['斜体', 'italic', '<em>'],
      ['下划线', 'underline', '<u>'],
      ['删除线', 'strike', '<s>'],
      ['行内代码', 'code', '<code>'],
    ]
    for (const [btn, mark, tag] of cases) {
      const editor = await toggleAll(btn)
      expect(editor.isActive(mark), `${btn} 应激活 ${mark}`).toBe(true)
      expect(editor.getHTML(), `${btn} 应输出 ${tag}`).toContain(tag)
    }
  })

  it('无序/有序列表切换', async () => {
    // block 类转换后光标会移到文档末尾空段落，故断言 HTML 结构而非 isActive
    const ul = await toggleAll('无序列表')
    expect(ul.getHTML()).toContain('<ul><li>')

    const ol = await toggleAll('有序列表')
    expect(ol.getHTML()).toContain('<ol><li>')
  })

  it('引用 / 代码块 / 分割线', async () => {
    const quote = await toggleAll('引用')
    expect(quote.getHTML()).toContain('<blockquote>')

    const code = await toggleAll('代码块')
    expect(code.getHTML()).toContain('<pre><code>')

    const hr = await toggleAll('分割线')
    expect(hr.getHTML()).toContain('<hr>')
  })

  it('撤销/重做：初始禁用，操作后可用并生效', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)
    expect((screen.getByRole('button', { name: '撤销' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '重做' }) as HTMLButtonElement).disabled).toBe(true)

    act(() => {
      editor.commands.insertContent('<p>第一笔</p>')
    })
    const undo = await waitFor(() => {
      const btn = screen.getByRole('button', { name: '撤销' }) as HTMLButtonElement
      expect(btn.disabled).toBe(false)
      return btn
    })
    await userEvent.click(undo)
    expect(editor.getText()).not.toContain('第一笔')

    const redo = await waitFor(() => {
      const btn = screen.getByRole('button', { name: '重做' }) as HTMLButtonElement
      expect(btn.disabled).toBe(false)
      return btn
    })
    await userEvent.click(redo)
    expect(editor.getText()).toContain('第一笔')
  })

  it('段落下拉：切换标题 1-3 与正文，trigger 同步当前格式', async () => {
    const { getEditor } = renderEditor({})
    const editor = await editorReady(getEditor)

    const trigger = screen.getByRole('button', { name: /正文/ })
    await userEvent.click(trigger)
    const listbox = screen.getByRole('listbox')

    await userEvent.click(within(listbox).getByRole('option', { name: '标题 2' }))
    expect(editor.isActive('heading', { level: 2 })).toBe(true)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /标题 2/ })).toBeTruthy(),
    )

    await userEvent.click(screen.getByRole('button', { name: /标题 2/ }))
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: '正文' }))
    expect(editor.isActive('paragraph')).toBe(true)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /正文/ })).toBeTruthy(),
    )
  })

  it('工具栏含 aria 语义（toolbar role + 按钮 aria-label/pressed）', async () => {
    const { getEditor } = renderEditor({ defaultValue: '<p>待格式化文本</p>' })
    const editor = await editorReady(getEditor)
    const toolbar = screen.getByRole('toolbar', { name: '编辑工具栏' })
    expect(toolbar).toBeTruthy()
    const bold = within(toolbar).getByRole('button', { name: '加粗' })
    expect(bold.getAttribute('aria-pressed')).toBe('false')
    act(() => {
      editor.commands.selectAll()
    })
    await userEvent.click(bold)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '加粗' }).getAttribute('aria-pressed')).toBe('true'),
    )
  })
})
