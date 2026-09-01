import { useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  COMMAND_GROUPS,
  EDITOR_COMMANDS,
  type CommandContext,
  type EditorCommand,
} from '../commands'
import { usePopoverAnchor, usePopoverClamp, usePopoverFlip, type PopoverContainer } from '../utils/popover'
import type { ImageInsertAnchor } from '../types'
import { PopoverShell } from './PopoverShell'

interface SlashMenuProps {
  editor: Editor
  /** 链接项点击后调用（编辑器已插入占位文本并选中） */
  onOpenLink: () => void
  /** 图片项点击后调用；传入锚点以定位图片插入面板 */
  onOpenImage: (anchor?: ImageInsertAnchor) => void
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
}

interface MenuState {
  /** '/' 字符所在文档位置（用于删除与定位） */
  pos: number
  /** '/' 之后的过滤关键字 */
  query: string
}

/** 斜杠命令菜单：输入 / 触发，支持过滤与键盘导航 */
export function SlashMenu({ editor, onOpenLink, onOpenImage, container }: SlashMenuProps) {
  const [state, setState] = useState<MenuState | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  /** 键盘导航标记：仅键盘 ↑↓ 后滚轮对齐，悬停不滚动菜单 */
  const navByKeyboard = useRef(false)
  const activeItemRef = useRef<HTMLButtonElement>(null)

  /** 按 query 过滤命令 */
  const items = useMemo(() => {
    if (!state) return []
    const q = state.query.trim().toLowerCase()
    if (!q) return EDITOR_COMMANDS
    return EDITOR_COMMANDS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.keywords?.some((k) => k.includes(q) || q.includes(k)),
    )
  }, [state])

  useEffect(() => {
    setActiveIndex(0)
  }, [state?.query])

  /** 键盘导航后把高亮项滚入可视区（菜单 max-height 会裁剪后半列表） */
  useEffect(() => {
    if (!navByKeyboard.current || !state) return
    navByKeyboard.current = false
    // jsdom 未实现 scrollIntoView：可选链降级，测试环境不抛错
    activeItemRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, state])

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

  /** 定位到 '/' 字符；jsdom/SSR 无 DOM 测量时降级为固定锚点保持可见 */
  const anchor = usePopoverAnchor(
    editor,
    () => {
      if (!state) return null
      try {
        const coords = editor.view.coordsAtPos(state.pos)
        return { top: coords.top, bottom: coords.bottom, left: coords.left }
      } catch {
        return { top: 0, bottom: 0, left: 0 }
      }
    },
    [state],
  )

  // 视口放不下时向上翻转；横向钳制在视口内
  const flipped = usePopoverFlip(anchor, boxRef, 8)
  const clampLeft = usePopoverClamp(anchor, boxRef)

  /** 键盘导航 */
  useEffect(() => {
    if (!state || items.length === 0) return
    const onKeyDown = (ev: KeyboardEvent) => {
      // IME 组合输入期间不拦截（中文输入法 Enter 提交拼音、↑↓ 选字）
      if (ev.isComposing) return
      if (ev.key === 'ArrowDown') {
        ev.preventDefault()
        navByKeyboard.current = true
        setActiveIndex((i) => (i + 1) % items.length)
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault()
        navByKeyboard.current = true
        setActiveIndex((i) => (i - 1 + items.length) % items.length)
      } else if (ev.key === 'Enter') {
        ev.preventDefault()
        const item = items[activeIndex]
        if (item) execute(item)
      } else if (ev.key === 'Escape') {
        ev.preventDefault()
        setState(null)
      }
    }
    editor.view.dom.addEventListener('keydown', onKeyDown)
    return () => editor.view.dom.removeEventListener('keydown', onKeyDown)
    // oxlint-disable-next-line react/exhaustive-deps -- activeIndex/items 需随订阅更新
  }, [editor, state, items, activeIndex])

  /** 失焦关闭 */
  useEffect(() => {
    const onBlur = () => setState(null)
    editor.on('blur', onBlur)
    return () => {
      editor.off('blur', onBlur)
    }
  }, [editor])

  /** 执行命令：先删除 '/' 及过滤文本，再执行命令本身 */
  const execute = (item: EditorCommand) => {
    if (!state) return
    const { pos, query } = state
    editor.chain().focus().deleteRange({ from: pos, to: pos + query.length + 1 }).run()
    setState(null)
    const ctx: CommandContext = { openLink: onOpenLink, openImage: onOpenImage }
    // link 项的 run 会插入「链接」占位文本并选中，随后打开弹层让链接落到该文本上
    item.run(editor, ctx)
  }

  if (!state || !anchor) return null

  const activeItem = items[activeIndex]
  const activeId = activeItem ? `zm-slash-option-${activeItem.id}` : undefined

  return (
    <PopoverShell
      boxRef={boxRef}
      anchor={anchor}
      flipped={flipped}
      clampLeft={clampLeft}
      container={container}
      className="zm-slash-menu"
      role="listbox"
      ariaLabel="命令菜单"
      ariaActiveDescendant={activeId}
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.length === 0 && (
        <div className="zm-slash-empty">没有匹配的命令</div>
      )}
      {COMMAND_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group.group)
        if (groupItems.length === 0) return null
        return (
          <div key={group.group}>
            <div className="zm-slash-group">{group.title}</div>
            {groupItems.map((item) => {
              const index = items.indexOf(item)
              return (
                <button
                  key={item.id}
                  id={`zm-slash-option-${item.id}`}
                  ref={index === activeIndex ? activeItemRef : undefined}
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
    </PopoverShell>
  )
}
