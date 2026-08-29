import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { useZhimoEditor } from './useZhimoEditor'
import { Toolbar } from './toolbar/Toolbar'
import { BubbleMenu } from './menus/BubbleMenu'
import { SlashMenu } from './menus/SlashMenu'
import { TableMenu } from './menus/TableMenu'
import { LinkPopover, type LinkPopoverState } from './menus/LinkPopover'
import { ImagePopover } from './menus/ImagePopover'
import { cn } from './utils/cn'
import type { ZhimoEditorProps } from './types'

/**
 * 知墨编辑器 · 主组件
 *
 * 基于 TipTap v3 的 React 富文本编辑器组件。
 * 支持受控/非受控双模式、HTML/JSON 内容格式、只读态、自定义扩展。
 */
export function ZhimoEditor(props: ZhimoEditorProps) {
  const {
    toolbar = true,
    bubbleMenu = true,
    slashMenu = true,
    className,
    style,
    disabled,
    ...editorProps
  } = props

  const editor = useZhimoEditor({ ...editorProps, disabled })
  const [linkState, setLinkState] = useState<LinkPopoverState | null>(null)
  const [imageOpen, setImageOpen] = useState(false)
  const [error, setError] = useState('')
  const errorTimer = useRef<number | undefined>(undefined)

  /** 图片上传/粘贴提示（2.5s 自动消失） */
  useEffect(() => {
    if (!editor) return
    const showError = ({ message }: { message: string }) => {
      setError(message)
      window.clearTimeout(errorTimer.current)
      errorTimer.current = window.setTimeout(() => setError(''), 2500)
    }
    editor.on('imageUploadError', showError)
    editor.on('imageUploadBlocked', showError)
    return () => {
      editor.off('imageUploadError', showError)
      editor.off('imageUploadBlocked', showError)
      window.clearTimeout(errorTimer.current)
    }
  }, [editor])

  /** 打开链接编辑弹层（预填当前选区链接 URL） */
  const openLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().run()
    const href = (editor.getAttributes('link').href as string | undefined) ?? ''
    setLinkState({ open: true, url: href })
  }, [editor])

  /** 打开图片插入弹层 */
  const openImage = useCallback(() => {
    if (!editor) return
    editor.chain().focus().run()
    setImageOpen(true)
  }, [editor])

  if (!editor) return null

  return (
    <div
      className={cn('zhimo-editor', disabled && 'is-disabled', className)}
      style={style}
    >
      {toolbar !== false && (
        <div className="zm-toolbar-wrap">
          {typeof toolbar === 'boolean' ? (
            <Toolbar
              editor={editor}
              onOpenLink={openLink}
              onOpenImage={openImage}
              disabled={disabled}
            />
          ) : (
            toolbar
          )}
        </div>
      )}
      <EditorContent editor={editor} />
      {bubbleMenu && <BubbleMenu editor={editor} onOpenLink={openLink} />}
      {slashMenu && (
        <SlashMenu editor={editor} onOpenLink={openLink} onOpenImage={openImage} />
      )}
      <LinkPopover
        key={linkState?.open ? 'link-open' : 'link-closed'}
        editor={editor}
        state={linkState}
        onClose={() => setLinkState(null)}
      />
      <ImagePopover
        key={imageOpen ? 'image-open' : 'image-closed'}
        editor={editor}
        open={imageOpen}
        uploadImage={editorProps.uploadImage}
        onClose={() => setImageOpen(false)}
      />
      <TableMenu editor={editor} />
      {error && (
        <div className="zm-editor-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
