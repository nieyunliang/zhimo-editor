import { Editor } from '@tiptap/react';
interface TableMenuProps {
    editor: Editor;
}
/** 表格上下文工具条：光标在表格内时显示插入/删除行列操作 */
export declare function TableMenu({ editor }: TableMenuProps): import('react').ReactPortal | null;
export {};
