import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 每个测试后卸载 React 树（含 portal），避免 DOM 跨测试堆积
afterEach(() => {
  cleanup()
})

/**
 * jsdom 缺少 Range / Text 节点的几何测量 API，
 * 而 prosemirror-view 的 coordsAtPos / gapcursor 插件依赖它们
 * （BubbleMenu、SlashMenu、LinkPopover、ImagePopover、TableMenu 均通过
 * coordsAtPos 定位）。缺失时这些调用会抛出
 * "target.getClientRects is not a function" 并成为未处理异常。
 * 这里补齐返回空/零几何的桩实现，让组件在 jsdom 中可正常渲染与交互。
 */
function zeroRect(): DOMRect {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect
}

if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => zeroRect()
  }
}

if (typeof Text !== 'undefined') {
  // Text 在 TS lib.dom 中未声明几何 API，按 Element 形状补桩
  const textProto = Text.prototype as unknown as Element
  if (!textProto.getClientRects) {
    textProto.getClientRects = () => [] as unknown as DOMRectList
  }
  if (!textProto.getBoundingClientRect) {
    textProto.getBoundingClientRect = () => zeroRect()
  }
}
