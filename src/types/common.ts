/**
 * 通用类型定义，包含响应结构、分页、排序等跨领域基础类型。
 */

/**
 * 统一响应数据结构。
 *
 * @template T 响应数据类型
 */
export interface ResponseData<T> {
  /** 响应状态码，0 表示成功 */
  code: number;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
}

/**
 * 分页查询结果。
 *
 * @template T 列表项类型
 */
export interface PageResult<T> {
  /** 数据列表 */
  records: T[];
  /** 总记录数 */
  total: number;
  /** 每页大小 */
  size: number;
  /** 当前页码 */
  current: number;
}

/** 排序方向 */
export type SortOrder = 'ascend' | 'descend';

/** 通用 ID 请求参数 */
export interface IdRequest {
  /** 主键 ID */
  id: number;
}
