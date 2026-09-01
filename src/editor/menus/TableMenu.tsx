import { useRef } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Combine,
  Rows3,
  Columns3,
  Split,
  Trash2,
} from 'lucide-react'
import { usePopoverAnchor, usePopoverClamp, usePopoverFlip, type PopoverContainer } from '../utils/popover'
import { PopoverShell } from './PopoverShell'

interface TableMenuProps {
  editor: Editor
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
}

/** 表格上下文工具条：光标在表格内时显示结构操作（插入/合并/删除行列） */
export function TableMenu({ editor, container }: TableMenuProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  // 合并/拆分可用性必须经 useEditorState 订阅：渲染期直接调用 editor.can()
  // 会被 React Compiler 按 editor 引用记忆化，选区变化后不会再重算
  const canState = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? { canMerge: e.can().mergeCells(), canSplit: e.can().splitCell() }
        : { canMerge: false, canSplit: false },
  })
  const canMerge = canState?.canMerge ?? false
  const canSplit = canState?.canSplit ?? false

  // 选区/滚动/缩放时复测锚点；失焦或光标不在表格内时关闭
  const anchor = usePopoverAnchor(editor, () => {
    if (!editor.isFocused || !editor.isActive('table')) return null
    try {
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      // top/bottom 都是原子单元格行：上方放不下时工具条翻转到光标的行上方
      return { top: coords.top, bottom: coords.bottom, left: coords.left }
    } catch {
      return null
    }
  })

  // 视口放不下时向上翻转；横向钳制在视口内
  const flipped = usePopoverFlip(anchor, boxRef, 8)
  const clampLeft = usePopoverClamp(anchor, boxRef)

  if (!anchor) return null

  const actions: Array<{
    label: string
    icon: typeof ArrowUp
    disabled?: boolean
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
    {
      label: '合并单元格',
      icon: Combine,
      disabled: !canMerge,
      run: () => editor.chain().focus().mergeCells().run(),
    },
    {
      label: '拆分单元格',
      icon: Split,
      disabled: !canSplit,
      run: () => editor.chain().focus().splitCell().run(),
    },
  ]

  return (
    <PopoverShell
      boxRef={boxRef}
      anchor={anchor}
      flipped={flipped}
      clampLeft={clampLeft}
      container={container}
      className="zm-table-menu"
      role="toolbar"
      ariaLabel="表格操作"
      onMouseDown={(e) => e.preventDefault()}
    >
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className="zm-table-btn"
          title={a.label}
          aria-label={a.label}
          disabled={a.disabled}
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
    </PopoverShell>
  )
}
