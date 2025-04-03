import type { TableColumnData, TableData, TableInstance } from '@arco-design/web-vue'
import type { Get, Paths } from 'type-fest'
import type { MaybeRef } from 'vue'
import type { MaybeIterable } from '../maybe-iterable'

import { get, omit } from 'es-toolkit/compat'

type Item<T> = T extends MaybeRef<infer V>
  ? V extends MaybeIterable<infer I>
    ? Exclude<I, undefined>
    : Exclude<V, undefined>
  : never

type ItemPaths<T> = Paths<Item<T>>

interface Row<Data> {
  record: Item<Data> & TableData
  column: { title: string, dataIndex: ItemPaths<Data> }
  rowIndex: number
}

type RenderFn<Data> = (v: Row<Data>) => unknown

function rowRender<Data>(
  action: RenderFn<Data>,
) {
  return (v: Row<Data>) => action(v)
}
type TableColumnRender<Data> = typeof rowRender<Data>

type ColumnOptions<Data> = Omit<TableColumnData, 'dataIndex' | 'render' | 'slotName' | 'fixed'> & {
  target?: ItemPaths<Data>
  render?: ReturnType<TableColumnRender<Data>>
  slot?: ItemPaths<Data> | string
  condition?: (() => boolean)
  /**
   * 设置了 fixed 的列必须设置 width 指定列的宽度。
   * 注意：
   *  1. 要配合 :scroll="{ x: number }" 使用。
   *  2. 此外 columns 中至少需要有一列不设置宽度，自适应，不然会有样式问题。
   */
  fixed?: TableColumnData['fixed']
}

function columns<Data>(
  options: ColumnOptions<Data>[],
): TableColumnData[] {
  return options.filter((i) => {
    if (i.condition)
      return i.condition()

    else
      return true
  }).map(i => ({
    slotName: (i.slot || i.target) as string | undefined,
    dataIndex: i.target as string | undefined,
    ...omit(i, ['target', 'slot', 'condition']),
  }) as TableColumnData)
}

function rowClass<Data>(
  fn: (
    options: { row: Item<Data>, index: number }
  ) => string | undefined,
): (record: Item<Data>, rowIndex: number) => string | undefined {
  return (record: Item<Data>, rowIndex: number) => fn({ row: record, index: rowIndex })
}

interface ColumnTemplateValueUtilsValue<Data> {
  /**
   * column title
   */
  title: Row<Data>['column']['title']
  /**
   * field
   */
  field: Row<Data>['column']['dataIndex']
  /**
   * safe field name
   */
  safeField: keyof Item<Data>
  /**
   * column value
   */
  value: Get<Row<Data>['record'], Row<Data>['column']['dataIndex'] & any>
  /**
   * row result/record
   */
  row: Row<Data>['record']
  /**
   * row result index
   */
  index: Row<Data>['rowIndex']
}

function resolveSlot<Data>(
  v: Row<Data>,
): ColumnTemplateValueUtilsValue<Data>

function resolveSlot<Data, FnV = unknown>(
  v: Row<Data>,
  fn: (v: ColumnTemplateValueUtilsValue<Data>) => FnV,
): FnV

function resolveSlot<Data, FnV = unknown>(
  v: Row<Data>,
  fn?: (v: ColumnTemplateValueUtilsValue<Data>) => FnV,
): ColumnTemplateValueUtilsValue<Data> | FnV {
  const value = {
    /**
     * column title
     */
    title: v.column.title,
    /**
     * field
     */
    field: v.column.dataIndex,
    /**
     * safe field name
     */
    safeField: v.column.dataIndex,
    /**
     * column value
     */
    value: get(v.record, v.column.dataIndex),
    /**
     * row result/record
     */
    row: v.record,
    /**
     * row result index
     */
    index: v.rowIndex,
  } as ColumnTemplateValueUtilsValue<Data>

  return fn ? fn(value) : value
}

interface UseTableUtilsResult<T> {
  columns: typeof columns<T>
  rowRender: typeof rowRender<T>
  rowClass: typeof rowClass<T>
  resolveSlot: typeof resolveSlot<T>
  attrs: Partial<TableInstance>
}

export function useTableUtils<T>(
  data?: T,
  options?: {
    columns?: ColumnOptions<T>[]
  } & Omit<Partial<TableInstance>, 'columns'>,
): UseTableUtilsResult<T> {
  return {
    columns,
    rowRender,
    rowClass,
    resolveSlot,
    attrs: {
      ...options,
      columns: columns(options?.columns || []),
      data: data as TableData[],
    },
  }
}
