import { useEffect, useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { ChevronDown } from 'lucide-react'

interface HeadingOption {
  label: string
  isActive: (editor: Editor) => boolean
  apply: (editor: Editor) => void
}

const HEADING_OPTIONS: HeadingOption[] = [
  {
    label: '正文',
    isActive: (e) => e.isActive('paragraph'),
    apply: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    label: '标题 1',
    isActive: (e) => e.isActive('heading', { level: 1 }),
    apply: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: '标题 2',
    isActive: (e) => e.isActive('heading', { level: 2 }),
    apply: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: '标题 3',
    isActive: (e) => e.isActive('heading', { level: 3 }),
    apply: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
]

/**
 * 段落格式下拉（正文 / 标题 1-3）。
 *
 * 当前格式必须通过 useEditorState 订阅编辑器状态：
 * 直接在渲染期调用 editor.isActive() 会被 React Compiler 按 editor 引用
 * 记忆化（editor 引用稳定、内部 state 变化不失效），导致标签/选中态
 * 永远停留在首次渲染值。
 */
export function BlockSelect({ editor, disabled = false }: { editor: Editor; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const currentLabel = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return HEADING_OPTIONS[0].label
      return HEADING_OPTIONS.find((o) => o.isActive(e))?.label ?? HEADING_OPTIONS[0].label
    },
  })

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const onDown = (ev: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const label = currentLabel ?? HEADING_OPTIONS[0].label

  return (
    <div className="zm-tool-select" ref={rootRef}>
      <button
        type="button"
        className="zm-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        {label}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div className="zm-dropdown" role="listbox">
          {HEADING_OPTIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              role="option"
              aria-selected={o.label === label}
              className="zm-dropdown-item"
              data-active={o.label === label ? 'true' : 'false'}
              onClick={() => {
                o.apply(editor)
                setOpen(false)
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
