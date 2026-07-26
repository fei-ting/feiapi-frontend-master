/**
 * 公共数据表格类型定义。
 */

/** 表格列配置。 */
export interface DataTableColumn {
  /** 列唯一标识，同时作为默认取值字段。 */
  key: string;
  /** 表头标题。 */
  title: string;
  /** 列最小宽度，单位为像素。 */
  minWidth?: number;
  /** 单元格对齐方式。 */
  align?: 'left' | 'center' | 'right';
}

/** 表格分页配置。 */
export interface DataTablePagination {
  /** 当前页码，从 1 开始。 */
  current: number;
  /** 每页记录数。 */
  pageSize: number;
  /** 总记录数。 */
  total: number;
}
