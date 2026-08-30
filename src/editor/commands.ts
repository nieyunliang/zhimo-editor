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
import { modKey } from './utils/platform'
import type { ImageInsertAnchor } from './types'

/**
 * 命令执行上下文：需要打开弹层的命令（链接/图片）以回调联动。
 * 由工具栏 / 斜杠菜单注入，命令本身不感知具体 UI。
 */
export interface CommandContext {
  openLink: () => void
  /** 打开图片插入面板；anchor 缺省时由调用方以当前选区定位（斜杠触发处） */
  openImage: (anchor?: ImageInsertAnchor) => void
}

/** 命令分组（工具栏与斜杠菜单共用） */
export type CommandGroup = 'text' | 'list' | 'block' | 'insert'

/** 分组标题（渲染顺序即分组顺序） */
export const COMMAND_GROUPS = [
  { title: '文本', group: 'text' },
  { title: '列表', group: 'list' },
  { title: '块', group: 'block' },
  { title: '插入', group: 'insert' },
] as const

export interface EditorCommand {
  /** 唯一 id（命令语义标识，如扩展名） */
  id: string
  label: string
  /** 工具栏展示名（与斜杠菜单文案不同时覆盖，如「插入表格」） */
  toolbarLabel?: string
  hint?: string
  icon: LucideIcon
  keywords?: string[]
  /** 快捷键展示（工具栏 tooltip 用）；仅 display，不注册键位 */
  shortcut?: string
  group: CommandGroup
  /** 命令当前是否生效（激活态）；不提供视为动作类命令（无 toggle 语义） */
  isActive?: (editor: Editor) => boolean
  /** 执行命令 */
  run: (editor: Editor, ctx: CommandContext) => void
}

/**
 * 内置命令注册表：工具栏与斜杠命令菜单共同消费，
 * 新增命令只需在此登记一次即可两个入口同时出现。
 *
 * 注意：link/image 的 run 是「斜杠菜单」语义（插入占位文本后打开弹层）；
 * 工具栏对这两个 id 直接调用 ctx.openLink/openImage（作用于当前选区），
 * 不做占位插入。
 */
export const EDITOR_COMMANDS: EditorCommand[] = [
  // ===== 文本 =====
  {
    id: 'p',
    label: '正文',
    icon: Pilcrow,
    keywords: ['段落', 'paragraph'],
    group: 'text',
    isActive: (e) => e.isActive('paragraph'),
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    label: '标题 1',
    hint: '大标题',
    icon: Heading1,
    keywords: ['一级'],
    group: 'text',
    isActive: (e) => e.isActive('heading', { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: '标题 2',
    hint: '中标题',
    icon: Heading2,
    keywords: ['二级'],
    group: 'text',
    isActive: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: '标题 3',
    hint: '小标题',
    icon: Heading3,
    keywords: ['三级'],
    group: 'text',
    isActive: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },

  // ===== 列表 =====
  {
    id: 'ul',
    label: '无序列表',
    icon: List,
    keywords: ['圆点', 'bullet'],
    shortcut: modKey + 'Shift+8',
    group: 'list',
    isActive: (e) => e.isActive('bulletList'),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ol',
    label: '有序列表',
    icon: ListOrdered,
    keywords: ['编号', 'numbered'],
    shortcut: modKey + 'Shift+7',
    group: 'list',
    isActive: (e) => e.isActive('orderedList'),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },

  // ===== 块 =====
  {
    id: 'quote',
    label: '引用',
    icon: Quote,
    keywords: ['blockquote'],
    shortcut: modKey + 'Shift+B',
    group: 'block',
    isActive: (e) => e.isActive('blockquote'),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'codeblock',
    label: '代码块',
    icon: Code2,
    keywords: ['code'],
    group: 'block',
    isActive: (e) => e.isActive('codeBlock'),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'hr',
    label: '分割线',
    icon: Minus,
    keywords: ['分隔', 'hr'],
    group: 'block',
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },

  // ===== 插入 =====
  {
    id: 'link',
    label: '链接',
    icon: Link2,
    keywords: ['网址', 'url'],
    shortcut: modKey + 'K',
    group: 'insert',
    isActive: (e) => e.isActive('link'),
    // 斜杠菜单语义：插入「链接」占位文本并选中，随后打开弹层让链接落到该文本上
    run: (e, ctx) => {
      const pos = e.state.selection.from
      e.chain().focus().insertContentAt(pos, '链接').run()
      e.commands.setTextSelection({ from: pos, to: pos + 2 })
      ctx.openLink()
    },
  },
  {
    id: 'image',
    label: '图片',
    icon: ImageIcon,
    keywords: ['插图', 'img'],
    group: 'insert',
    run: (_e, ctx) => ctx.openImage(),
  },
  {
    id: 'table',
    label: '表格',
    toolbarLabel: '插入表格',
    icon: Table,
    keywords: ['3x3'],
    group: 'insert',
    run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
]

/** 按 id 查询命令 */
export function getCommand(id: string): EditorCommand | undefined {
  return EDITOR_COMMANDS.find((c) => c.id === id)
}
