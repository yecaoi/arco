import type { Ref, WritableComputedRef } from 'vue'
import { isReadonly, isRef } from 'vue'

type Result<T> = Ref<T> | WritableComputedRef<T>

export function isWritableRef<T>(value: unknown): value is Result<T> {
  return isRef(value) && !isReadonly(value)
}
