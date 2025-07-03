import { get, has, set } from 'es-toolkit/compat'

export type DiffData<T> = T extends object ? {
  [P in keyof T]?: T[P] extends object ? DiffData<T[P]> : T[P];
} : T

export function diff<
  NewValue = any,
  OldValue = any,
>(
  updated: NewValue,
  original?: OldValue,
): DiffData<NewValue> | undefined {
  let result: DiffData<NewValue> | undefined

  // // 针对原值为空的比较
  // if (original === undefined || original === null) {
  //   // 如果新值和旧值不同
  //   if (updated !== original)
  //     result = updated as DiffData<NewValue>
  // }
  // 针对对象类型的比较
  if (typeof updated === 'object') {
    // 针对数组的比较
    if (Array.isArray(updated)) {
      // 如果原值也是数组
      if (Array.isArray(original)) {
        const _result = []
        for (const [index, i] of updated.entries()) {
          // 如果旧值的长度小于当前索引位置
          if (original.length < index + 1) {
            _result.push(i)
          }
          // 如果新元素是对象
          else if (typeof i === 'object') {
            const _i = diff(i, original[index])
            if (_i !== undefined)
              _result.push(_i)
          }
          // 如果新旧值不相等
          else if (i !== original[index]) {
            _result.push(i)
          }
        }

        if (_result.length)
          result = _result as DiffData<NewValue>
      }
      // 如果原值不是数组
      else {
        result = updated as DiffData<NewValue>
      }
    }
    // 针对Record的比较
    else {
      const _result = Object.create(null)
      // 遍历新值的所有键
      for (const key in updated) {
        const n = get(updated, key)

        // 检查是否旧值中存在此键
        if (has(original, key)) {
          // 取旧值
          const o = get(original, key)

          const diffValue = diff(n, o)
          if (diffValue !== undefined) {
            // 将值设置为差异数据
            set(_result, key, diffValue)
          }
        }
        else {
          set(_result, key, n)
        }
      }

      if (Object.keys(_result).length) {
        result = _result
      }
    }
  }
  // 两个对象不可能相等, 所以在处理完对象的情况后再比较具体值
  else if (updated !== original) {
    result = updated as DiffData<NewValue>
  }

  return result
}
