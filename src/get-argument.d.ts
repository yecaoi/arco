export type GetArgument<
  N extends number = 0,
  T = unknown,
  ExcludeUndefined extends boolean = true,
> = T extends (...args: any) => any
  ? ExcludeUndefined extends true
    ? Exclude<Parameters<T>[N], undefined>
    : Parameters<T>[N]
  : never
