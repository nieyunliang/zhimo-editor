import { useEffect, useMemo } from 'react'
import { useEditor, type Editor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import { buildExtensions } from './extensions'
import type { ContentFormat, ZhimoEditorProps } from './types'

/** 按 format 解析外部内容为编辑器可用的内容 */
function parseContent(content: string | undefined, format: ContentFormat) {
  if (content === undefined || content === '') return ''
  if (format === 'json') {
    try {
      return JSON.parse(content) as JSONContent
    } catch {
      return ''
    }
  }
  return content
}

/**
 * 是否为「空文档」：仅含一个无内容的段落（即 '' 解析后的默认文档）。
 * 刻意不用 editor.isEmpty —— 它会把空标题、空列表、空表格等也视为空，
 * 序列化成 '' 会丢失这些结构。
 */
function isBlankDoc(editor: Editor): boolean {
  const { doc } = editor.state
  const first = doc.firstChild
  return (
    doc.childCount === 1 &&
    first !== null &&
    first.type.name === 'paragraph' &&
    first.childCount === 0
  )
}

/**
 * 按 format 序列化编辑器内容。
 * 空文档统一输出 ''，与 parseContent 把 '' 读作空文档对称，
 * 保证受控模式下 value='' 往返一致（否则会得到 '<p></p>' / 空段落 JSON）。
 */
function serializeContent(editor: Editor, format: ContentFormat): string {
  if (isBlankDoc(editor)) return ''
  if (format === 'json') return JSON.stringify(editor.getJSON())
  return editor.getHTML()
}

/**
 * 创建知墨编辑器实例（TipTap useEditor 封装）。
 * 处理：扩展装配、受控/非受控内容同步、禁用态切换、事件透传、图片粘贴/拖拽。
 */
export function useZhimoEditor(props: ZhimoEditorProps): Editor | null {
  const {
    value,
    defaultValue,
    format = 'html',
    placeholder,
    editorAriaLabel,
    disabled,
    extensions,
    uploadImage,
    onChange,
    onCreate,
    onFocus,
    onBlur,
    onSelectionUpdate,
  } = props

  const ext = useMemo(
    () => buildExtensions({ placeholder, extensions, uploadImage }),
    // oxlint-disable-next-line react/exhaustive-deps -- extensions 由调用方保证稳定
    [placeholder, extensions, uploadImage],
  )

  const editor = useEditor({
    extensions: ext,
    content: parseContent(defaultValue ?? value, format),
    editable: !disabled,
    // 编辑区可访问名称：contenteditable 无默认 role 标签，屏幕阅读器需要 aria-label
    editorProps: {
      attributes: { 'aria-label': editorAriaLabel ?? '编辑器' },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(serializeContent(e, format))
    },
    onFocus,
    onBlur,
    onSelectionUpdate,
    onCreate: ({ editor: e }) => onCreate?.(e),
  })

  // 受控模式：外部 value 变化时同步文档；内容相同时跳过以避免光标重置
  useEffect(() => {
    // 编辑器可能在渲染后、被动 effect 执行前被销毁重建（TipTap v3
    // useEditor 的 1ms 延迟销毁与 React 异步被动 effect 存在竞态）：
    // 此时调用 getHTML 会命中已清空的 schema（null.cached）直接抛错，
    // 必须跳过，等新实例替换后再同步（新实例创建时已带上最新 value）。
    if (!editor || editor.isDestroyed || value === undefined) return
    const current = serializeContent(editor, format)
    if (current === value) return
    // JSON 格式下外部值必须是合法 JSON：解析失败（典型场景是 html → json
    // 切换时 value 仍是 HTML 字符串）时跳过同步，避免把现有文档误清空
    if (format === 'json') {
      try {
        JSON.parse(value)
      } catch {
        return
      }
    }
    editor.commands.setContent(parseContent(value, format), {
      emitUpdate: false,
    })
  }, [editor, value, format])

  // 禁用态动态切换。
  // setEditable 第二参数 emitUpdate 默认为 true，会无条件 emit('update')
  // 从而触发 onChange —— 挂载时这个 effect 必定执行一次，导致用户未编辑
  // 就回调 onChange。可编辑状态不是内容变化，这里必须显式关掉。
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (editor.isEditable === !disabled) return
    editor.setEditable(!disabled, false)
  }, [editor, disabled])

  return editor
}
