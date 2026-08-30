import type { ReactNode, CSSProperties } from 'react'
import type { AnyExtension, EditorEvents } from '@tiptap/core'

/** 内容序列化格式 */
export type ContentFormat = 'html' | 'json'

/**
 * 图片插入面板的锚点。
 *
 * 面板锚定「触发处」而非光标/选区：图片插入不需要选区上下文，
 * 锚定按钮/触发行才能保证弹层位置稳定可预期。
 */
export interface ImageInsertAnchor {
  /** 锚点元素（工具栏按钮）：面板打开期间随滚动/缩放实时复测矩形 */
  element?: HTMLElement
  /** 固定视口坐标锚点（斜杠命令触发行，格式 { top, bottom, left }） */
  point?: { top: number; bottom: number; left: number }
}

export interface ZhimoEditorProps {
  /** 受控内容（与 onChange 配合使用）；格式由 `format` 决定 */
  value?: string
  /** 非受控模式下的初始内容 */
  defaultValue?: string
  /** 内容序列化格式，默认 'html' */
  format?: ContentFormat
  /** 内容变化回调（受控/非受控均触发） */
  onChange?: (content: string) => void
  /** 占位符，默认「请输入内容…」 */
  placeholder?: string
  /** 只读模式 */
  disabled?: boolean
  /**
   * 图片上传回调，返回图片 URL。
   * 提供后粘贴/拖拽/面板上传均走自定义上传；未提供时使用内置
   * FileReader 转 dataURL（开箱即用；数据量较大时建议配置服务端上传）。
   */
  uploadImage?: (file: File) => Promise<string>
  /**
   * 追加扩展；与内置扩展同名时覆盖内置配置
   * （如传入自定 Link 配置可覆盖默认链接行为）
   */
  extensions?: AnyExtension[]
  /** 内置工具栏：true 显示（默认）、false 隐藏、传 ReactNode 使用自定义工具栏 */
  toolbar?: boolean | ReactNode
  /** 选中文本浮动菜单，默认 true */
  bubbleMenu?: boolean
  /** 斜杠命令菜单，默认 true */
  slashMenu?: boolean
  /** 编辑器创建完成回调 */
  onCreate?: (editor: EditorEvents['create']['editor']) => void
  /** 编辑器聚焦回调 */
  onFocus?: (props: EditorEvents['focus']) => void
  /** 编辑器失焦回调 */
  onBlur?: (props: EditorEvents['blur']) => void
  /** 选区变化回调 */
  onSelectionUpdate?: (props: EditorEvents['selectionUpdate']) => void
  /** 根节点类名 */
  className?: string
  /** 根节点内联样式 */
  style?: CSSProperties
}
