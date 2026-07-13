import http from './http';
import type {
  IdRequest,
  InterfaceInfoAddRequest,
  InterfaceDocDetailVO,
  InterfaceInfoUpdateRequest,
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
  getDocDetail(interfaceInfoId: number) {
    return http
      .get<ResponseData<InterfaceDocDetailVO>>('/interfaceDoc/get', {
        params: { interfaceInfoId },
      })
      .then((response) => response.data);
  },
  invoke(data: InvokeRequest) {
    return http.post<ResponseData<unknown>>('/interfaceInfo/invoke', data).then((response) => response.data);
  },
  /**
   * 新增接口信息
   * @param data 接口新增请求数据
   */
  add(data: InterfaceInfoAddRequest) {
    return http.post<ResponseData<number>>('/interfaceInfo/add', data).then((response) => response.data);
  },
  online(data: IdRequest) {
    return http.post<ResponseData<boolean>>('/interfaceInfo/online', data).then((response) => response.data);
  },
  offline(data: IdRequest) {
    return http.post<ResponseData<boolean>>('/interfaceInfo/offline', data).then((response) => response.data);
  },
  /**
   * 删除接口信息
   * @param data 接口删除请求数据，id 必填
   */
  delete(data: IdRequest) {
    return http.post<ResponseData<boolean>>('/interfaceInfo/delete', data).then((response) => response.data);
  },
  /**
   * 更新接口信息
   * @param data 接口更新请求数据，id 必填，其余字段可选
   */
  update(data: InterfaceInfoUpdateRequest) {
    return http.post<ResponseData<boolean>>('/interfaceInfo/update', data).then((response) => response.data);
  },
};
