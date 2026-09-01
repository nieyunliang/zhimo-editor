import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { ChevronDown } from 'lucide-react'
import { EDITOR_COMMANDS, type CommandContext } from '../commands'

/** 段落格式选项（正文 / 标题 1-3），与斜杠菜单共用注册表 */
const BLOCK_OPTIONS = EDITOR_COMMANDS.filter((c) => c.group === 'text')
const DEFAULT_LABEL = BLOCK_OPTIONS[0]?.label ?? '正文'

/**
 * 段落格式下拉（正文 / 标题 1-3）。
 *
 * 当前格式必须通过 useEditorState 订阅编辑器状态：
 * 直接在渲染期调用 editor.isActive() 会被 React Compiler 按 editor 引用
 * 记忆化（editor 引用稳定、内部 state 变化不失效），导致标签/选中态
 * 永远停留在首次渲染值。
 *
 * 键盘支持：↑/↓ 移动高亮、Enter 应用、Escape 关闭。
 * 打开期间在 document 上监听 keydown：工具栏按钮点击后编辑器可能以 rAF
 * 抢回焦点，事件不再经过本组件包装层，document 级监听保证键盘可用。
 */
export function BlockSelect({
  editor,
  ctx,
  disabled = false,
}: {
  editor: Editor
  ctx: CommandContext
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  const currentLabel = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return DEFAULT_LABEL
      return BLOCK_OPTIONS.find((o) => o.isActive?.(e))?.label ?? DEFAULT_LABEL
    },
  })

  const label = currentLabel ?? DEFAULT_LABEL
  const selectedIndex = BLOCK_OPTIONS.findIndex((o) => o.label === label)
  const highlighted = highlight >= 0 ? BLOCK_OPTIONS[highlight] : undefined

  const openList = () => {
    setHighlight(selectedIndex < 0 ? 0 : selectedIndex)
    setOpen(true)
  }

  const closeList = () => {
    setOpen(false)
    setHighlight(-1)
  }

  // 打开期间：点击外部关闭 + document keydown 键盘导航
  useEffect(() => {
    if (!open || disabled) return
    const onDown = (ev: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        closeList()
      }
    }
    const onKeyDown = (ev: globalThis.KeyboardEvent) => {
      // IME 组合输入期间不拦截（中文输入法 Enter/↑↓ 用于选字/提交）
      if (ev.isComposing) return
      if (ev.key === 'ArrowDown') {
        ev.preventDefault()
        setHighlight((i) => Math.min(i + 1, BLOCK_OPTIONS.length - 1))
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault()
        setHighlight((i) => Math.max(i - 1, 0))
      } else if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        const option = highlighted
        if (option) {
          option.run(editor, ctx)
          closeList()
        }
      } else if (ev.key === 'Escape') {
        ev.preventDefault()
        closeList()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open, highlighted, disabled, editor, ctx])

  /** 关闭态：trigger 上的键盘触发打开 */
  const onTriggerKeyDown = (ev: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled || open) return
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      openList()
    }
  }

  return (
    <div className="zm-tool-select" ref={rootRef}>
      <button
        type="button"
        className="zm-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        {label}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div
          className="zm-dropdown"
          role="listbox"
          aria-activedescendant={highlighted ? `zm-option-${highlighted.id}` : undefined}
        >
          {BLOCK_OPTIONS.map((o, index) => (
            <button
              key={o.id}
              id={`zm-option-${o.id}`}
              type="button"
              role="option"
              aria-selected={o.label === label}
              className="zm-dropdown-item"
              data-active={o.label === label ? 'true' : 'false'}
              onMouseEnter={() => setHighlight(index)}
              onFocus={() => setHighlight(index)}
              onClick={() => {
                o.run(editor, ctx)
                closeList()
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
