/** 平台相关工具（独立文件以兼容 Fast Refresh 规则） */

export const isMac =
  typeof navigator !== 'undefined' &&
  /Macintosh|Mac OS X|iPhone|iPad/.test(navigator.userAgent)

export const modKey = isMac ? '⌘' : 'Ctrl+'
