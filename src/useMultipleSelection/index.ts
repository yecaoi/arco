import type { ComputedRef, Ref } from 'vue'
import { intersectionBy, isSubsetWith } from 'es-toolkit'
import { concat, filter, find, findIndex } from 'es-toolkit/compat'
import { computed, isRef, ref, toValue, unref, watch } from 'vue'

function doesMatch<T>(value: T | undefined, key: keyof T | undefined) {
  return (i: T) => key ? i?.[key] === value?.[key] : i === value
}

type UseMultipleSelectionOptions<T> = (T extends object ? { key?: keyof T } : never) & {
  /**
   * 当 state 变更时是否保留已选择的选项
   */
  keep?: boolean
  /**
   * 当满足此条件时才能选中
   * @param item state 的元素
   * @returns 是否选中
   */
  condition?: (item: T) => boolean
}

export function useMultipleSelection<T>(
  state: Ref<T[] | undefined>,
  options?: UseMultipleSelectionOptions<T>,
): {
    selection: Ref<T[]>
    isSelected: (value: T) => boolean
    select: {
      toggle: (value: T, force?: boolean) => boolean
      all: (condition?: (value: T) => boolean | undefined) => void
      range: (end: T, condition?: (value: T) => boolean | undefined) => void
    }
    selectedAll: ComputedRef<boolean>
  } {
  const selection: Ref<T[]> = ref([])
  const lastSelected = ref<T>()
  const rangeBefore: Ref<T[] | undefined> = ref()

  const key = options?.key

  // 如果 state 变动了，那么更新 selection 和 lastSelected
  watch(
    isRef(state) ? state : () => state,
    (n) => {
      // 如果不保留已选择的项, 则意味着要去除无效的已选项
      if (!options?.keep) {
        // 如果新值是 undefined, 则清空已选中的值, 否则过滤掉不存在于新值中的项
        selection.value = n === undefined
          ? []
          : intersectionBy(n, selection.value, i => key ? i[key] : i)
      }

      // 如果新的值是空的 重置最后选中的项
      if (n === undefined) {
        lastSelected.value = undefined
      }
      else if (lastSelected.value !== undefined) {
        // 查找新的数据里是否还有最后一项
        lastSelected.value = find<T>(n, doesMatch<T>(lastSelected.value, key))
      }
    },
  )

  // 如果最后选中的项变了, 那么重置
  watch(lastSelected, () => {
    rangeBefore.value = undefined
  })

  /**
   * 如果值已经选择，则剔除，否则添加
   * @param value 要切换的值
   * @returns 如果值已经选择，则返回 false, 否则返回 true
   */
  function toggle(value: T, force?: boolean): boolean {
    lastSelected.value = value
    rangeBefore.value = undefined

    const index = findIndex(selection.value, doesMatch(value, key))
    const existing = index === -1

    if (force !== undefined) {
      if (force) {
        if (!existing)
          selection.value = concat(selection.value, [value])
      }
      else {
        if (existing)
          selection.value = filter(selection.value, (_, oi) => oi !== index)
      }
      return force
    }

    if (existing) {
      selection.value = filter(selection.value, (_, oi) => oi !== index)
    }
    else if (options?.condition) {
      if (options.condition(value))
        selection.value.push(value)
    }
    else {
      selection.value = concat(selection.value, [value])
    }
    return !existing
  }

  const selectedAll = computed(() => {
    const items = toValue(state)
    if (items?.length)
      return items ? isSubsetWith(selection.value, items, (x, y) => key ? x?.[key] === y?.[key] : x === y) : false
    return false
  })

  /**
   * 选择或取消全选
   * @param condition 条件表达式, 如果计算结果为真, 则选中, 否则不选中
   */
  function all(condition?: (value: T) => boolean | undefined): void {
    lastSelected.value = undefined
    rangeBefore.value = undefined
    const items = toValue(state)

    if (items) {
      if (condition === undefined) {
        // 表示完全相等
        if (selectedAll.value) {
          selection.value = []
        }
        else {
          const condition = options?.condition
          if (condition)
            selection.value = items.filter(i => condition(i))
          else
            selection.value = [...items]
        }
      }
      else {
        const results: T[] = []

        items.forEach((i) => {
          if (condition(i))
            results.push(i)
        })

        selection.value = results
      }
    }
  }

  /**
   * 范围选择
   * @param end 结束范围
   * @param condition 条件表达式, 如果计算结果为真, 则选中, 否则不选中
   */
  function range(end: T, condition?: (value: T) => boolean | undefined): void {
    const currentState = unref(state)
    const endIndex = findIndex<T>(currentState, doesMatch(end, key))
    const existing = endIndex !== -1

    if (currentState && existing) {
      let startIndex: number

      // 如果没有设置最后选择的，则设置默认选择第一项
      if (lastSelected.value === undefined) {
        startIndex = 0
        lastSelected.value = currentState[startIndex]
      }
      else {
        startIndex = findIndex<T>(currentState, doesMatch<T>(lastSelected.value, key))
      }

      // 如果刚刚有选择, 则恢复到刚刚的状态
      if (rangeBefore.value !== undefined)
        selection.value = [...rangeBefore.value]

      // 设置范围
      const range_ = { start: 0, end: 0 }
      if (startIndex > endIndex) {
        range_.start = endIndex
        range_.end = startIndex
      }
      else {
        range_.start = startIndex
        range_.end = endIndex
      }

      rangeBefore.value = [...selection.value]
      currentState.slice(range_.start, range_.end + 1).forEach((i) => {
        // 将没有选择的项选中
        const existing = find(selection.value, doesMatch(i, key)) !== undefined
        if (!existing) {
          if (condition === undefined) {
            if (options?.condition) {
              if (options.condition(i))
                selection.value.push(i)
            }
            else {
              selection.value.push(i)
            }
          }
          else {
            if (condition(i))
              selection.value.push(i)
          }
        }
      })
    }
  }

  function isSelected(value: T): boolean {
    return findIndex(selection.value, doesMatch(value, key)) !== -1
  }

  return { selection, isSelected, select: { toggle, all, range }, selectedAll }
}
