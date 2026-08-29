import { Editor } from '@tiptap/react';
/**
 * 段落格式下拉（正文 / 标题 1-3）。
 *
 * 当前格式必须通过 useEditorState 订阅编辑器状态：
 * 直接在渲染期调用 editor.isActive() 会被 React Compiler 按 editor 引用
 * 记忆化（editor 引用稳定、内部 state 变化不失效），导致标签/选中态
 * 永远停留在首次渲染值。
 */
export declare function BlockSelect({ editor, disabled }: {
    editor: Editor;
    disabled?: boolean;
}): import("react").JSX.Element;
