import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Image as ImageIcon,
  Table,
  Undo2,
  Redo2,
} from 'lucide-react'
import { ToolButton } from './Button'
import { ToolDivider } from './Divider'
import { BlockSelect } from './Select'
import { modKey } from '../utils/platform'

/** 工具栏整体状态订阅（selection/transaction 变化时更新） */
function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        code: e.isActive('code'),
        link: e.isActive('link'),
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        codeBlock: e.isActive('codeBlock'),
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
  onOpenImage: () => void
  /** 只读模式：禁用全部操作按钮，避免绕过只读态修改内容 */
  disabled?: boolean
}) {
  const s = useToolbarState(editor)
  if (!s) return null

  return (
    <div className="zm-toolbar" role="toolbar" aria-label="编辑工具栏">
      <BlockSelect editor={editor} disabled={disabled} />
      <ToolDivider />

      <ToolButton
        icon={Bold}
        label="加粗"
        shortcut={modKey + 'B'}
        active={s.bold}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolButton
        icon={Italic}
        label="斜体"
        shortcut={modKey + 'I'}
        active={s.italic}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolButton
        icon={Underline}
        label="下划线"
        shortcut={modKey + 'U'}
        active={s.underline}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolButton
        icon={Strikethrough}
        label="删除线"
        shortcut={modKey + 'Shift+X'}
        active={s.strike}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolButton
        icon={Code}
        label="行内代码"
        shortcut={modKey + 'E'}
        active={s.code}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolDivider />

      <ToolButton
        icon={List}
        label="无序列表"
        shortcut={modKey + 'Shift+8'}
        active={s.bulletList}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolButton
        icon={ListOrdered}
        label="有序列表"
        shortcut={modKey + 'Shift+7'}
        active={s.orderedList}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolDivider />

      <ToolButton
        icon={Quote}
        label="引用"
        shortcut={modKey + 'Shift+B'}
        active={s.blockquote}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolButton
        icon={Code2}
        label="代码块"
        active={s.codeBlock}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolButton
        icon={Minus}
        label="分割线"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <ToolDivider />

      <ToolButton
        icon={Link2}
        label="链接"
        shortcut={modKey + 'K'}
        active={s.link}
        disabled={disabled}
        onClick={onOpenLink}
      />
      <ToolButton
        icon={ImageIcon}
        label="图片"
        disabled={disabled}
        onClick={onOpenImage}
      />
      <ToolButton
        icon={Table}
        label="插入表格"
        disabled={disabled}
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      />
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
