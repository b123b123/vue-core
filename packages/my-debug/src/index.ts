// debug.ts
import { reactive } from '@vue/reactivity'

const obj = reactive({
  count: 0,
  nested: { value: 'hello' },
})

console.log('Initial obj:', obj)

obj.count++
console.log('After increment:', obj)

obj.nested.value = 'world'
console.log('After nested update:', obj)
