import { makeMap } from './makeMap'

export const EMPTY_OBJ: { readonly [key: string]: any } = __DEV__
  ? Object.freeze({})
  : {}
export const EMPTY_ARR: readonly never[] = __DEV__ ? Object.freeze([]) : []

export const NOOP = (): void => {}

/**
 * Always return false.
 */
export const NO = () => false

/**
 * 判断传入的字符串是否为 "on"
 *
 * @param key 待判断的字符串
 * @returns 如果字符串为 "on"，则返回 true；否则返回 false
 */
export const isOn = (key: string): boolean =>
  key.charCodeAt(0) === 111 /* o */ &&
  key.charCodeAt(1) === 110 /* n */ &&
  // uppercase letter
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97)

/**
 * 判断一个字符串是否是模型监听器的键
 *
 * @param key 待判断的字符串
 * @returns 如果 `key` 是一个以 'onUpdate:' 开头的字符串，则返回 true，否则返回 false
 */
export const isModelListener = (key: string): key is `onUpdate:${string}` =>
  key.startsWith('onUpdate:')

export const extend: typeof Object.assign = Object.assign

/**
 * 从数组中移除指定元素
 *
 * @param arr 数组
 * @param el 要移除的元素
 */
export const remove = <T>(arr: T[], el: T): void => {
  const i = arr.indexOf(el)
  if (i > -1) {
    arr.splice(i, 1)
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * 判断对象是否具有指定属性
 *
 * @param val 对象
 * @param key 属性名
 * @returns 如果对象具有指定属性，则返回 true；否则返回 false
 */
export const hasOwn = (
  val: object,
  key: string | symbol,
): key is keyof typeof val => hasOwnProperty.call(val, key)

export const isArray: typeof Array.isArray = Array.isArray

/**
 * 判断值是否为 Map
 *
 * @param val 待判断的值
 * @returns 如果值为 Map，则返回 true；否则返回 false
 */
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'

/**
 * 判断值是否为 Set
 *
 * @param val 待判断的值
 * @returns 如果值为 Set，则返回 true；否则返回 false
 */
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'

/**
 * 判断值是否为 Date
 *
 * @param val 待判断的值
 * @returns 如果值为 Date，则返回 true；否则返回 false
 */
export const isDate = (val: unknown): val is Date =>
  toTypeString(val) === '[object Date]'

/**
 * 判断值是否为 RegExp
 *
 * @param val 待判断的值
 * @returns 如果值为 RegExp，则返回 true；否则返回 false
 */
export const isRegExp = (val: unknown): val is RegExp =>
  toTypeString(val) === '[object RegExp]'

/**
 * 判断值是否为函数
 *
 * @param val 待判断的值
 * @returns 如果值为函数，则返回 true；否则返回 false
 */
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

/**
 * 判断值是否为字符串
 *
 * @param val 待判断的值
 * @returns 如果值为字符串，则返回 true；否则返回 false
 */
export const isString = (val: unknown): val is string => typeof val === 'string'

/**
 * 判断值是否为 Symbol
 *
 * @param val 待判断的值
 * @returns 如果值为 Symbol，则返回 true；否则返回 false
 */
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

/**
 * 判断值是否为对象
 *
 * @param val 待判断的值
 * @returns 如果值为对象，则返回 true；否则返回 false
 */
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

/**
 * 判断值是否为 Promise
 *
 * @param val 待判断的值
 * @returns 如果值为 Promise，则返回 true；否则返回 false
 */
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return (
    (isObject(val) || isFunction(val)) &&
    isFunction((val as any).then) &&
    isFunction((val as any).catch)
  )
}

export const objectToString: typeof Object.prototype.toString =
  Object.prototype.toString

/**
 * 获取值的类型字符串
 *
 * @param value 待判断的值
 * @returns 值的类型字符串
 */
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

/**
 * 获取值的原始类型字符串
 *
 * @param value 待判断的值
 * @returns 值的原始类型字符串
 */
export const toRawType = (value: unknown): string => {
  // extract "RawType" from strings like "[object RawType]"
  return toTypeString(value).slice(8, -1)
}

/**
 * 判断值是否为普通对象
 *
 * @param val 待判断的值
 * @returns 如果值为普通对象，则返回 true；否则返回 false
 */
export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]'

/**
 * 判断字符串是否为整数键
 *
 * @param key 待判断的字符串
 * @returns 如果字符串为整数键，则返回 true；否则返回 false
 */
export const isIntegerKey = (key: unknown): boolean =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key

