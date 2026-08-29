import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { Image as ImageIcon, X } from 'lucide-react'

interface ImagePopoverProps {
  editor: Editor
  open: boolean
  /** 图片上传回调（未提供时仅支持 URL 插入） */
  uploadImage?: (file: File) => Promise<string>
  onClose: () => void
}

/** 图片插入弹层：URL 插入 / 本地上传 */
export function ImagePopover({ editor, open, uploadImage, onClose }: ImagePopoverProps) {
  const [url, setUrl] = useState('')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 打开时定位到选区（外部系统同步）；表单状态由 key 重建保证重置
  useEffect(() => {
    if (!open) return
    try {
      const { from } = editor.state.selection
      const coords = editor.view.coordsAtPos(from)
      // oxlint-disable-next-line react/set-state-in-effect -- 定位结果写入状态是外部系统同步的正当用法
      setPos({ top: coords.bottom, left: coords.left })
    } catch {
      // 环境不支持 DOM 测量时保持隐藏（初始 pos 为 null）
    }
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open, editor])

  const insertUrl = () => {
    const src = url.trim()
    if (!src) return
    editor.chain().focus().setImage({ src }).run()
    onClose()
  }

  const handleFile = async (file: File) => {
    if (!uploadImage) return
    setUploading(true)
    setError('')
    try {
      const src = await uploadImage(file)
      editor.chain().focus().setImage({ src }).run()
      onClose()
    } catch {
      setError('图片上传失败，请重试')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!open || !pos) return null

  return createPortal(
    <div
      className="zm-image-popover zm-popover"
      style={{ top: pos.top, left: pos.left, transform: 'translateY(8px)' }}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="插入图片"
    >
      <div className="zm-link-row">
        <ImageIcon size={15} aria-hidden />
        <input
          ref={inputRef}
          className="zm-link-input"
          value={url}
          placeholder="输入图片 URL"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') insertUrl()
            if (e.key === 'Escape') onClose()
          }}
        />
        <button type="button" className="zm-link-btn" aria-label="关闭" onClick={onClose}>
          <X size={14} aria-hidden />
        </button>
      </div>
      {uploadImage && (
        <div className="zm-image-upload">
          <button
            type="button"
            className="zm-link-btn zm-link-upload"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? '上传中…' : '上传本地图片'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
            }}
          />
        </div>
      )}
      {error && <div className="zm-image-error">{error}</div>}
      <div className="zm-link-actions">
        <button type="button" className="zm-link-btn zm-link-save" onClick={insertUrl}>
          插入
        </button>
      </div>
    </div>,
    document.body,
  )
}
