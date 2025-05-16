import { get, set } from 'es-toolkit/compat'

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}

export function diff<
  NewValue extends object,
  OldValue extends object,
>(
  updated: NewValue | undefined,
  original: OldValue | undefined,
): { data: DeepPartial<NewValue>, is: boolean } {
  let is = false

  function fn<
    NewValue extends object,
    OldValue extends object,
  >(
    updated: NewValue | undefined,
    original: OldValue | undefined,
  ): DeepPartial<NewValue> {
    const data: DeepPartial<NewValue> = Object.create(null)

    if (updated === undefined || original === undefined) {
      return data
    }

    // 遍历更新后的对象的所有键
    for (const key in updated) {
    // 检查是否在原始对象中存在此键
      if (key in original) {
        const o = get(original, key)
        const n = updated[key]

        // 如果两者都是对象（且不为null），则递归比较
        if (
          o
          && n
          && typeof o === 'object'
          && typeof n === 'object'
        ) {
          const nestedChanges = fn(o, n)
          // 只有当有嵌套变更时才添加
          if (Object.keys(nestedChanges).length > 0) {
            set(data, key, nestedChanges)
            is = true
          }
        }
        // 直接值比较，如果不同则记录
        else if (o !== n) {
          data[key] = n
          is = true
        }
      }
      // 如果是新增的键，也记录
      else {
        data[key] = (updated as any)[key]
        is = true
      }
    }

    return data
  }

  return { data: fn(updated, original), is }
}
