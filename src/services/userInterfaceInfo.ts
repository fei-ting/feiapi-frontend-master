import http from './http';
import type { PageResult } from '@/types/common';
import type { UserInterfaceInfoVO } from '@/types/quota';

export const userInterfaceInfoService = {
  myListPage(params: { current?: number; pageSize?: number }) {
    return http.get<PageResult<UserInterfaceInfoVO>>('/userInterfaceInfo/my/list/page', {
      params,
    });
  },
  adminListPage(params: { current?: number; pageSize?: number }) {
    return http.get<PageResult<UserInterfaceInfoVO>>('/userInterfaceInfo/admin/list/page', {
      params,
    });
  },
};
