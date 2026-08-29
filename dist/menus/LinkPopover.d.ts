import { Editor } from '@tiptap/react';
export interface LinkPopoverState {
    open: boolean;
    /** 预填 URL（当前选区链接） */
    url: string;
}
interface LinkPopoverProps {
    editor: Editor;
    state: LinkPopoverState | null;
    onClose: () => void;
}
/** 链接编辑弹层：设置 / 移除链接 */
export declare function LinkPopover({ editor, state, onClose }: LinkPopoverProps): import('react').ReactPortal | null;
export {};
