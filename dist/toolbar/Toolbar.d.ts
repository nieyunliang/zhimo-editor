import { Editor } from '@tiptap/react';
/** 内置工具栏 */
export declare function Toolbar({ editor, onOpenLink, onOpenImage, disabled, }: {
    editor: Editor;
    onOpenLink: () => void;
    onOpenImage: () => void;
    /** 只读模式：禁用全部操作按钮，避免绕过只读态修改内容 */
    disabled?: boolean;
}): import("react").JSX.Element | null;
