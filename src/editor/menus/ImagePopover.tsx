import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Image as ImageIcon, X } from 'lucide-react'
import { usePopoverClamp, usePopoverFlip, type PopoverContainer } from '../utils/popover'
import type { ImageInsertAnchor } from '../types'
import { PopoverShell } from './PopoverShell'

interface ImagePopoverProps {
  editor: Editor
  /** 面板锚点；null 表示关闭。锚定触发处（工具栏按钮 / 斜杠触发行），不跟随光标 */
  anchor: ImageInsertAnchor | null
  /** 挂载容器：编辑器根节点（保证作用域样式与主题变量生效） */
  container?: PopoverContainer
  onClose: () => void
}

interface Rect {
  top: number
  bottom: number
  left: number
}

/** 解析锚点矩形：元素锚点实时测量；固定坐标锚点直接返回 */
function measureAnchor(anchor: ImageInsertAnchor): Rect | null {
  if (anchor.element) {
    const r = anchor.element.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left }
  }
  return anchor.point ?? null
}

/**
 * 图片插入面板：锚定「触发处」的轻量下拉面板。
 *
 * 交互设计：
 * - 上传为高频主路径：点击即打开系统文件选择器，选中后面板立即关闭，
 *   编辑区出现上传占位（与粘贴/拖拽同一套 startUpload 流程），
 *   成功替换、失败回滚 + 全局错误提示条——面板内不出现「上传中…」。
 * - URL 为次路径：输入行 + 插入按钮，Enter 提交。
 * - Esc / 点击外部 / 插入成功均关闭；关闭后焦点归还编辑器。
 * - 面板随滚动/缩放实时跟随锚点；下方放不下时向上翻转；横向钳制在视口内。
 * - 上传始终可用：未配置 uploadImage 时走 ImageUpload 扩展内置 dataURL 上传。
 */
export function ImagePopover({ editor, anchor, container, onClose }: ImagePopoverProps) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // 锚点矩形：打开时测量（useState 初始化）；元素锚点随滚动/缩放实时复测（fixed 定位跟随）。
  // 面板每次打开都会因外层 key 重建，anchor 在同一挂载期内不会变化。
  const [rect, setRect] = useState<Rect | null>(() => (anchor ? measureAnchor(anchor) : null))

  useEffect(() => {
    if (!anchor?.element) return
    const update = () => setRect(measureAnchor(anchor))
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchor])

  // 打开时聚焦 URL 输入（Tab 顺序：上传 → URL → 插入）
  useEffect(() => {
    if (!anchor) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [anchor])

  // 点击面板与锚点按钮以外的区域关闭（mousedown 在打开后的下一次事件才注册，不会误关）
  useEffect(() => {
    if (!anchor) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (boxRef.current?.contains(target)) return
      if (anchor.element?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [anchor, onClose])

  // 下方放不下时向上翻转；横向钳制在视口内
  const flipped = usePopoverFlip(rect, boxRef, 8)
  const clampLeft = usePopoverClamp(rect, boxRef)

  const insertUrl = () => {
    const src = url.trim()
    if (!src) return
    editor.chain().focus().setImage({ src }).run()
    onClose()
  }

  /**
   * 本地文件：面板立即关闭，走扩展统一的「占位 → 替换/回滚」流程，
   * 与粘贴/拖拽语义一致；失败由全局错误提示条反馈。
   */
  const handleFile = (file: File) => {
    onClose()
    editor.commands.uploadAndInsertImage(file)
  }

  if (!anchor || !rect) return null

  return (
    <PopoverShell
      boxRef={boxRef}
      anchor={rect}
      flipped={flipped}
      clampLeft={clampLeft}
      container={container}
      className="zm-image-popover"
      role="dialog"
      ariaLabel="插入图片"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="zm-image-upload">
        <button
          type="button"
          className="zm-link-btn zm-link-upload"
          onClick={() => fileRef.current?.click()}
        >
          上传本地图片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
      </div>
      <div className="zm-link-row">
        <ImageIcon size={15} aria-hidden />
        <input
          ref={inputRef}
          className="zm-link-input"
          value={url}
          placeholder="输入图片 URL"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') insertUrl()
            if (e.key === 'Escape') onClose()
          }}
        />
        <button type="button" className="zm-link-btn" aria-label="关闭" onClick={onClose}>
          <X size={14} aria-hidden />
        </button>
      </div>
      <div className="zm-link-actions">
        <button type="button" className="zm-link-btn zm-link-save" onClick={insertUrl}>
          插入
        </button>
      </div>
    </PopoverShell>
  )
}
