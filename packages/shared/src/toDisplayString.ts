// enums are compiled away via custom transform so no real dependency here
import { ReactiveFlags } from '@vue/reactivity'
import {
  isArray,
  isFunction,
  isMap,
  isObject,
  isPlainObject,
  isSet,
  isString,
  isSymbol,
  objectToString,
} from './general'

// can't use isRef here since @vue/shared has no deps
const isRef = (val: any): val is { value: unknown } => {
  return !!(val && val[ReactiveFlags.IS_REF] === true)
}

/**
 * For converting {{ interpolation }} values to displayed strings.
 * @private
 * 将 {{ 插值 }} 值转换为显示字符串。
 * @private
 */
export const toDisplayString = (val: unknown): string => {
  return isString(val)
    ? val
    : val == null
      ? ''
      : isArray(val) ||
          (isObject(val) &&
            (val.toString === objectToString || !isFunction(val.toString)))
        ? isRef(val)
          ? toDisplayString(val.value)
          : JSON.stringify(val, replacer, 2)
        : String(val)
}

// JSON.stringify 的替换函数，用于处理特殊对象类型
const replacer = (_key: string, val: unknown): any => {
  if (isRef(val)) {
    return replacer(_key, val.value)
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce(
        (entries, [key, val], i) => {
          entries[stringifySymbol(key, i) + ' =>'] = val
          return entries
        },
        {} as Record<string, any>,
      ),
    }
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()].map(v => stringifySymbol(v)),
    }
  } else if (isSymbol(val)) {
    return stringifySymbol(val)
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    // native elements
    return String(val)
  }
  return val
}

// 将 Symbol 转换为字符串
const stringifySymbol = (v: unknown, i: number | string = ''): any =>
  // Symbol.description in es2019+ so we need to cast here to pass
  // the lib: es2016 check
  // es2019+ 中的 Symbol.description，因此我们需要在此处进行转换以通过 lib: es2016 检查
  isSymbol(v) ? `Symbol(${(v as any).description ?? i})` : v
