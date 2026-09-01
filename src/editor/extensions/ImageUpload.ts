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
 * 用于上传中占位（加载动画由 CSS 呈现）；另有 data-upload-id 作为
 * 上传任务唯一标识（仅内存使用、不渲染进 HTML），供并发上传时
 * 精确匹配占位节点。
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
      'data-upload-id': {
        default: null,
        // 仅程序化写入（create / setNodeMarkup），不从 HTML 解析、不渲染
        renderHTML: () => ({}),
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
  /** 上传回调；未配置时使用内置 FileReader 转 dataURL（开箱即用） */
  uploadImage?: (file: File) => Promise<string>
}

/**
 * 内置上传：FileReader 转 data URL。
 * 使「上传本地图片」在未配置 uploadImage 时依然可用；
 * 数据量较大的图片建议配置服务端上传（返回对象存储/CDN URL）。
 */
export function defaultUploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

interface ImageUploadStorage {
  dom: HTMLElement | null
  cleanup: (() => void) | null
}

/** 上传任务 id 递增计数器（编辑器间共享无副作用：仅需文档内唯一） */
let uploadIdCounter = 0
const nextUploadId = () => `zm-upload-${++uploadIdCounter}`

/**
 * 定位「上传中」占位图片。
 *
 * 不能依赖插入前捕获的位置：insertContentAt 会把 block 图片提升到最近
 * 合法落点（光标在段首时落在段前、段中时分裂段落），实际位置与捕获的
 * selection.from 不一致，nodeAt(pos) 会取到相邻段落导致替换/回滚静默失效。
 * 这里以 data-upload-id 精确匹配占位节点，并发上传互不串扰。
 */
function findUploadingImagePos(editor: Editor, uploadId: string): number {
  let best = -1
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs['data-upload-id'] === uploadId) {
      best = pos
      return false
    }
    return true
  })
  return best
}

/**
 * 上传图片文件：先插入占位节点，成功后替换为真实图片，失败时移除占位并广播错误。
 * 命令（uploadAndInsertImage）与粘贴/拖拽入口共用此流程。
 */
function startUpload(
  editor: Editor,
  uploadImage: ((file: File) => Promise<string>) | undefined,
  pos: number,
  file: File,
) {
  if (!uploadImage) return

  const uploadId = nextUploadId()
  const imageType = editor.schema.nodes.image
  const placeholder = imageType?.create({
    src: '',
    'data-uploading': 'true',
    'data-upload-id': uploadId,
  })
  if (!placeholder) return
  editor.chain().insertContentAt(pos, placeholder).run()

  /** 失败统一处理：移除占位并广播错误 */
  const onFail = () => {
    // 编辑器已销毁（如上传期间卸载）：state 已清空，不再访问
    if (editor.isDestroyed) return
    const imgPos = findUploadingImagePos(editor, uploadId)
    if (imgPos >= 0) {
      editor.chain().deleteRange({ from: imgPos, to: imgPos + 1 }).run()
    }
    editor.emit('imageUploadError', { message: '图片上传失败，请重试' })
  }

  let result: Promise<string>
  try {
    // 同步抛出也视为失败（否则占位节点残留、错误未被捕获）
    result = Promise.resolve(uploadImage(file))
  } catch {
    onFail()
    return
  }

  result
    .then((src) => {
      if (editor.isDestroyed) return
      const imgPos = findUploadingImagePos(editor, uploadId)
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
            'data-upload-id': null,
          })
          return true
        })
        .run()
    })
    .catch(() => onFail())
}

/** 图片上传扩展：上传命令 + 粘贴/拖拽图片文件处理 */
export const ImageUpload = Extension.create<ImageUploadOptions, ImageUploadStorage>({
  name: 'imageUpload',

  addOptions() {
    // 未配置时默认内置上传（dataURL），保证粘贴/拖拽/面板入口开箱即用
    return { uploadImage: defaultUploadImage }
  },

  addStorage() {
    return { dom: null, cleanup: null }
  },

  addCommands() {
    return {
      uploadAndInsertImage:
        (file: File) =>
        ({ editor, tr }) => {
          const { uploadImage } = this.options
          if (!uploadImage || !editor.isEditable) return false
          // 命令体会经由独立 chain 派发「占位」事务；禁止外层链条再基于
          // 旧状态派发事务，否则 ProseMirror 抛「Applying a mismatched transaction」
          tr.setMeta('preventDispatch', true)
          startUpload(editor, uploadImage, editor.state.selection.from, file)
          return true
        },
    }
  },

  onCreate() {
    const { editor } = this
    const { uploadImage } = this.options
    const dom = editor.view.dom
    this.storage.dom = dom

    const findImageFile = (list: FileList | null | undefined) =>
      Array.from(list ?? []).find((f) => f.type.startsWith('image/'))

    /** 未配置上传时的统一拦截提示（粘贴与拖拽一致） */
    const blocked = () =>
      editor.emit('imageUploadBlocked', { message: '未配置图片上传，请使用 URL 插入' })

    const onPaste = (event: ClipboardEvent) => {
      // 只读模式：与禁用工具栏一致，不绕过只读态修改内容
      if (!editor.isEditable) return
      const file = findImageFile(event.clipboardData?.files)
      if (!file) return
      event.preventDefault()
      if (!uploadImage) {
        blocked()
        return
      }
      startUpload(editor, uploadImage, editor.state.selection.from, file)
    }

    const onDrop = (event: DragEvent) => {
      // 只读模式：与禁用工具栏一致，不绕过只读态修改内容
      if (!editor.isEditable) return
      const file = findImageFile(event.dataTransfer?.files)
      if (!file) return
      event.preventDefault()
      if (!uploadImage) {
        blocked()
        return
      }
      // 拖拽落点优先；无 DOM 测量环境（如 jsdom 测试）降级为当前选区位置
      let pos = editor.state.selection.from
      try {
        const coords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (coords) pos = coords.pos
      } catch {
        // jsdom 等环境不支持坐标测量
      }
      startUpload(editor, uploadImage, pos, file)
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
