// debug.ts
import { reactive, watch } from '@vue/reactivity'

export const obj1 = reactive({
  count1: 0,
  nested1: { attr1: 'hello1' },
})

console.log('Initial obj1:', obj1)

obj1.count++
console.log('After increment1:', obj1)

obj1.nested1.value = 'world1'
console.log('After nested update1:', obj1)

// watch(
//   () => obj1.count1,
//   (count1, prevCount1) => {
//     console.log(`count: ${prevCount1} -> ${count1}`)
//   },
// )

// setTimeout(() => {
//   obj1.count++
// }, 2000)
