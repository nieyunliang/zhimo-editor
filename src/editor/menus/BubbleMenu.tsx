import { useRef } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import { Link2 } from 'lucide-react'
import { INLINE_MARKS } from '../commands'
import { ToolButton } from '../toolbar/Button'
import { ToolDivider } from '../toolbar/Divider'
import { usePopoverAnchor, usePopoverClamp, usePopoverFlip, type PopoverContainer } from '../utils/popover'
import { PopoverShell } from './PopoverShell'

interface BubbleMenuProps {
  editor: Editor
  onOpenLink: () => void
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
}

/** 获取当前 DOM 选区矩形（视口坐标） */
function getSelectionRect(): { top: number; bottom: number; left: number } | null {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return null
    return { top: rect.top, bottom: rect.bottom, left: rect.left }
  } catch {
    return null
  }
}

/** 选中文本浮动菜单：加粗/斜体/下划线/删除线/行内代码/链接 */
export function BubbleMenu({ editor, onOpenLink, container }: BubbleMenuProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        code: e.isActive('code'),
        link: e.isActive('link'),
      }
    },
  })

  // 选区变化 / 滚动 / 缩放时复测锚点；空选区、节点选区与单元格选区不显示
  const rect = usePopoverAnchor(editor, () => {
    const sel = editor.state.selection
    const isNodeSel = sel instanceof NodeSelection
    const isCellSel = (sel as { isCellSelection?: boolean }).isCellSelection === true
    if (sel.empty || isNodeSel || isCellSel || !editor.isFocused) return null
    return getSelectionRect()
  })

  // 翻转：下方放不下时显示在选区上方；横向钳制在视口内
  const flipped = usePopoverFlip(rect, boxRef)
  const clampLeft = usePopoverClamp(rect, boxRef)

  if (!rect || !state) return null

  return (
    <PopoverShell
      boxRef={boxRef}
      anchor={rect}
      flipped={flipped}
      clampLeft={clampLeft}
      offset={12}
      container={container}
      className="zm-bubble-menu"
      role="toolbar"
      ariaLabel="文本格式"
      onMouseDown={(e) => e.preventDefault()}
    >
      {INLINE_MARKS.map((m) => (
        <ToolButton
          key={m.mark}
          icon={m.icon}
          label={m.label}
          active={state[m.mark]}
          onClick={() => m.run(editor)}
        />
      ))}
      <ToolDivider />
      <ToolButton
        icon={Link2}
        label="链接"
        active={state.link}
        onClick={onOpenLink}
      />
    </PopoverShell>
  )
}
