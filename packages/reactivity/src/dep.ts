import { extend, isArray, isIntegerKey, isMap, isSymbol } from '@vue/shared'
import type { ComputedRefImpl } from './computed'
import { type TrackOpTypes, TriggerOpTypes } from './constants'
import {
  type DebuggerEventExtraInfo,
  EffectFlags,
  type Subscriber,
  activeSub,
  endBatch,
  shouldTrack,
  startBatch,
} from './effect'

/**
 * 每次发生响应式变化时递增
 * 这用于为计算属性提供一条快速路径，以避免在没有任何变化时重新计算。
 */
export let globalVersion = 0

/**
 * 表示源（Dep）和订阅者（Effect 或 Computed）之间的链接。
 * Deps 和 subs 具有多对多关系 - 每个 dep 和 sub 之间的链接由一个 Link 实例表示。
 *
 * Link 也是两个双向链表中的一个节点 - 一个用于关联的 sub 以跟踪其所有 deps，
 * 一个用于关联的 dep 以跟踪其所有 subs。
 *
 * @internal
 */
export class Link {
  /**
   * - 在每次 effect 运行之前，所有先前的 dep 链接的版本都重置为 -1
   * - 在运行期间，链接的版本在访问时与源 dep 同步
   * - 运行结束后，版本为 -1（从未使用过）的链接将被清理
   */
  version: number

  /**
   * 双向链表的指针
   */
  nextDep?: Link
  prevDep?: Link
  nextSub?: Link
  prevSub?: Link
  prevActiveLink?: Link

  constructor(
    public sub: Subscriber,
    public dep: Dep,
  ) {
    this.version = dep.version
    this.nextDep =
      this.prevDep =
      this.nextSub =
      this.prevSub =
      this.prevActiveLink =
        undefined
  }
}

/**
 * @internal
 */
export class Dep {
  version = 0
  /**
   * 当前活动 effect 与此 dep 之间的链接
   */
  activeLink?: Link = undefined

  /**
   * 表示订阅 effect 的双向链表（尾部）
   */
  subs?: Link = undefined

  /**
   * 表示订阅 effect 的双向链表（头部）
   * 仅在开发环境中，用于按正确顺序调用 onTrigger 钩子
   */
  subsHead?: Link

  /**
   * 用于对象属性 deps 清理
   */
  map?: KeyToDepMap = undefined
  key?: unknown = undefined

  /**
   * 订阅者计数器
   */
  sc: number = 0

  constructor(public computed?: ComputedRefImpl | undefined) {
    if (__DEV__) {
      this.subsHead = undefined
    }
  }

  track(debugInfo?: DebuggerEventExtraInfo): Link | undefined {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return
    }

    let link = this.activeLink
    if (link === undefined || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this)

      // 将链接添加到 activeEffect 作为 dep（作为尾部）
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link
      } else {
        link.prevDep = activeSub.depsTail
        activeSub.depsTail!.nextDep = link
        activeSub.depsTail = link
      }

      addSub(link)
    } else if (link.version === -1) {
      // 从上次运行中重用 - 已经是 sub，只需同步版本
      link.version = this.version

      // 如果这个 dep 有下一个，意味着它不在尾部 - 将其移动到尾部。
      // 这确保了 effect 的 dep 列表按评估期间访问的顺序排列。
      if (link.nextDep) {
        const next = link.nextDep
        next.prevDep = link.prevDep
        if (link.prevDep) {
          link.prevDep.nextDep = next
        }

        link.prevDep = activeSub.depsTail
        link.nextDep = undefined
        activeSub.depsTail!.nextDep = link
        activeSub.depsTail = link

        // 这是头部 - 指向新的头部
        if (activeSub.deps === link) {
          activeSub.deps = next
        }
      }
    }

    if (__DEV__ && activeSub.onTrack) {
      activeSub.onTrack(
        extend(
          {
            effect: activeSub,
          },
          debugInfo,
        ),
      )
    }

    return link
  }

  trigger(debugInfo?: DebuggerEventExtraInfo): void {
    this.version++
    globalVersion++
    this.notify(debugInfo)
  }

  notify(debugInfo?: DebuggerEventExtraInfo): void {
    startBatch()
    try {
      if (__DEV__) {
        // subs 被通知并以逆序批处理，然后在批处理结束时按原始顺序调用，
        // 但 onTrigger 钩子应在此处按原始顺序调用。
        for (let head = this.subsHead; head; head = head.nextSub) {
          if (head.sub.onTrigger && !(head.sub.flags & EffectFlags.NOTIFIED)) {
            head.sub.onTrigger(
              extend(
                {
                  effect: head.sub,
                },
                debugInfo,
              ),
            )
          }
        }
      }
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          // 如果 notify() 返回 `true`，这是一个计算属性。也调用其 dep 的 notify -
          // 这里调用而不是在计算属性的 notify 内部调用，以减少调用堆栈深度。
          ;(link.sub as ComputedRefImpl).dep.notify()
        }
      }
    } finally {
      endBatch()
    }
  }
}

