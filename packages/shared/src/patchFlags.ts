/**
 * Patch flags 是由编译器生成的优化提示。
 * 当在 diff 过程中遇到带有 dynamicChildren 的块时，算法会进入“优化模式”。
 * 在这种模式下，我们知道 vdom 是由编译器生成的渲染函数生成的，
 * 因此算法只需要处理这些 patch flags 明确标记的更新。
 *
 * Patch flags 可以使用 | 位运算符组合，并可以使用 & 运算符检查，例如：
 *
 * ```js
 * const flag = TEXT | CLASS
 * if (flag & TEXT) { ... }
 * ```
 *
 * 查看 '../../runtime-core/src/renderer.ts' 中的 `patchElement` 函数，了解在 diff 过程中如何处理这些标志。
 */
export enum PatchFlags {
  /**
   * 表示具有动态 textContent 的元素（子节点快速路径）
   */
  TEXT = 1,

  /**
   * 表示具有动态 class 绑定的元素。
   */
  CLASS = 1 << 1,

  /**
   * 表示具有动态样式的元素。
   * 编译器将静态字符串样式预编译为静态对象，并检测并提升内联静态对象
   * 例如，`style="color: red"` 和 `:style="{ color: 'red' }"` 都会被提升为：
   * ```js
   * const style = { color: 'red' }
   * render() { return e('div', { style }) }
   * ```
   */
  STYLE = 1 << 2,

  /**
   * 表示具有非 class/style 动态属性的元素。
   * 也可以在具有任何动态属性（包括 class/style）的组件上使用。
   * 当存在此标志时，vnode 还具有 dynamicProps 数组，其中包含可能更改的属性的键，
   * 以便运行时可以更快地对它们进行 diff（无需担心删除的属性）。
   */
  PROPS = 1 << 3,

  /**
   * 表示具有动态键属性的元素。当键更改时，总是需要进行完整的 diff 以删除旧键。
   * 此标志与 CLASS、STYLE 和 PROPS 互斥。
   */
  FULL_PROPS = 1 << 4,

  /**
   * 表示需要属性 hydration 的元素（但不一定需要 patch）。
   * 例如，事件监听器和带有 prop 修饰符的 v-bind。
   */
  NEED_HYDRATION = 1 << 5,

  /**
   * 表示子节点顺序不变的片段。
   */
  STABLE_FRAGMENT = 1 << 6,

  /**
   * 表示具有键控或部分键控子节点的片段。
   */
  KEYED_FRAGMENT = 1 << 7,

  /**
   * 表示具有未键控子节点的片段。
   */
  UNKEYED_FRAGMENT = 1 << 8,

  /**
   * 表示只需要非属性 patch 的元素，例如 ref 或指令（onVnodeXXX hooks）。
   * 由于每个 patched vnode 都会检查 refs 和 onVnodeXXX hooks，它只是标记 vnode，
   * 以便父块将跟踪它。
   */
  NEED_PATCH = 1 << 9,

  /**
   * 表示具有动态插槽的组件（例如引用 v-for 迭代值的插槽或动态插槽名称）。
   * 具有此标志的组件总是强制更新。
   */
  DYNAMIC_SLOTS = 1 << 10,

  /**
   * 表示仅因为用户在模板的根级别放置了注释而创建的片段。
   * 这是一个仅限开发的标志，因为注释在生产中会被删除。
   */
  DEV_ROOT_FRAGMENT = 1 << 11,

  /**
   * 特殊标志 -------------------------------------------------------------
   * 特殊标志是负整数。它们从不使用位运算符进行匹配（位运算匹配应仅在 patchFlag > 0 的分支中进行），
   * 并且是互斥的。当检查特殊标志时，只需检查 patchFlag === FLAG。
   */

  /**
   * 表示缓存的静态 vnode。这也是 hydration 的提示，以跳过整个子树，因为静态内容永远不需要更新。
   */
  CACHED = -1,
  /**
   * 一个特殊标志，表示 diff 算法应退出优化模式。
   * 例如，在遇到非编译器生成的插槽时（即手动编写的渲染函数，应该始终完全 diff）
   * 或手动 cloneVNodes 时，在由 renderSlot() 创建的块片段上。
   */
  BAIL = -2,
}

/**
 * 仅限开发的标志 -> 名称映射
 */
export const PatchFlagNames: Record<PatchFlags, string> = {
  [PatchFlags.TEXT]: `TEXT`,
  [PatchFlags.CLASS]: `CLASS`,
  [PatchFlags.STYLE]: `STYLE`,
  [PatchFlags.PROPS]: `PROPS`,
  [PatchFlags.FULL_PROPS]: `FULL_PROPS`,
  [PatchFlags.NEED_HYDRATION]: `NEED_HYDRATION`,
  [PatchFlags.STABLE_FRAGMENT]: `STABLE_FRAGMENT`,
  [PatchFlags.KEYED_FRAGMENT]: `KEYED_FRAGMENT`,
  [PatchFlags.UNKEYED_FRAGMENT]: `UNKEYED_FRAGMENT`,
  [PatchFlags.NEED_PATCH]: `NEED_PATCH`,
  [PatchFlags.DYNAMIC_SLOTS]: `DYNAMIC_SLOTS`,
  [PatchFlags.DEV_ROOT_FRAGMENT]: `DEV_ROOT_FRAGMENT`,
  [PatchFlags.CACHED]: `HOISTED`,
  [PatchFlags.BAIL]: `BAIL`,
}
