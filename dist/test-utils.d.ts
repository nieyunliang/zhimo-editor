import { Editor } from '@tiptap/react';
import { ZhimoEditorProps } from './types';
/** 渲染编辑器并通过 onCreate 捕获 editor 实例 */
export declare function renderEditor(props?: ZhimoEditorProps): {
    getEditor: () => Editor | null;
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: import('react-dom/client').Container | (Element | Document) | Array<import('react-dom/client').Container | (Element | Document)> | undefined, maxLength?: number | undefined, options?: import('pretty-format').OptionsReceived | undefined) => void;
    rerender: (ui: React.ReactNode) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    getByLabelText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement;
    getAllByLabelText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement[];
    queryByLabelText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement | null;
    queryAllByLabelText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement[];
    findByLabelText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByLabelText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByPlaceholderText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement;
    getAllByPlaceholderText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    queryByPlaceholderText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement | null;
    queryAllByPlaceholderText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    findByPlaceholderText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByPlaceholderText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement;
    getAllByText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement[];
    queryByText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement | null;
    queryAllByText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined) => HTMLElement[];
    findByText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').SelectorMatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByAltText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement;
    getAllByAltText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    queryByAltText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement | null;
    queryAllByAltText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    findByAltText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByAltText: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByTitle: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement;
    getAllByTitle: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    queryByTitle: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement | null;
    queryAllByTitle: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    findByTitle: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByTitle: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByDisplayValue: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement;
    getAllByDisplayValue: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    queryByDisplayValue: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement | null;
    queryAllByDisplayValue: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    findByDisplayValue: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByDisplayValue: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByRole: (role: import('@testing-library/dom').ByRoleMatcher, options?: import('@testing-library/dom').ByRoleOptions | undefined) => HTMLElement;
    getAllByRole: (role: import('@testing-library/dom').ByRoleMatcher, options?: import('@testing-library/dom').ByRoleOptions | undefined) => HTMLElement[];
    queryByRole: (role: import('@testing-library/dom').ByRoleMatcher, options?: import('@testing-library/dom').ByRoleOptions | undefined) => HTMLElement | null;
    queryAllByRole: (role: import('@testing-library/dom').ByRoleMatcher, options?: import('@testing-library/dom').ByRoleOptions | undefined) => HTMLElement[];
    findByRole: (role: import('@testing-library/dom').ByRoleMatcher, options?: import('@testing-library/dom').ByRoleOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByRole: (role: import('@testing-library/dom').ByRoleMatcher, options?: import('@testing-library/dom').ByRoleOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
    getByTestId: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement;
    getAllByTestId: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    queryByTestId: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement | null;
    queryAllByTestId: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined) => HTMLElement[];
    findByTestId: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement>;
    findAllByTestId: (id: import('@testing-library/dom').Matcher, options?: import('@testing-library/dom').MatcherOptions | undefined, waitForElementOptions?: import('@testing-library/dom').waitForOptions | undefined) => Promise<HTMLElement[]>;
};
/** 等待编辑器实例就绪 */
export declare function editorReady(getEditor: () => Editor | null): Promise<Editor>;
/** 聚焦并输入文本（jsdom 下通过 view.dom.focus() 触发聚焦） */
export declare function typeInto(editor: Editor, text: string): void;
/** 构造可手动 resolve/reject 的 Promise */
export declare function deferred<T>(): {
    promise: Promise<T>;
    resolve: (v: T) => void;
    reject: (e: unknown) => void;
};
/** 向编辑器 DOM 派发携带图片文件的 paste 事件（模拟粘贴图片） */
export declare function pasteImageFile(editor: Editor, file: File): void;
