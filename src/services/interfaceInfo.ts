import http from './http';
import type {
  IdRequest,
  InterfaceInfoVO,
  InterfaceQuery,
  InvokeRequest,
  PageResult,
  ResponseData,
} from '@/types/api';

export const interfaceService = {
  listPage(params: InterfaceQuery) {
    return http
      .get<ResponseData<PageResult<InterfaceInfoVO>>>('/interfaceInfo/list/page', {
        params,
      })
      .then((response) => response.data);
  },
  getById(id: number) {
    return http
      .get<ResponseData<InterfaceInfoVO>>('/interfaceInfo/get', {
        params: { id },
      })
      .then((response) => response.data);
  },
  invoke(data: InvokeRequest) {
    return http.post<ResponseData<unknown>>('/interfaceInfo/invoke', data).then((response) => response.data);
  },
  online(data: IdRequest) {
    return http.post<ResponseData<boolean>>('/interfaceInfo/online', data).then((response) => response.data);
  },
  offline(data: IdRequest) {
    return http.post<ResponseData<boolean>>('/interfaceInfo/offline', data).then((response) => response.data);
  },
};
