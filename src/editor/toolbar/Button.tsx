import type { Ref } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface ToolButtonProps {
  icon: LucideIcon
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  /** 底层 button 元素引用（如「图片」按钮作为插入面板的定位锚点） */
  buttonRef?: Ref<HTMLButtonElement>
}

/** 工具栏图标按钮（hover 显示中文 tooltip + 快捷键） */
export function ToolButton({
  icon: Icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
  buttonRef,
}: ToolButtonProps) {
  const tooltip = shortcut ? `${label}（${shortcut}）` : label
  return (
    <button
      ref={buttonRef}
      type="button"
      className="zm-tool-btn"
      data-active={active ? 'true' : 'false'}
      data-tooltip={tooltip}
      disabled={disabled}
      aria-label={label}
      // 仅 toggle 类按钮声明 active 时携带 aria-pressed；动作按钮（撤销/插入等）不应播报按下状态
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
    </button>
  )
}
