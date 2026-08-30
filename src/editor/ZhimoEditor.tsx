import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { useZhimoEditor } from './useZhimoEditor'
import { Toolbar } from './toolbar/Toolbar'
import { BubbleMenu } from './menus/BubbleMenu'
import { SlashMenu } from './menus/SlashMenu'
import { TableMenu } from './menus/TableMenu'
import { LinkPopover, type LinkPopoverState } from './menus/LinkPopover'
import { ImagePopover } from './menus/ImagePopover'
import { defaultUploadImage } from './extensions/ImageUpload'
import { cn } from './utils/cn'
import type { ImageInsertAnchor, ZhimoEditorProps } from './types'

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
  /** 图片插入面板：null 关闭；否则为面板锚点（工具栏按钮 / 斜杠触发行） */
  const [imageAnchor, setImageAnchor] = useState<ImageInsertAnchor | null>(null)
  const [error, setError] = useState('')
  const errorTimer = useRef<number | undefined>(undefined)
  /** 浮动 UI（弹层/菜单）挂载进编辑器根节点：作用域样式与 --zm-* 主题变量才能生效 */
  const rootRef = useRef<HTMLDivElement>(null)

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

  /** 打开图片插入面板：锚定触发处（工具栏按钮元素 / 斜杠触发行），不跟随光标 */
  const openImage = useCallback(
    (anchor?: ImageInsertAnchor) => {
      if (!editor) return
      editor.chain().focus().run()
      // 同一锚点（工具栏按钮）再次触发 = toggle 关闭
      if (anchor?.element && imageAnchor?.element === anchor.element) {
        setImageAnchor(null)
        return
      }
      if (anchor) {
        setImageAnchor(anchor)
        return
      }
      // 无显式锚点（斜杠菜单触发）：以当前选区定位；无 DOM 测量环境（jsdom）降级为固定点
      try {
        const c = editor.view.coordsAtPos(editor.state.selection.from)
        setImageAnchor({ point: { top: c.top, bottom: c.bottom, left: c.left } })
      } catch {
        setImageAnchor({ point: { top: 0, bottom: 0, left: 0 } })
      }
    },
    [editor, imageAnchor],
  )

  /** 关闭图片插入面板并把焦点还给编辑器（Esc/点击外部/插入后继续输入） */
  const closeImage = useCallback(() => {
    setImageAnchor(null)
    editor?.chain().focus().run()
  }, [editor])

  if (!editor) return null

  return (
    <div
      ref={rootRef}
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
      {bubbleMenu && (
        <BubbleMenu editor={editor} onOpenLink={openLink} container={rootRef} />
      )}
      {slashMenu && (
        <SlashMenu
          editor={editor}
          onOpenLink={openLink}
          onOpenImage={openImage}
          container={rootRef}
        />
      )}
      <LinkPopover
        key={linkState?.open ? 'link-open' : 'link-closed'}
        editor={editor}
        state={linkState}
        container={rootRef}
        onClose={() => setLinkState(null)}
      />
      <ImagePopover
        key={imageAnchor ? 'image-open' : 'image-closed'}
        editor={editor}
        anchor={imageAnchor}
        // 未配置 uploadImage 时回退内置 dataURL 上传：上传入口始终可用
        uploadImage={editorProps.uploadImage ?? defaultUploadImage}
        container={rootRef}
        onClose={closeImage}
      />
      <TableMenu editor={editor} container={rootRef} />
      {error && (
        <div className="zm-editor-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
