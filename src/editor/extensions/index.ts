import type { AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import { ZhimoImage, ImageUpload } from './ImageUpload'

export interface BuildExtensionsOptions {
  placeholder?: string
  /** 图片上传回调（可选） */
  uploadImage?: (file: File) => Promise<string>
  /** 追加扩展（与内置同名时覆盖） */
  extensions?: AnyExtension[]
}

/** 内置默认扩展装配；追加的 extensions 同名时覆盖内置 */
export function buildExtensions(options: BuildExtensionsOptions): AnyExtension[] {
  const custom = options.extensions ?? []
  const customNames = new Set(custom.map((e) => e.name))
  // 同名扩展必须去重：直接叠加会让 ProseMirror 报
  // 「Adding different instances of a keyed plugin」崩溃（如覆盖 Placeholder/Link）
  return [
    ...[
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit v3 内置 link/underline，此处禁用并改用下方自定义配置
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      ZhimoImage.configure({ inline: false }),
      options.uploadImage
        ? ImageUpload.configure({ uploadImage: options.uploadImage })
        : ImageUpload,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: options.placeholder ?? '请输入内容…',
      }),
    ].filter((ext) => !customNames.has(ext.name)),
    ...custom,
  ]
}
