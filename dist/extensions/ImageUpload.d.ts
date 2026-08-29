import { Extension } from '@tiptap/core';
declare module '@tiptap/core' {
    interface EditorEvents {
        /** 图片上传失败 */
        imageUploadError: {
            message: string;
        };
        /** 未配置上传时粘贴/拖拽图片 */
        imageUploadBlocked: {
            message: string;
        };
    }
}
/**
 * 知墨图片：在官方 Image 基础上增加 data-uploading 属性，
 * 用于上传中占位（加载动画由 CSS 呈现）。
 */
export declare const ZhimoImage: import('@tiptap/core').Node<import('@tiptap/extension-image').ImageOptions, any>;
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        imageUpload: {
            /**
             * 上传图片文件并插入编辑器。
             * 先插入「上传中」占位节点，成功后替换为真实图片；失败时移除占位。
             */
            uploadAndInsertImage: (file: File) => ReturnType;
        };
    }
}
export interface ImageUploadOptions {
    /** 上传回调；未配置时命令返回 false */
    uploadImage?: (file: File) => Promise<string>;
}
interface ImageUploadStorage {
    dom: HTMLElement | null;
    cleanup: (() => void) | null;
}
/** 图片上传扩展：上传命令 + 粘贴/拖拽图片文件处理 */
export declare const ImageUpload: Extension<ImageUploadOptions, ImageUploadStorage>;
export {};
