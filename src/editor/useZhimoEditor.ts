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

/** 按 format 序列化编辑器内容 */
function serializeContent(editor: Editor, format: ContentFormat): string {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extensions 由调用方保证稳定
    [placeholder, extensions, uploadImage],
  )

  const editor = useEditor({
    extensions: ext,
    content: parseContent(defaultValue ?? value, format),
    editable: !disabled,
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
    if (!editor || value === undefined) return
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

  // 禁用态动态切换
  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  return editor
}
