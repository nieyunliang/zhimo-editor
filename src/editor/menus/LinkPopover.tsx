import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { Link2, Link2Off, X } from 'lucide-react'
import { usePopoverAnchor, usePopoverFlip } from '../utils/popover'

export interface LinkPopoverState {
  open: boolean
  /** 预填 URL（当前选区链接） */
  url: string
}

interface LinkPopoverProps {
  editor: Editor
  state: LinkPopoverState | null
  onClose: () => void
}

/** 链接编辑弹层：设置 / 移除链接 */
export function LinkPopover({ editor, state, onClose }: LinkPopoverProps) {
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

  // 弹出方向翻转（下方放不下时显示在选区上方）
  const flipped = usePopoverFlip(anchor, boxRef)

  // 打开时聚焦输入框（外部系统同步）
  useEffect(() => {
    if (!state?.open) return
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [state, editor])

  const hasLink = editor.isActive('link')

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

  const pos = flipped
    ? { top: anchor.top, left: anchor.left }
    : { top: anchor.bottom, left: anchor.left }

  return createPortal(
    <div
      ref={boxRef}
      className="zm-link-popover zm-popover"
      style={{ top: pos.top, left: pos.left, transform: flipped ? 'translateY(calc(-100% - 12px))' : 'translateY(12px)' }}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="编辑链接"
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
    </div>,
    document.body,
  )
}
