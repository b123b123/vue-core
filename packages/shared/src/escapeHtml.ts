const escapeRE = /["'&<>]/

// 将字符串中的特殊字符转换为 HTML 实体
export function escapeHtml(string: unknown): string {
  const str = '' + string
  const match = escapeRE.exec(str)

  if (!match) {
    return str
  }

  let html = ''
  let escaped: string
  let index: number
  let lastIndex = 0
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escaped = '&quot;'
        break
      case 38: // &
        escaped = '&amp;'
        break
      case 39: // '
        escaped = '&#39;'
        break
      case 60: // <
        escaped = '&lt;'
        break
      case 62: // >
        escaped = '&gt;'
        break
      default:
        continue
    }

    if (lastIndex !== index) {
      html += str.slice(lastIndex, index)
    }

    lastIndex = index + 1
    html += escaped
  }

  return lastIndex !== index ? html + str.slice(lastIndex, index) : html
}

// https://www.w3.org/TR/html52/syntax.html#comments
const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g

// 去除 HTML 注释中的特殊字符
export function escapeHtmlComment(src: string): string {
  return src.replace(commentStripRE, '')
}

export const cssVarNameEscapeSymbolsRE: RegExp =
  /[ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g

// 转义 CSS 变量名中的特殊字符
export function getEscapedCssVarName(
  key: string,
  doubleEscape: boolean,
): string {
  return key.replace(cssVarNameEscapeSymbolsRE, s =>
    doubleEscape ? (s === '"' ? '\\\\\\"' : `\\\\${s}`) : `\\${s}`,
  )
}
