import http from './http';
import type { PageResult, ResponseData, UserInterfaceInfoVO } from '@/types/api';

export const userInterfaceInfoService = {
  myListPage(params: { current?: number; pageSize?: number }) {
    return http
      .get<ResponseData<PageResult<UserInterfaceInfoVO>>>('/userInterfaceInfo/my/list/page', {
        params,
      })
      .then((response) => response.data);
  },
  adminListPage(params: { current?: number; pageSize?: number }) {
    return http
      .get<ResponseData<PageResult<UserInterfaceInfoVO>>>('/userInterfaceInfo/admin/list/page', {
        params,
      })
      .then((response) => response.data);
  },
};
