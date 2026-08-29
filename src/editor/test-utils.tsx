import { act, render, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import type { Editor } from '@tiptap/react'
import { ZhimoEditor } from './ZhimoEditor'
import type { ZhimoEditorProps } from './types'

/** 渲染编辑器并通过 onCreate 捕获 editor 实例 */
export function renderEditor(props: ZhimoEditorProps = {}) {
  let editor: Editor | null = null
  const utils = render(<ZhimoEditor {...props} onCreate={(e) => (editor = e)} />)
  return {
    ...utils,
    getEditor: () => editor,
  }
}

/** 等待编辑器实例就绪 */
export async function editorReady(getEditor: () => Editor | null) {
  await waitFor(() => expect(getEditor()).toBeTruthy())
  return getEditor()!
}

/** 聚焦并输入文本（jsdom 下通过 view.dom.focus() 触发聚焦） */
export function typeInto(editor: Editor, text: string) {
  act(() => {
    editor.view.dom.focus()
    editor.commands.insertContent(text)
  })
}

/** 构造可手动 resolve/reject 的 Promise */
export function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** 向编辑器 DOM 派发携带图片文件的 paste 事件（模拟粘贴图片） */
export function pasteImageFile(editor: Editor, file: File) {
  const ev = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'clipboardData', {
    value: {
      files: [file],
      // TipTap 自身的 paste 处理器也会读取 clipboardData
      getData: () => '',
      types: ['Files'],
    },
  })
  act(() => {
    editor.view.dom.dispatchEvent(ev)
  })
}

/** 向编辑器 DOM 派发携带图片文件的 drop 事件（模拟拖拽图片） */
export function dropImageFile(editor: Editor, file: File, x = 10, y = 10) {
  const ev = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'dataTransfer', {
    value: { files: [file], types: ['Files'] },
  })
  Object.defineProperty(ev, 'clientX', { value: x })
  Object.defineProperty(ev, 'clientY', { value: y })
  act(() => {
    editor.view.dom.dispatchEvent(ev)
  })
}
