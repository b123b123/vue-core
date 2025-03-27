// debug.ts
import { reactive, watch } from '@vue/reactivity'

const obj = reactive({
  count: 0,
  nested: { value: 'hello' },
})

console.log('Initial obj:', obj)

obj.count++
console.log('After increment:', obj)

obj.nested.value = 'world'
console.log('After nested update:', obj)

watch(
  () => obj.count,
  (count, prevCount) => {
    console.log(`count: ${prevCount} -> ${count}`)
  },
)

setTimeout(() => {
  obj.count++
}, 2000)
