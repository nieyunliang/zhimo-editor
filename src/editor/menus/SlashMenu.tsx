import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Table,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'

interface SlashItem {
  id: string
  label: string
  hint?: string
  icon: LucideIcon
  keywords?: string[]
  run: (editor: Editor) => void
}

/** 斜杠命令清单（分组展示） */
const SLASH_GROUPS: Array<{ title: string; items: SlashItem[] }> = [
  {
    title: '文本',
    items: [
      {
        id: 'p',
        label: '正文',
        icon: Pilcrow,
        keywords: ['段落', 'paragraph'],
        run: (e) => e.chain().focus().setParagraph().run(),
      },
      {
        id: 'h1',
        label: '标题 1',
        hint: '大标题',
        icon: Heading1,
        keywords: ['一级'],
        run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: 'h2',
        label: '标题 2',
        hint: '中标题',
        icon: Heading2,
        keywords: ['二级'],
        run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: 'h3',
        label: '标题 3',
        hint: '小标题',
        icon: Heading3,
        keywords: ['三级'],
        run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
  },
  {
    title: '列表',
    items: [
      {
        id: 'ul',
        label: '无序列表',
        icon: List,
        keywords: ['圆点', 'bullet'],
        run: (e) => e.chain().focus().toggleBulletList().run(),
      },
      {
        id: 'ol',
        label: '有序列表',
        icon: ListOrdered,
        keywords: ['编号', 'numbered'],
        run: (e) => e.chain().focus().toggleOrderedList().run(),
      },
    ],
  },
  {
    title: '块',
    items: [
      {
        id: 'quote',
        label: '引用',
        icon: Quote,
        keywords: ['blockquote'],
        run: (e) => e.chain().focus().toggleBlockquote().run(),
      },
      {
        id: 'codeblock',
        label: '代码块',
        icon: Code2,
        keywords: ['code'],
        run: (e) => e.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: 'hr',
        label: '分割线',
        icon: Minus,
        keywords: ['分隔', 'hr'],
        run: (e) => e.chain().focus().setHorizontalRule().run(),
      },
    ],
  },
  {
    title: '插入',
    items: [
      {
        id: 'link',
        label: '链接',
        icon: Link2,
        keywords: ['网址', 'url'],
        run: (e) => {
          const pos = e.state.selection.from
          e.chain().focus().insertContentAt(pos, '链接').run()
          e.commands.setTextSelection({ from: pos, to: pos + 2 })
        },
      },
      {
        id: 'image',
        label: '图片',
        icon: ImageIcon,
        keywords: ['插图', 'img'],
        run: () => {},
      },
      {
        id: 'table',
        label: '表格',
        icon: Table,
        keywords: ['3x3'],
        run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
    ],
  },
]

const ALL_ITEMS = SLASH_GROUPS.flatMap((g) => g.items)

interface SlashMenuProps {
  editor: Editor
  /** 链接项点击后调用（编辑器已插入占位文本并选中） */
  onOpenLink: () => void
  /** 图片项点击后调用 */
  onOpenImage: () => void
}

interface MenuState {
  /** '/' 字符所在文档位置（用于删除与定位） */
  pos: number
  /** '/' 之后的过滤关键字 */
  query: string
}

/** 锚点坐标（视口坐标系） */
interface Anchor {
  top: number
  bottom: number
  left: number
}

/** 斜杠命令菜单：输入 / 触发，支持过滤与键盘导航 */
export function SlashMenu({ editor, onOpenLink, onOpenImage }: SlashMenuProps) {
  const [state, setState] = useState<MenuState | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [flipped, setFlipped] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  /** 按 query 过滤命令 */
  const items = useMemo(() => {
    if (!state) return []
    const q = state.query.trim().toLowerCase()
    if (!q) return ALL_ITEMS
    return ALL_ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.keywords?.some((k) => k.includes(q) || q.includes(k)),
    )
  }, [state])

  useEffect(() => {
    setActiveIndex(0)
  }, [state?.query])

  /** 检测 '/' 触发 / 更新过滤词 / 关闭 */
  useEffect(() => {
    const onUpdate = () => {
      if (!editor.isFocused) {
        setState(null)
        return
      }
      const { state: s } = editor
      const { $from } = s.selection
      if (s.selection.empty && $from.parent.type.name === 'paragraph') {
        const text = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
        if (text.startsWith('/')) {
          setState({ pos: $from.pos - text.length, query: text.slice(1) })
          return
        }
      }
      setState(null)
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor])

  /** 选区移动（点击/非导航键移动光标）时关闭 */
  useEffect(() => {
    if (!state) return
    const onSel = () => setState(null)
    editor.on('selectionUpdate', onSel)
    return () => {
      editor.off('selectionUpdate', onSel)
    }
  }, [editor, state])

  /** 定位到 '/' 字符 */
  useEffect(() => {
    if (!state) return
    try {
      const coords = editor.view.coordsAtPos(state.pos)
      setAnchor({ top: coords.top, bottom: coords.bottom, left: coords.left })
    } catch {
      // 环境不支持 DOM 测量（如 jsdom/SSR 测试）时降级为固定锚点
      setAnchor({ top: 0, bottom: 0, left: 0 })
    }
    setFlipped(false)
  }, [editor, state])

  /** 键盘导航 */
  useEffect(() => {
    if (!state || items.length === 0) return
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault()
        setActiveIndex((i) => (i + 1) % items.length)
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault()
        setActiveIndex((i) => (i - 1 + items.length) % items.length)
      } else if (ev.key === 'Enter') {
        ev.preventDefault()
        execute(items[activeIndex])
      } else if (ev.key === 'Escape') {
        ev.preventDefault()
        setState(null)
      }
    }
    editor.view.dom.addEventListener('keydown', onKeyDown)
    return () => editor.view.dom.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, state, items, activeIndex])

  /** 失焦关闭 */
  useEffect(() => {
    const onBlur = () => setState(null)
    editor.on('blur', onBlur)
    return () => {
      editor.off('blur', onBlur)
    }
  }, [editor])

  /** 执行命令：先删除 '/' 及过滤文本 */
  const execute = (item: SlashItem) => {
    if (!state) return
    const { pos, query } = state
    editor.chain().focus().deleteRange({ from: pos, to: pos + query.length + 1 }).run()
    setState(null)
    if (item.id === 'image') {
      onOpenImage()
    } else {
      // link 项的 run 会插入「链接」占位文本并选中，随后打开弹层让链接落到该文本上
      item.run(editor)
      if (item.id === 'link') onOpenLink()
    }
  }

  /** 视口放不下时向上翻转 */
  useEffect(() => {
    if (!anchor || !boxRef.current) return
    const { height } = boxRef.current.getBoundingClientRect()
    setFlipped(anchor.bottom + 8 + height > window.innerHeight)
  }, [anchor])

  if (!state || !anchor) return null

  return createPortal(
    <div
      ref={boxRef}
      className="zm-slash-menu zm-popover"
      style={{
        top: flipped ? anchor.top : anchor.bottom,
        left: anchor.left,
        transform: flipped ? 'translateY(calc(-100% - 8px))' : 'translateY(8px)',
      }}
      onMouseDown={(e) => e.preventDefault()}
      role="listbox"
      aria-label="命令菜单"
    >
      {items.length === 0 && (
        <div className="zm-slash-empty">没有匹配的命令</div>
      )}
      {SLASH_GROUPS.map((group) => {
        const groupItems = items.filter((i) => group.items.some((g) => g.id === i.id))
        if (groupItems.length === 0) return null
        return (
          <div key={group.title}>
            <div className="zm-slash-group">{group.title}</div>
            {groupItems.map((item) => {
              const index = items.indexOf(item)
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className="zm-slash-item"
                  data-active={index === activeIndex ? 'true' : 'false'}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => execute(item)}
                >
                  <span className="zm-slash-icon">
                    <item.icon size={16} aria-hidden />
                  </span>
                  <span className="zm-slash-label">
                    {item.label}
                    {item.hint && <em className="zm-slash-hint">{item.hint}</em>}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
