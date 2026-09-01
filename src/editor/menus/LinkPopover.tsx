import { useEffect, useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { Link2, Link2Off, X } from 'lucide-react'
import { usePopoverAnchor, usePopoverClamp, usePopoverFlip, type PopoverContainer } from '../utils/popover'
import { PopoverShell } from './PopoverShell'

export interface LinkPopoverState {
  open: boolean
  /** 预填 URL（当前选区链接） */
  url: string
}

interface LinkPopoverProps {
  editor: Editor
  state: LinkPopoverState | null
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
  onClose: () => void
}

/** 链接编辑弹层：设置 / 移除链接 */
export function LinkPopover({ editor, state, container, onClose }: LinkPopoverProps) {
  // 表单状态由 key 重建保证每次打开重置（url 初始值取当前链接）
  const [url, setUrl] = useState(state?.url ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // 打开时定位到选区；jsdom/SSR 无 DOM 测量时保持隐藏（anchor 为 null）
  const anchor = usePopoverAnchor(
    editor,
    () => {
      if (!state?.open) return null
      try {
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        return { top: coords.top, bottom: coords.bottom, left: coords.left }
      } catch {
        return null
      }
    },
    [state?.open],
  )

  // 弹出方向翻转（下方放不下时显示在选区上方）+ 横向钳制在视口内
  const flipped = usePopoverFlip(anchor, boxRef)
  const clampLeft = usePopoverClamp(anchor, boxRef)

  // 打开时聚焦输入框（外部系统同步）
  useEffect(() => {
    if (!state?.open) return
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [state, editor])

  // 点击面板外部 / Esc 关闭（文档级监听：输入框未聚焦时同样生效）
  useEffect(() => {
    if (!state?.open) return
    const onMouseDown = (e: MouseEvent) => {
      if (boxRef.current?.contains(e.target as Node)) return
      onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [state?.open, onClose])

  // 当前选区是否已有链接（经 useEditorState 订阅：渲染期直接调用 isActive
  // 会被 React Compiler 按 editor 引用记忆化，选区变化后不再重算）
  const hasLink = useEditorState({
    editor,
    selector: ({ editor: e }) => !!e?.isActive('link'),
  }) ?? false

  const apply = () => {
    const href = url.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href })
        .run()
    }
    onClose()
  }

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }

  if (!state?.open || !anchor) return null

  return (
    <PopoverShell
      boxRef={boxRef}
      anchor={anchor}
      flipped={flipped}
      clampLeft={clampLeft}
      offset={12}
      container={container}
      className="zm-link-popover"
      role="dialog"
      ariaLabel="编辑链接"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="zm-link-row">
        <Link2 size={15} aria-hidden />
        <input
          ref={inputRef}
          className="zm-link-input"
          value={url}
          placeholder="输入链接地址"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') apply()
            if (e.key === 'Escape') onClose()
          }}
        />
        <button
          type="button"
          className="zm-link-btn"
          aria-label="关闭"
          onClick={onClose}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      <div className="zm-link-actions">
        {hasLink && (
          <button type="button" className="zm-link-btn zm-link-remove" onClick={remove}>
            <Link2Off size={14} aria-hidden />
            移除链接
          </button>
        )}
        <button type="button" className="zm-link-btn zm-link-save" onClick={apply}>
          确定
        </button>
      </div>
    </PopoverShell>
  )
}
