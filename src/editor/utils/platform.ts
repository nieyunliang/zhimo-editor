/** 平台相关工具（独立文件以兼容 Fast Refresh 规则） */

export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export const modKey = isMac ? '⌘' : 'Ctrl+'
