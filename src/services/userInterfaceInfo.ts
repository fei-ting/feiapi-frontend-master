import http from './http';
import type { PageResult } from '@/types/common';
import type { UserInterfaceInfoVO } from '@/types/quota';

/** 用户接口调用信息服务。 */
export const userInterfaceInfoService = {
  /** 分页查询当前用户的接口调用记录。 */
  myListPage(params: { current?: number; pageSize?: number }) {
    return http.get<PageResult<UserInterfaceInfoVO>>('/userInterfaceInfo/my/list/page', {
      params,
    });
  },
};
