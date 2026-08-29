import { AnyExtension } from '@tiptap/core';
export interface BuildExtensionsOptions {
    placeholder?: string;
    /** 图片上传回调（可选） */
    uploadImage?: (file: File) => Promise<string>;
    /** 追加扩展（与内置同名时覆盖） */
    extensions?: AnyExtension[];
}
/** 内置默认扩展装配；追加的 extensions 同名时覆盖内置 */
export declare function buildExtensions(options: BuildExtensionsOptions): AnyExtension[];
