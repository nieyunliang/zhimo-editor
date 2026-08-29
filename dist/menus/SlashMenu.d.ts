import { Editor } from '@tiptap/react';
interface SlashMenuProps {
    editor: Editor;
    /** 链接项点击后调用（编辑器已插入占位文本并选中） */
    onOpenLink: () => void;
    /** 图片项点击后调用 */
    onOpenImage: () => void;
}
/** 斜杠命令菜单：输入 / 触发，支持过滤与键盘导航 */
export declare function SlashMenu({ editor, onOpenLink, onOpenImage }: SlashMenuProps): import('react').ReactPortal | null;
export {};
