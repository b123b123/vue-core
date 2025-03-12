import type { ReactiveEffect } from './effect'
import { warn } from './warning'

export let activeEffectScope: EffectScope | undefined

export class EffectScope {
  /**
   * @internal
   * 标识当前作用域是否处于活动状态
   */
  private _active = true
  /**
   * @internal
   * 存储当前作用域中的所有反应性副作用
   */
  effects: ReactiveEffect[] = []
  /**
   * @internal
   * 存储当前作用域中的所有清理函数
   */
  cleanups: (() => void)[] = []

  private _isPaused = false

  /**
   * 仅由未分离的作用域分配
   * @internal
   * 父作用域
   */
  parent: EffectScope | undefined
  /**
   * 记录未分离的作用域
   * @internal
   * 子作用域
   */
  scopes: EffectScope[] | undefined
  /**
   * 跟踪子作用域在其父作用域的 scopes 数组中的索引，以便优化移除
   * @internal
   * 子作用域在父作用域中的索引
   */
  private index: number | undefined

  constructor(public detached = false) {
    this.parent = activeEffectScope
    if (!detached && activeEffectScope) {
      this.index =
        (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this,
        ) - 1
    }
  }

  get active(): boolean {
    return this._active
  }

  /**
   * 暂停当前作用域及其所有子作用域和副作用
   */
  pause(): void {
    if (this._active) {
      this._isPaused = true
      let i, l
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause()
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause()
      }
    }
  }

  /**
   * 恢复当前作用域及其所有子作用域和副作用
   */
  resume(): void {
    if (this._active) {
      if (this._isPaused) {
        this._isPaused = false
        let i, l
        if (this.scopes) {
          for (i = 0, l = this.scopes.length; i < l; i++) {
            this.scopes[i].resume()
          }
        }
        for (i = 0, l = this.effects.length; i < l; i++) {
          this.effects[i].resume()
        }
      }
    }
  }

  /**
   * 运行传入的函数，并将当前作用域设置为活动状态
   */
  run<T>(fn: () => T): T | undefined {
    if (this._active) {
      const currentEffectScope = activeEffectScope
      try {
        activeEffectScope = this
        return fn()
      } finally {
        activeEffectScope = currentEffectScope
      }
    } else if (__DEV__) {
      warn(`无法运行非活动状态的 effect scope。`)
    }
  }

  /**
   * 仅应在非分离的作用域上调用
   * @internal
   * 将当前作用域设置为活动状态
   */
  on(): void {
    activeEffectScope = this
  }

  /**
   * 仅应在非分离的作用域上调用
   * @internal
   * 将当前作用域设置为非活动状态
   */
  off(): void {
    activeEffectScope = this.parent
  }

  /**
   * 停止当前作用域及其所有子作用域和副作用
   */
  stop(fromParent?: boolean): void {
    if (this._active) {
      this._active = false
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop()
      }
      this.effects.length = 0

      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]()
      }
      this.cleanups.length = 0

      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true)
        }
        this.scopes.length = 0
      }

      // 嵌套作用域，从父作用域中解除引用以避免内存泄漏
      if (!this.detached && this.parent && !fromParent) {
        // 优化的 O(1) 移除
        const last = this.parent.scopes!.pop()
        if (last && last !== this) {
          this.parent.scopes![this.index!] = last
          last.index = this.index!
        }
      }
      this.parent = undefined
    }
  }
}

/**
 * 创建一个 effect scope 对象，该对象可以捕获在其内部创建的反应性副作用（即计算属性和观察者），以便这些副作用可以一起处理。
 * 有关此 API 的详细用例，请参阅其对应的 {@link https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md | RFC}。
 *
 * @param detached - 可用于创建“分离的” effect scope。
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#effectscope}
 */
export function effectScope(detached?: boolean): EffectScope {
  return new EffectScope(detached)
}

/**
 * 如果有当前活动的 effect scope，则返回它。
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#getcurrentscope}
 */
export function getCurrentScope(): EffectScope | undefined {
  return activeEffectScope
}

/**
 * 在当前活动的 effect scope 上注册一个清理回调。当关联的 effect scope 停止时，将调用该回调。
 *
 * @param fn - 要附加到作用域清理的回调函数。
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#onscopedispose}
 */
export function onScopeDispose(fn: () => void, failSilently = false): void {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn)
  } else if (__DEV__ && !failSilently) {
    warn(`onScopeDispose() 在没有活动的 effect scope 时被调用，` + `无法关联。`)
  }
}
