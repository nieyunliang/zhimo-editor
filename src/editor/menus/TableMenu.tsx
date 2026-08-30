import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Rows3,
  Columns3,
  Trash2,
} from 'lucide-react'
import { usePopoverAnchor, type PopoverContainer } from '../utils/popover'

interface TableMenuProps {
  editor: Editor
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
}

/** 表格上下文工具条：光标在表格内时显示插入/删除行列操作 */
export function TableMenu({ editor, container }: TableMenuProps) {
  // 选区/滚动/缩放时复测锚点；失焦或光标不在表格内时关闭
  const anchor = usePopoverAnchor(editor, () => {
    if (!editor.isFocused || !editor.isActive('table')) return null
    try {
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      return { top: coords.bottom, bottom: coords.bottom, left: coords.left }
    } catch {
      return null
    }
  })

  if (!anchor) return null

  const actions: Array<{
    label: string
    icon: typeof ArrowUp
    run: () => void
  }> = [
    {
      label: '上方插入行',
      icon: ArrowUp,
      run: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      label: '下方插入行',
      icon: ArrowDown,
      run: () => editor.chain().focus().addRowAfter().run(),
    },
    {
      label: '左侧插入列',
      icon: ArrowLeft,
      run: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      label: '右侧插入列',
      icon: ArrowRight,
      run: () => editor.chain().focus().addColumnAfter().run(),
    },
  ]

  return createPortal(
    <div
      className="zm-table-menu zm-popover"
      style={{ top: anchor.top, left: anchor.left, transform: 'translateY(8px)' }}
      onMouseDown={(e) => e.preventDefault()}
      role="toolbar"
      aria-label="表格操作"
    >
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className="zm-table-btn"
          title={a.label}
          aria-label={a.label}
          onClick={a.run}
        >
          <a.icon size={14} aria-hidden />
        </button>
      ))}
      <span className="zm-tool-divider" aria-hidden />
      <button
        type="button"
        className="zm-table-btn"
        title="删除当前行"
        aria-label="删除当前行"
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <Rows3 size={14} aria-hidden />
        <span className="zm-table-btn-sub">行</span>
      </button>
      <button
        type="button"
        className="zm-table-btn"
        title="删除当前列"
        aria-label="删除当前列"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <Columns3 size={14} aria-hidden />
        <span className="zm-table-btn-sub">列</span>
      </button>
      <button
        type="button"
        className="zm-table-btn zm-table-btn-danger"
        title="删除表格"
        aria-label="删除表格"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2 size={14} aria-hidden />
      </button>
    </div>,
    container?.current ?? document.body,
  )
}
