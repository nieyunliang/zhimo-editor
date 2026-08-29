import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { Editor } from '@tiptap/react'

/** 弹层锚点（视口坐标系，配合 fixed 定位） */
export interface PopoverAnchor {
  top: number
  bottom: number
  left: number
}

/** 触发锚点复测的编辑器事件 */
const EDITOR_EVENTS = ['selectionUpdate', 'transaction', 'focus', 'blur'] as const

type EditorEmitter = {
  on(event: string, handler: () => void): void
  off(event: string, handler: () => void): void
}

/**
 * 弹层锚点复测。
 *
 * 通过 getAnchor 回调测量锚点（视口坐标），并在编辑器事件与
 * window scroll/resize 时重新测量；返回值直接驱动「是否显示弹层」
 * （回调返回 null 视为关闭）。
 *
 * @param deps 影响锚点坐标的外部状态（如斜杠菜单的触发位置、
 *             弹层开关），变化时立即重新测量一次。
 */
export function usePopoverAnchor(
  editor: Editor | null,
  getAnchor: () => PopoverAnchor | null,
  deps: readonly unknown[] = [],
): PopoverAnchor | null {
  const [anchor, setAnchor] = useState<PopoverAnchor | null>(null)

  // 每次渲染保持回调最新，避免订阅闭包读到过期状态
  const getAnchorRef = useRef(getAnchor)
  getAnchorRef.current = getAnchor

  useEffect(() => {
    const update = () => setAnchor(getAnchorRef.current())

    update()
    if (!editor) return

    const emitter = editor as unknown as EditorEmitter
    for (const ev of EDITOR_EVENTS) {
      emitter.on(ev, update)
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      for (const ev of EDITOR_EVENTS) {
        emitter.off(ev, update)
      }
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- deps 由调用方声明锚点依赖
  }, [editor, ...deps])

  return anchor
}

/**
 * 弹层翻转判定：锚点下方放不下时向上翻转。
 * 测量依赖 boxRef 指向的弹层 DOM（box 渲染后触发重算）。
 */
export function usePopoverFlip(
  anchor: PopoverAnchor | null,
  boxRef: RefObject<HTMLDivElement | null>,
  offset = 12,
): boolean {
  const [flipped, setFlipped] = useState(false)

  useLayoutEffect(() => {
    if (!anchor || !boxRef.current) return
    const { height } = boxRef.current.getBoundingClientRect()
    setFlipped(anchor.bottom + offset + height > window.innerHeight)
  }, [anchor, boxRef, offset])

  return flipped
}
