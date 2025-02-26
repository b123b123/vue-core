// 导入所需的工具函数
import { hyphenate, isArray, isObject, isString } from './general'

// 定义一个类型，用于表示规范化后的样式对象
export type NormalizedStyle = Record<string, string | number>

// 定义一个函数，用于规范化样式
export function normalizeStyle(
  value: unknown, // 接受一个未知类型的值
): NormalizedStyle | string | undefined {
  // 返回值可以是 NormalizedStyle、字符串或 undefined
  if (isArray(value)) {
    // 如果值是数组
    const res: NormalizedStyle = {} // 创建一个空的规范化样式对象
    for (let i = 0; i < value.length; i++) {
      // 遍历数组
      const item = value[i] // 获取数组中的每一项
      const normalized = isString(item) // 如果项是字符串，则解析字符串样式
        ? parseStringStyle(item)
        : (normalizeStyle(item) as NormalizedStyle) // 否则递归规范化样式
      if (normalized) {
        // 如果规范化后的值存在
        for (const key in normalized) {
          // 遍历规范化后的对象
          res[key] = normalized[key] // 将规范化后的键值对添加到结果对象中
        }
      }
    }
    return res // 返回规范化后的样式对象
  } else if (isString(value) || isObject(value)) {
    // 如果值是字符串或对象
    return value // 直接返回该值
  }
}

// 定义正则表达式，用于分隔样式列表
const listDelimiterRE = /;(?![^(]*\))/g
// 定义正则表达式，用于分隔属性
const propertyDelimiterRE = /:([^]+)/
// 定义正则表达式，用于匹配样式注释
const styleCommentRE = /\/\*[^]*?\*\//g

// 定义一个函数，用于解析字符串样式
export function parseStringStyle(cssText: string): NormalizedStyle {
  const ret: NormalizedStyle = {} // 创建一个空的规范化样式对象
  cssText
    .replace(styleCommentRE, '') // 去除注释
    .split(listDelimiterRE) // 按照样式列表分隔符分割
    .forEach(item => {
      if (item) {
        const tmp = item.split(propertyDelimiterRE) // 按照属性分隔符分割
        if (tmp.length > 1) {
          ret[tmp[0].trim()] = tmp[1].trim() // 去除空格并添加到结果对象中
        }
      }
    })
  return ret // 返回规范化后的样式对象
}

// 将规范化后的样式对象转换为字符串
export function stringifyStyle(
  styles: NormalizedStyle | string | undefined, // 接受一个规范化后的样式对象或字符串或 undefined
): string {
  if (!styles) return '' // 如果样式为空，返回空字符串
  if (isString(styles)) return styles // 如果样式是字符串，直接返回

  let ret = '' // 初始化返回的字符串
  for (const key in styles) {
    // 遍历样式对象
    const value = styles[key] // 获取样式值
    if (isString(value) || typeof value === 'number') {
      // 如果样式值是字符串或数字
      const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key) // 如果键以 '--' 开头，保持不变，否则将键转换为连字符格式
      // 仅渲染有效值
      ret += `${normalizedKey}:${value};` // 将键值对添加到返回的字符串中
    }
  }
  return ret // 返回样式字符串
}

// 定义一个函数，用于规范化类名
export function normalizeClass(value: unknown): string {
  let res = '' // 初始化返回的字符串
  if (isString(value)) {
    // 如果值是字符串
    res = value // 直接返回该字符串
  } else if (isArray(value)) {
    // 如果值是数组
    for (let i = 0; i < value.length; i++) {
      // 遍历数组
      const normalized = normalizeClass(value[i]) // 递归规范化类名
      if (normalized) {
        res += normalized + ' ' // 将规范化后的类名添加到返回的字符串中
      }
    }
  } else if (isObject(value)) {
    // 如果值是对象
    for (const name in value) {
      // 遍历对象
      if (value[name]) {
        // 如果值为真
        res += name + ' ' // 将键添加到返回的字符串中
      }
    }
  }
  return res.trim() // 去除首尾空格并返回类名字符串
}

// 定义一个函数，用于规范化属性
export function normalizeProps(
  props: Record<string, any> | null, // 接受一个属性对象或 null
): Record<string, any> | null {
  if (!props) return null // 如果属性对象为空，返回 null
  let { class: klass, style } = props // 解构属性对象中的 class 和 style
  if (klass && !isString(klass)) {
    // 如果 class 存在且不是字符串
    props.class = normalizeClass(klass) // 规范化 class
  }
  if (style) {
    // 如果 style 存在
    props.style = normalizeStyle(style) // 规范化 style
  }
  return props // 返回规范化后的属性对象
}
