import type { ColProps, FormInstance, ValidatedError } from '@arco-design/web-vue'
import type { PartialDeep } from 'type-fest'
import type { MaybeRef, Reactive, Ref, WatchCallback } from 'vue'
import { cloneDeep, flattenObject } from 'es-toolkit'
import { get, set } from 'es-toolkit/compat'
import { isRef, nextTick, reactive, ref, toValue, watch } from 'vue'
import { diff } from '../diff'

function removeNonExistingProperties<
  OldValue extends object,
  NewValue extends object,
>(oldValue: OldValue, newValue: NewValue): void {
  for (const originalK in oldValue) {
    const o = oldValue[originalK]
    const n = (newValue as Record<PropertyKey, unknown>)[originalK]

    if (!(originalK in newValue)) {
      delete oldValue[originalK]
    }
    else if (
      o && n
      && typeof o === 'object'
      && typeof n === 'object'
    ) {
      removeNonExistingProperties(o, n)

      if (Object.keys(o).length === 0) {
        delete oldValue[originalK]
      }
    }
  }
}
interface UseFormUtilsOptions<T extends object> {
  props?: Partial<
    Pick<FormInstance, 'layout' | 'size' | 'labelAlign' | 'rules' | 'scrollToFirstError'> & {
      labelColProps: ColProps
      wrapperColProps: ColProps
      /**
       * 是否开启自动标签宽度，仅在 layout="horizontal" 下生效。
       */
      autoLabelWidth: boolean
    }
  >
  /**
   * 默认值, 如果是 Ref, 那么会自动监听其变更
   */
  default?: MaybeRef<T | undefined>
  onChange?: WatchCallback<Reactive<PartialDeep<T>>>
  onSubmitSuccess: (values: T, ev: Event) => any
  onSubmitFailed?: ((data: { values: T, errors: Record<string, ValidatedError> }, ev: Event) => any)
}

interface UseFormUtilsResult<T extends object, Options extends UseFormUtilsOptions<T>> {
  attrs: Options['props'] & {
    ref: Ref<FormInstance | undefined>
    model: Reactive<PartialDeep<T>>
    onSubmitSuccess: (values: Record<string, any>, ev: Event) => any
    onSubmitFailed: () => ((data: {
      values: Record<string, any>
      errors: Record<string, ValidatedError>
    }, ev: Event) => any)
  }
  model: Reactive<PartialDeep<T>>
  el: Ref<FormInstance | undefined>
  onSubmitSuccess: (values: Record<string, any>, ev: Event) => any
  submitting: Ref<boolean>
  reset: () => void
  pauseWatchModel: () => void
  resumeWatchModel: () => void
}

export function useFormUtils<
  T extends object = object,
  Options extends UseFormUtilsOptions<T> = UseFormUtilsOptions<T>,
>(
  options: Options,
): UseFormUtilsResult<T, Options> {
  const defaultValue = toValue(options.default)

  const model = reactive<PartialDeep<T>>(
    defaultValue ? cloneDeep(defaultValue) : Object.create(null),
  )

  let pauseWatchModel: () => void = () => {}
  let resumeWatchModel: () => void = () => {}

  const isUpdateDefault = ref(false)

  if (options.onChange) {
    const { pause, resume } = watch(model, (n, o, on) => {
      if (!isUpdateDefault.value)
        return options.onChange?.(n, o, on)
    })
    pauseWatchModel = pause
    resumeWatchModel = resume
  }

  if (isRef(options.default)) {
    watch(options.default, (n) => {
      isUpdateDefault.value = true
      if (n) {
        const data = diff(n, model)
        if (data) {
          const updated = flattenObject(data)
          for (const key in updated) {
            set(model, key, get(data, key))
          }

          removeNonExistingProperties(model, n)
        }
      }
      else {
        removeNonExistingProperties(model, Object.create(null))
      }

      nextTick(() => isUpdateDefault.value = false)
    }, { deep: true })
  }

  const submitting = ref(false)

  const el = ref<FormInstance>()

  function reset(): void {
    el.value?.resetFields()
  }

  async function onSubmitSuccess(values: T, ev: Event): Promise<void> {
    if (submitting.value)
      return

    submitting.value = true

    try {
      await options.onSubmitSuccess(values, ev)
    }
    catch (error) {
      submitting.value = false
      throw error
    }

    submitting.value = false
  }

  const attrs = {
    ...options.props,
    ref: el,
    model,
    onSubmitSuccess: (onSubmitSuccess as unknown as ((values: Record<string, any>, ev: Event) => any)),
    onSubmitFailed: (options.onSubmitFailed as unknown as () => ((data: {
      values: Record<string, any>
      errors: Record<string, ValidatedError>
    }, ev: Event) => any)),
  } as UseFormUtilsResult<T, Options>['attrs']

  return {
    attrs,
    model,
    el,
    onSubmitSuccess: attrs.onSubmitSuccess,
    submitting,
    reset,
    pauseWatchModel,
    resumeWatchModel,
  }
}
