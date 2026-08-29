import { useEffect, useState } from 'react'
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

interface TableMenuProps {
  editor: Editor
}

interface Anchor {
  top: number
  left: number
}

/** 表格上下文工具条：光标在表格内时显示插入/删除行列操作 */
export function TableMenu({ editor }: TableMenuProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)

  useEffect(() => {
    const update = () => {
      if (!editor.isFocused || !editor.isActive('table')) {
        setAnchor(null)
        return
      }
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.from)
        setAnchor({ top: coords.bottom, left: coords.left })
      } catch {
        setAnchor(null)
      }
    }
    const onBlur = () => setAnchor(null)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    editor.on('focus', update)
    editor.on('blur', onBlur)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
      editor.off('focus', update)
      editor.off('blur', onBlur)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editor])

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
    document.body,
  )
}
