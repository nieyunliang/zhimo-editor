import type { MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { PopoverAnchor, PopoverContainer } from '../utils/popover'

interface PopoverShellProps {
  boxRef: RefObject<HTMLDivElement | null>
  /** 已测量的锚点（仅非 null 时渲染外壳） */
  anchor: PopoverAnchor
  /** 垂直翻转（锚点下方放不下） */
  flipped: boolean
  /** 横向钳制后的左缘（null = 跟随锚点） */
  clampLeft?: number | null
  /** 与锚点的间距，默认 8 */
  offset?: number
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
  className: string
  role: string
  ariaLabel: string
  /** listbox 类弹层的键盘高亮项（SlashMenu 键盘导航用） */
  ariaActiveDescendant?: string
  /** 斜杠/气泡等需要预防选区丢失的菜单传 preventDefault；输入类弹层传 stopPropagation */
  onMouseDown?: (e: ReactMouseEvent<HTMLDivElement>) => void
  children: ReactNode
}

/**
 * 弹层通用外壳：fixed 定位 + createPortal + 翻转/钳制坐标换算。
 *
 * 全库弹层（气泡 / 斜杠 / 链接 / 图片 / 表格工具条）共用，
 * 保证滚动跟随与视口适配（垂直翻转 + 横向钳制）逻辑单一来源。
 */
export function PopoverShell({
  boxRef,
  anchor,
  flipped,
  clampLeft,
  offset = 8,
  container,
  className,
  role,
  ariaLabel,
  ariaActiveDescendant,
  onMouseDown,
  children,
}: PopoverShellProps) {
  return createPortal(
    <div
      ref={boxRef}
      className={`${className} zm-popover`}
      style={{
        top: flipped ? anchor.top : anchor.bottom,
        left: clampLeft ?? anchor.left,
        transform: flipped
          ? `translateY(calc(-100% - ${offset}px))`
          : `translateY(${offset}px)`,
      }}
      onMouseDown={onMouseDown}
      role={role}
      aria-label={ariaLabel}
      aria-activedescendant={ariaActiveDescendant}
    >
      {children}
    </div>,
    container?.current ?? document.body,
  )
}
