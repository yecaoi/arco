import { useBreakpoints } from '@vueuse/core'

export function useArcoBreakpoints(): ReturnType<typeof useBreakpoints<'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'>> {
  return useBreakpoints({
    xxl: 1600,
    xl: 1200,
    lg: 992,
    md: 768,
    sm: 576,
    xs: 0,
  })
}
