export type UnMaybeRef<
  T = any,
  ExcludeUndefined extends boolean = true,
> = T extends MaybeRef<infer V>
  ? ExcludeUndefined extends true
    ? Exclude<V, undefined>
    : V
  : never
