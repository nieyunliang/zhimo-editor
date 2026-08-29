import { Editor } from '@tiptap/react';
interface BubbleMenuProps {
    editor: Editor;
    onOpenLink: () => void;
}
/** 选中文本浮动菜单：加粗/斜体/下划线/删除线/行内代码/链接 */
export declare function BubbleMenu({ editor, onOpenLink }: BubbleMenuProps): import('react').ReactPortal | null;
export {};
