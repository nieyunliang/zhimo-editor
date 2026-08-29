import { Editor } from '@tiptap/react';
import { ZhimoEditorProps } from './types';
/**
 * 创建知墨编辑器实例（TipTap useEditor 封装）。
 * 处理：扩展装配、受控/非受控内容同步、禁用态切换、事件透传、图片粘贴/拖拽。
 */
export declare function useZhimoEditor(props: ZhimoEditorProps): Editor | null;
