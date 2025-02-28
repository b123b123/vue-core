// 定义一个枚举类型 SlotFlags，用于表示不同类型的插槽标志
export enum SlotFlags {
  /**
   * 稳定的插槽，仅引用插槽属性或上下文状态。
   * 插槽可以完全捕获其自身的依赖关系，因此当向下传递时，父组件不需要强制子组件更新。
   */
  STABLE = 1,
  /**
   * 引用作用域变量（v-for 或外部插槽属性）或具有条件结构（v-if, v-for）的插槽。
   * 父组件需要强制子组件更新，因为插槽不能完全捕获其依赖关系。
   */
  DYNAMIC = 2,
  /**
   * 被转发到子组件中的 `<slot/>`。
   * 父组件是否需要更新子组件取决于父组件本身接收到的插槽类型。
   * 这需要在运行时进行细化，当子组件的 vnode 被创建时（在 `normalizeChildren` 中）。
   */
  FORWARDED = 3,
}

// 仅在开发环境中使用
// 定义一个对象 slotFlagsText，将 SlotFlags 枚举值映射为对应的字符串表示
export const slotFlagsText: Record<SlotFlags, string> = {
  [SlotFlags.STABLE]: 'STABLE',
  [SlotFlags.DYNAMIC]: 'DYNAMIC',
  [SlotFlags.FORWARDED]: 'FORWARDED',
}
