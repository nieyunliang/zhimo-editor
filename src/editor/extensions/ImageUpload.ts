import { Extension, type Editor } from '@tiptap/core'
import Image from '@tiptap/extension-image'

declare module '@tiptap/core' {
  interface EditorEvents {
    /** 图片上传失败 */
    imageUploadError: { message: string }
    /** 未配置上传时粘贴/拖拽图片 */
    imageUploadBlocked: { message: string }
  }
}

/**
 * 知墨图片：在官方 Image 基础上增加 data-uploading 属性，
 * 用于上传中占位（加载动画由 CSS 呈现）。
 */
export const ZhimoImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-uploading': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-uploading'),
        renderHTML: (attrs) =>
          attrs['data-uploading'] ? { 'data-uploading': 'true' } : {},
      },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      /**
       * 上传图片文件并插入编辑器。
       * 先插入「上传中」占位节点，成功后替换为真实图片；失败时移除占位。
       */
      uploadAndInsertImage: (file: File) => ReturnType
    }
  }
}

export interface ImageUploadOptions {
  /** 上传回调；未配置时命令返回 false */
  uploadImage?: (file: File) => Promise<string>
}

interface ImageUploadStorage {
  dom: HTMLElement | null
  cleanup: (() => void) | null
}

/**
 * 定位「上传中」占位图片。
 *
 * 不能依赖插入前捕获的位置：insertContentAt 会把 block 图片提升到最近
 * 合法落点（光标在段首时落在段前、段中时分裂段落），实际位置与捕获的
 * selection.from 不一致，nodeAt(pos) 会取到相邻段落导致替换/回滚静默失效。
 * 这里扫描文档找 data-uploading 图片中距离锚点最近的一个。
 */
function findUploadingImagePos(editor: Editor, anchor: number): number {
  let best = -1
  let bestDist = Infinity
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs['data-uploading']) {
      const dist = Math.abs(pos - anchor)
      if (dist < bestDist) {
        bestDist = dist
        best = pos
      }
    }
    return true
  })
  return best
}

/** 图片上传扩展：上传命令 + 粘贴/拖拽图片文件处理 */
export const ImageUpload = Extension.create<ImageUploadOptions, ImageUploadStorage>({
  name: 'imageUpload',

  addOptions() {
    return { uploadImage: undefined }
  },

  addStorage() {
    return { dom: null, cleanup: null }
  },

  addCommands() {
    return {
      uploadAndInsertImage:
        (file: File) =>
        ({ editor }) => {
          const { uploadImage } = this.options
          if (!uploadImage) return false

          const pos = editor.state.selection.from
          const placeholder = editor.schema.nodes.image.create({
            src: '',
            'data-uploading': 'true',
          })
          editor.chain().insertContentAt(pos, placeholder).run()

          uploadImage(file)
            .then((src) => {
              const imgPos = findUploadingImagePos(editor, pos)
              if (imgPos < 0) return
              editor
                .chain()
                .command(({ tr }) => {
                  const n = tr.doc.nodeAt(imgPos)
                  if (n?.type.name !== 'image') return false
                  tr.setNodeMarkup(imgPos, undefined, {
                    ...n.attrs,
                    src,
                    'data-uploading': null,
                  })
                  return true
                })
                .run()
            })
            .catch(() => {
              const imgPos = findUploadingImagePos(editor, pos)
              if (imgPos >= 0) {
                editor.chain().deleteRange({ from: imgPos, to: imgPos + 1 }).run()
              }
              editor.emit('imageUploadError', { message: '图片上传失败，请重试' })
            })
          return true
        },
    }
  },

  onCreate() {
    const { editor } = this
    const { uploadImage } = this.options
    const dom = editor.view.dom
    this.storage.dom = dom

    /** 在指定位置插入上传中的图片 */
    const insertUploading = (pos: number, file: File) => {
      const placeholder = editor.schema.nodes.image.create({
        src: '',
        'data-uploading': 'true',
      })
      editor.chain().insertContentAt(pos, placeholder).run()
      uploadImage?.(file)
        .then((src) => {
          const imgPos = findUploadingImagePos(editor, pos)
          if (imgPos < 0) return
          editor
            .chain()
            .command(({ tr }) => {
              const n = tr.doc.nodeAt(imgPos)
              if (n?.type.name !== 'image') return false
              tr.setNodeMarkup(imgPos, undefined, {
                ...n.attrs,
                src,
                'data-uploading': null,
              })
              return true
            })
            .run()
        })
        .catch(() => {
          const imgPos = findUploadingImagePos(editor, pos)
          if (imgPos >= 0) {
            editor.chain().deleteRange({ from: imgPos, to: imgPos + 1 }).run()
          }
          editor.emit('imageUploadError', { message: '图片上传失败，请重试' })
        })
    }

    const findImageFile = (list: FileList | null | undefined) =>
      Array.from(list ?? []).find((f) => f.type.startsWith('image/'))

    const onPaste = (event: ClipboardEvent) => {
      const file = findImageFile(event.clipboardData?.files)
      if (!file) return
      event.preventDefault()
      if (!uploadImage) {
        editor.emit('imageUploadBlocked', { message: '未配置图片上传，请使用 URL 插入' })
        return
      }
      insertUploading(editor.state.selection.from, file)
    }

    const onDrop = (event: DragEvent) => {
      const file = findImageFile(event.dataTransfer?.files)
      if (!file) return
      event.preventDefault()
      if (!uploadImage) return
      const coords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })
      if (!coords) return
      insertUploading(coords.pos, file)
    }

    dom.addEventListener('paste', onPaste)
    dom.addEventListener('drop', onDrop)
    this.storage.cleanup = () => {
      dom.removeEventListener('paste', onPaste)
      dom.removeEventListener('drop', onDrop)
    }
  },

  onDestroy() {
    this.storage.cleanup?.()
    this.storage.cleanup = null
    this.storage.dom = null
  },
})