export const isReservedProp: (key: string) => boolean = /*@__PURE__*/ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ',key,ref,ref_for,ref_key,' +
    'onVnodeBeforeMount,onVnodeMounted,' +
    'onVnodeBeforeUpdate,onVnodeUpdated,' +
    'onVnodeBeforeUnmount,onVnodeUnmounted',
)

export const isBuiltInDirective: (key: string) => boolean =
  /*@__PURE__*/ makeMap(
    'bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo',
  )

/**
 * 缓存字符串处理函数
 *
 * @param fn 字符串处理函数
 * @returns 缓存后的字符串处理函数
 */
const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as T
}

const camelizeRE = /-(\w)/g

/**
 * 将连字符分隔的字符串转换为驼峰命名
 *
 * @param str 待转换的字符串
 * @returns 转换后的驼峰命名字符串
 */
export const camelize: (str: string) => string = cacheStringFunction(
  (str: string): string => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
  },
)

const hyphenateRE = /\B([A-Z])/g

/**
 * 将驼峰命名的字符串转换为连字符分隔
 *
 * @param str 待转换的字符串
 * @returns 转换后的连字符分隔字符串
 */
export const hyphenate: (str: string) => string = cacheStringFunction(
  (str: string) => str.replace(hyphenateRE, '-$1').toLowerCase(),
)

/**
 * 将字符串的首字母大写
 *
 * @param str 待转换的字符串
 * @returns 首字母大写的字符串
 */
export const capitalize: <T extends string>(str: T) => Capitalize<T> =
  cacheStringFunction(<T extends string>(str: T) => {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>
  })

/**
 * 将字符串转换为事件处理函数的键
 *
 * @param str 待转换的字符串
 * @returns 事件处理函数的键
 */
export const toHandlerKey: <T extends string>(
  str: T,
) => T extends '' ? '' : `on${Capitalize<T>}` = cacheStringFunction(
  <T extends string>(str: T) => {
    const s = str ? `on${capitalize(str)}` : ``
    return s as T extends '' ? '' : `on${Capitalize<T>}`
  },
)

// compare whether a value has changed, accounting for NaN.

/**
 * 比较两个值是否发生变化，考虑 NaN 的情况
 *
 * @param value 新值
 * @param oldValue 旧值
 * @returns 如果值发生变化，则返回 true；否则返回 false
 */
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)

/**
 * 调用函数数组中的所有函数
 *
 * @param fns 函数数组
 * @param arg 函数参数
 */
export const invokeArrayFns = (fns: Function[], ...arg: any[]): void => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...arg)
  }
}

/**
 * 定义对象的属性
 *
 * @param obj 对象
 * @param key 属性名
 * @param value 属性值
 * @param writable 是否可写
 */
export const def = (
  obj: object,
  key: string | symbol,
  value: any,
  writable = false,
): void => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value,
  })
}

/**
 * 将字符串转换为数字，如果转换失败则返回原字符串
 *
 * @param val 待转换的字符串
 * @returns 转换后的数字或原字符串
 */
export const looseToNumber = (val: any): any => {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

/**
 * 将字符串转换为数字，如果转换失败则返回原字符串
 *
 * @param val 待转换的字符串
 * @returns 转换后的数字或原字符串
 */
export const toNumber = (val: any): any => {
  const n = isString(val) ? Number(val) : NaN
  return isNaN(n) ? val : n
}

// for typeof global checks without @types/node
declare var global: {}

/**
 * 获取全局对象
 *
 * @returns 全局对象
 */
let _globalThis: any
export const getGlobalThis = (): any => {
  return (
    _globalThis ||
    (_globalThis =
      typeof globalThis !== 'undefined'
        ? globalThis
        : typeof self !== 'undefined'
          ? self
          : typeof window !== 'undefined'
            ? window
            : typeof global !== 'undefined'
              ? global
              : {})
  )
}

const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/

/**
 * 生成属性访问表达式
 *
 * @param name 属性名
 * @returns 属性访问表达式
 */
export function genPropsAccessExp(name: string): string {
  return identRE.test(name)
    ? `__props.${name}`
    : `__props[${JSON.stringify(name)}]`
}

/**
 * 生成缓存键
 *
 * @param source 源字符串
 * @param options 选项
 * @returns 缓存键
 */
export function genCacheKey(source: string, options: any): string {
  return (
    source +
    JSON.stringify(options, (_, val) =>
      typeof val === 'function' ? val.toString() : val,
    )
  )
}
