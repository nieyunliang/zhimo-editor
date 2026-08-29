import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEditorState, type Editor } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import { Bold, Italic, Underline, Strikethrough, Code, Link2 } from 'lucide-react'
import { ToolButton } from '../toolbar/Button'
import { ToolDivider } from '../toolbar/Divider'
import { usePopoverAnchor, usePopoverFlip } from '../utils/popover'

interface BubbleMenuProps {
  editor: Editor
  onOpenLink: () => void
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
export function BubbleMenu({ editor, onOpenLink }: BubbleMenuProps) {
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

  // 翻转：下方放不下时显示在选区上方
  const flipped = usePopoverFlip(rect, boxRef)

  if (!rect || !state) return null

  const pos = flipped
    ? { top: rect.top, left: rect.left }
    : { top: rect.bottom, left: rect.left }

  return createPortal(
    <div
      ref={boxRef}
      className="zm-bubble-menu zm-popover"
      style={{
        top: pos.top,
        left: pos.left,
        transform: flipped ? 'translateY(calc(-100% - 12px))' : 'translateY(12px)',
      }}
      onMouseDown={(e) => e.preventDefault()}
      role="toolbar"
      aria-label="文本格式"
    >
      <ToolButton
        icon={Bold}
        label="加粗"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolButton
        icon={Italic}
        label="斜体"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolButton
        icon={Underline}
        label="下划线"
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolButton
        icon={Strikethrough}
        label="删除线"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolButton
        icon={Code}
        label="行内代码"
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolDivider />
      <ToolButton
        icon={Link2}
        label="链接"
        active={state.link}
        onClick={onOpenLink}
      />
    </div>,
    document.body,
  )
}
