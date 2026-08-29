import { Editor } from '@tiptap/react';
interface ImagePopoverProps {
    editor: Editor;
    open: boolean;
    /** 图片上传回调（未提供时仅支持 URL 插入） */
    uploadImage?: (file: File) => Promise<string>;
    onClose: () => void;
}
/** 图片插入弹层：URL 插入 / 本地上传 */
export declare function ImagePopover({ editor, open, uploadImage, onClose }: ImagePopoverProps): import('react').ReactPortal | null;
export {};
