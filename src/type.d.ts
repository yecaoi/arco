export type MaybeIterable<T> = Iterable<T> | AsyncIterable<T>

export type UnMaybeRef<
  T = any,
  ExcludeUndefined extends boolean = true,
> = T extends MaybeRef<infer V>
  ? ExcludeUndefined extends true
    ? Exclude<V, undefined>
    : V
  : never

export type GetArg<
  N extends number = 0,
  T = unknown,
  ExcludeUndefined extends boolean = true,
> = T extends (...args: any) => any
  ? ExcludeUndefined extends true
    ? Exclude<Parameters<T>[N], undefined>
    : Parameters<T>[N]
  : never
