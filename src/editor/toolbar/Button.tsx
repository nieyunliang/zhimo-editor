import type { LucideIcon } from 'lucide-react'

export interface ToolButtonProps {
  icon: LucideIcon
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

/** 工具栏图标按钮（hover 显示中文 tooltip + 快捷键） */
export function ToolButton({
  icon: Icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
}: ToolButtonProps) {
  const tooltip = shortcut ? `${label}（${shortcut}）` : label
  return (
    <button
      type="button"
      className="zm-tool-btn"
      data-active={active ? 'true' : 'false'}
      data-tooltip={tooltip}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active ?? false}
      onClick={onClick}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
    </button>
  )
}
