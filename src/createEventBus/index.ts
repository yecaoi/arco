import type { WatchHandle, WatchOptions, WatchSource } from 'vue'
import { omit, pickBy } from 'es-toolkit'
import { reactive, watch } from 'vue'
import { isWritableRef } from '../isWritableRef'

type Payload<T = unknown> = T
type Callback<T = unknown> = (payload?: Payload<T>) => unknown | Promise<unknown>

type EventBusType<T = unknown> = {
  /**
   * 调用事件
   *
   * 若探测到子事件会一并调用：
   *
   * ```ts
   * EventBus.register('A', () => console.log('A'))
   * EventBus.register('A.sub1', () => console.log('A.sub1'))
   * EventBus.register('A.sub2', () => console.log('A.sub2'))
   *
   * EventBus.call('A')
   * ```
   *
   * ```
   *
   * > A
   * > A.sub1
   * > A.sub2
   * ```
   *
   * @param event 事件名称
   * @param payload 事传递给事件的数据
   */
  call: (event: string, payload?: Payload<T>) => void | Promise<void>
  /**
   * 注册事件
   * @param event 事件名称
   * @param callback 事件回调函数
   */
  register: (event: string, callback: Callback<T>) => void
  /**
   * 删除事件
   * @param event 事件名称
   */
  delete: (event: string) => void
  /**
   * 用于在不同组件中同步值, 也可以通过 EventBus 访问同步的值
   * @param name 属性名称
   * @param source 监听源
   * @param extra 额外属性
   *
   * e.g.
   *
   * ```vue
   * <!-- 组件 A.vue -->
   * <script lang="ts" setup>
   * const selection = ref([1,2,3])
   * EventBus.sync('SelectedItems', selection)
   * </script>
   *
   * <template>
   * ...
   * </template>
   *
   * <!-- 组件 B.vue -->
   * <script lang="ts" setup>
   * const selection = ref([])
   * EventBus.sync('SelectedItems', selection)
   * // 如果已经执行组件 A.vue, 那么这里的 selection 的值会被设置成 [1,2,3]
   * </script>
   *
   * <template>
   * ...
   * </template>
   * ```
   */
  sync: (name: string, source: WatchSource<T>, options?: Omit<WatchOptions, 'immediate'> & { extra?: unknown }) => WatchHandle
} & {
  [event: string]: T
}

export function createEventBus(): <T>() => EventBusType<T> {
  const EventBus = reactive<EventBusType<any>>({
    async call(event, payload) {
      const callbacks = (this[event] ? [this[event]] : []) as Callback<any>[]

      const subCallbacks = Object.values(
        pickBy(
          omit(this, ['emit', 'on', 'off', 'watch']),
          (_, event_) => isSubPath(event, event_ as string),
        ),
      ) as Callback<any>[]
      callbacks.push(...subCallbacks)

      for (const callback of callbacks)
        await callback(payload)
    },
    register(event, callback) {
      this[event] = callback
    },
    delete(event) {
      delete this[event]
    },
    sync(event, source, options) {
      if (options?.extra) {
        this[`${event}Extra`] = options?.extra
      }
      const source_ = source as unknown
      if (isWritableRef(source_) && this[event]) {
        source_.value = this[event]
      }

      return watch(source, (n) => {
        this[event] = n
      }, { ...options, immediate: true })
    },
  })

  return () => EventBus
}

function isSubPath(parent: string, child: string): boolean {
  let result = true
  if (parent !== child && child.startsWith(parent)) {
    const parentPaths = parent.split('.')
    for (const [index, childPath] of child.split('.').entries()) {
      if (parentPaths[index] !== undefined && childPath !== parentPaths[index]) {
        result = false
        break
      }
    }
  }
  else {
    result = false
  }

  return result
}
