// debug.ts
import { reactive, watch } from '@vue/reactivity'

export const obj2 = reactive({
  count2: 0,
  nested2: { attr2: 'hello2' },
})

console.log('Initial obj2:', obj2)

obj2.count2++
console.log('After increment2:', obj2)

obj2.nested2.value = 'world2'
console.log('After nested update2:', obj2)

// watch(
//   () => obj2.count2,
//   (count2, prevCount2) => {
//     console.log(`count2: ${prevCount2} -> ${count2}`)
//   },
// )

// setTimeout(() => {
//   obj2.count2++
// }, 2000)
