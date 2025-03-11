// 定义一个常量 range，表示代码框架中显示的上下文行数
const range: number = 2

// 生成代码框架的函数
export function generateCodeFrame(
  source: string, // 源代码字符串
  start = 0, // 起始位置，默认为0
  end: number = source.length, // 结束位置，默认为源代码的长度
): string {
  // 确保 start 和 end 在源代码的长度范围内
  start = Math.max(0, Math.min(start, source.length))
  end = Math.max(0, Math.min(end, source.length))

  // 如果 start 大于 end，则返回空字符串
  if (start > end) return ''

  // 将内容拆分为单独的行，同时捕获分隔每行的换行符序列
  let lines = source.split(/(\r?\n)/)

  // 将行和换行符序列分离到单独的数组中，以便更容易引用
  const newlineSequences = lines.filter((_, idx) => idx % 2 === 1)
  lines = lines.filter((_, idx) => idx % 2 === 0)

  let count = 0
  const res: string[] = []
  for (let i = 0; i < lines.length; i++) {
    count +=
      lines[i].length +
      ((newlineSequences[i] && newlineSequences[i].length) || 0)
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue
        const line = j + 1
        res.push(
          `${line}${' '.repeat(Math.max(3 - String(line).length, 0))}|  ${
            lines[j]
          }`,
        )
        const lineLength = lines[j].length
        const newLineSeqLength =
          (newlineSequences[j] && newlineSequences[j].length) || 0

        if (j === i) {
          // 添加下划线
          const pad = start - (count - (lineLength + newLineSeqLength))
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start,
          )
          res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length))
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1)
            res.push(`   |  ` + '^'.repeat(length))
          }

          count += lineLength + newLineSeqLength
        }
      }
      break
    }
  }
  return res.join('\n')
}
