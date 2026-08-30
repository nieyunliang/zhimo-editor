import { useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Bold, Italic, Underline, Strikethrough, Code, Undo2, Redo2 } from 'lucide-react'
import { ToolButton } from './Button'
import { ToolDivider } from './Divider'
import { BlockSelect } from './Select'
import { EDITOR_COMMANDS, type CommandContext, type EditorCommand } from '../commands'
import { modKey } from '../utils/platform'
import type { ImageInsertAnchor } from '../types'

/** 行内标记按钮（工具栏专属，不在斜杠菜单中出现） */
const INLINE_MARKS = [
  { icon: Bold, label: '加粗', shortcut: modKey + 'B', mark: 'bold', run: (e: Editor) => e.chain().focus().toggleBold().run() },
  { icon: Italic, label: '斜体', shortcut: modKey + 'I', mark: 'italic', run: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { icon: Underline, label: '下划线', shortcut: modKey + 'U', mark: 'underline', run: (e: Editor) => e.chain().focus().toggleUnderline().run() },
  { icon: Strikethrough, label: '删除线', shortcut: modKey + 'Shift+X', mark: 'strike', run: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { icon: Code, label: '行内代码', shortcut: modKey + 'E', mark: 'code', run: (e: Editor) => e.chain().focus().toggleCode().run() },
] as const

/** 工具栏整体状态订阅（selection/transaction 变化时更新） */
function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null
      // 注册表命令激活态；声明了 isActive 的命令才能作为 toggle 高亮
      const active: Record<string, boolean> = {}
      for (const cmd of EDITOR_COMMANDS) {
        active[cmd.id] = cmd.isActive?.(e) ?? false
      }
      return {
        active,
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        code: e.isActive('code'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }
    },
  })
}

/** 内置工具栏 */
export function Toolbar({
  editor,
  onOpenLink,
  onOpenImage,
  disabled = false,
}: {
  editor: Editor
  onOpenLink: () => void
  /** 图片插入面板锚点：工具栏按钮自身（面板不再跟随光标） */
  onOpenImage: (anchor?: ImageInsertAnchor) => void
  /** 只读模式：禁用全部操作按钮，避免绕过只读态修改内容 */
  disabled?: boolean
}) {
  const s = useToolbarState(editor)
  const imageBtnRef = useRef<HTMLButtonElement>(null)
  if (!s) return null

  const ctx: CommandContext = { openLink: onOpenLink, openImage: onOpenImage }

  /**
   * 注册表命令按钮。link/image 是「弹层型」命令：作用于当前选区直接打开
   * 弹层（注册表的 run 是斜杠菜单的占位插入语义，此处不适用）。
   */
  const registryButton = (cmd: EditorCommand) => {
    const isActive = cmd.isActive ? (s.active[cmd.id] ?? false) : undefined
    const onClick = () => {
      if (cmd.id === 'link') {
        onOpenLink()
        return
      }
      if (cmd.id === 'image') {
        onOpenImage({ element: imageBtnRef.current ?? undefined })
        return
      }
      cmd.run(editor, ctx)
    }
    return (
      <ToolButton
        key={cmd.id}
        icon={cmd.icon}
        label={cmd.toolbarLabel ?? cmd.label}
        shortcut={cmd.shortcut}
        active={isActive}
        disabled={disabled}
        buttonRef={cmd.id === 'image' ? imageBtnRef : undefined}
        onClick={onClick}
      />
    )
  }

  const byGroup = (group: EditorCommand['group']) => EDITOR_COMMANDS.filter((c) => c.group === group)

  return (
    <div className="zm-toolbar" role="toolbar" aria-label="编辑工具栏">
      <BlockSelect editor={editor} ctx={ctx} disabled={disabled} />
      <ToolDivider />

      {INLINE_MARKS.map((m) => (
        <ToolButton
          key={m.mark}
          icon={m.icon}
          label={m.label}
          shortcut={m.shortcut}
          active={s[m.mark]}
          disabled={disabled}
          onClick={() => m.run(editor)}
        />
      ))}
      <ToolDivider />

      {byGroup('list').map(registryButton)}
      <ToolDivider />

      {byGroup('block').map(registryButton)}
      <ToolDivider />

      {byGroup('insert').map(registryButton)}
      <div className="ml-auto flex items-center gap-0.5">
        <ToolButton
          icon={Undo2}
          label="撤销"
          shortcut={modKey + 'Z'}
          disabled={!s.canUndo || disabled}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolButton
          icon={Redo2}
          label="重做"
          shortcut={modKey + 'Shift+Z'}
          disabled={!s.canRedo || disabled}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>
    </div>
  )
}