function addSub(link: Link) {
  link.dep.sc++
  if (link.sub.flags & EffectFlags.TRACKING) {
    const computed = link.dep.computed
    // 计算属性获得其第一个订阅者
    // 启用跟踪 + 延迟订阅其所有 deps
    if (computed && !link.dep.subs) {
      computed.flags |= EffectFlags.TRACKING | EffectFlags.DIRTY
      for (let l = computed.deps; l; l = l.nextDep) {
        addSub(l)
      }
    }

    const currentTail = link.dep.subs
    if (currentTail !== link) {
      link.prevSub = currentTail
      if (currentTail) currentTail.nextSub = link
    }

    if (__DEV__ && link.dep.subsHead === undefined) {
      link.dep.subsHead = link
    }

    link.dep.subs = link
  }
}

// 存储 {target -> key -> dep} 连接的主要 WeakMap。
// 从概念上讲，将依赖项视为维护订阅者集合的 Dep 类更容易，但我们只是将它们存储为原始 Map 以减少内存开销。
type KeyToDepMap = Map<any, Dep>

export const targetMap: WeakMap<object, KeyToDepMap> = new WeakMap()

export const ITERATE_KEY: unique symbol = Symbol(
  __DEV__ ? 'Object iterate' : '',
)
export const MAP_KEY_ITERATE_KEY: unique symbol = Symbol(
  __DEV__ ? 'Map keys iterate' : '',
)
export const ARRAY_ITERATE_KEY: unique symbol = Symbol(
  __DEV__ ? 'Array iterate' : '',
)

/**
 * 跟踪对响应式属性的访问。
 *
 * 这将检查当前正在运行的 effect 并将其记录为 dep，记录所有依赖于响应式属性的 effect。
 *
 * @param target - 持有响应式属性的对象。
 * @param type - 定义对响应式属性的访问类型。
 * @param key - 要跟踪的响应式属性的标识符。
 */
export function track(target: object, type: TrackOpTypes, key: unknown): void {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Dep()))
      dep.map = depsMap
      dep.key = key
    }
    if (__DEV__) {
      dep.track({
        target,
        type,
        key,
      })
    } else {
      dep.track()
    }
  }
}

/**
 * 查找与目标（或特定属性）关联的所有 deps 并触发存储在其中的 effects。
 *
 * @param target - 响应式对象。
 * @param type - 定义需要触发 effects 的操作类型。
 * @param key - 可用于定位目标对象中的特定响应式属性。
 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>,
): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // 从未被跟踪
    globalVersion++
    return
  }

  const run = (dep: Dep | undefined) => {
    if (dep) {
      if (__DEV__) {
        dep.trigger({
          target,
          type,
          key,
          newValue,
          oldValue,
          oldTarget,
        })
      } else {
        dep.trigger()
      }
    }
  }

  startBatch()

  if (type === TriggerOpTypes.CLEAR) {
    // 集合被清除
    // 触发目标的所有 effects
    depsMap.forEach(run)
  } else {
    const targetIsArray = isArray(target)
    const isArrayIndex = targetIsArray && isIntegerKey(key)

    if (targetIsArray && key === 'length') {
      const newLength = Number(newValue)
      depsMap.forEach((dep, key) => {
        if (
          key === 'length' ||
          key === ARRAY_ITERATE_KEY ||
          (!isSymbol(key) && key >= newLength)
        ) {
          run(dep)
        }
      })
    } else {
      // 为 SET | ADD | DELETE 调度运行
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key))
      }

      // 为任何数字键更改调度 ARRAY_ITERATE（长度在上面处理）
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY))
      }

      // 还为 ADD | DELETE | Map.SET 上的迭代键运行
      switch (type) {
        case TriggerOpTypes.ADD:
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY))
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY))
            }
          } else if (isArrayIndex) {
            // 数组添加新索引 -> 长度变化
            run(depsMap.get('length'))
          }
          break
        case TriggerOpTypes.DELETE:
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY))
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY))
            }
          }
          break
        case TriggerOpTypes.SET:
          if (isMap(target)) {
            run(depsMap.get(ITERATE_KEY))
          }
          break
      }
    }
  }

  endBatch()
}

export function getDepFromReactive(
  object: any,
  key: string | number | symbol,
): Dep | undefined {
  const depMap = targetMap.get(object)
  return depMap && depMap.get(key)
}
