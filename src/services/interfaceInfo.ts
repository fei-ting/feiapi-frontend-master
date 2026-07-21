import http from './http';
import type { IdRequest, PageResult } from '@/types/common';
import type {
  InterfaceInfoAddRequest,
  InterfaceInfoUpdateRequest,
  InterfaceInfoVO,
  InterfaceQuery,
} from '@/types/interface';
import type { InterfaceDocDetailVO, InterfaceDocSaveRequest } from '@/types/interfaceDoc';
import type { InvokeRequest } from '@/types/invoke';

export const interfaceService = {
  listPage(params: InterfaceQuery) {
    return http.get<PageResult<InterfaceInfoVO>>('/interfaceInfo/list/page', {
      params,
    });
  },
  getById(id: number) {
    return http.get<InterfaceInfoVO>('/interfaceInfo/get', {
      params: { id },
    });
  },
  getDocDetail(interfaceInfoId: number) {
    return http.get<InterfaceDocDetailVO>('/interfaceDoc/get', {
      params: { interfaceInfoId },
    });
  },
  /**
   * 聚合保存结构化接口文档
   * @param data 文档保存请求
   */
  saveDoc(data: InterfaceDocSaveRequest) {
    return http.post<boolean>('/interfaceDoc/save', data);
  },
  invoke(data: InvokeRequest) {
    return http.post<unknown>('/interfaceInfo/invoke', data);
  },
  /**
   * 新增接口信息
   * @param data 接口新增请求数据
   */
  add(data: InterfaceInfoAddRequest) {
    return http.post<number>('/interfaceInfo/add', data);
  },
  online(data: IdRequest) {
    return http.post<boolean>('/interfaceInfo/online', data);
  },
  offline(data: IdRequest) {
    return http.post<boolean>('/interfaceInfo/offline', data);
  },
  /**
   * 删除接口信息
   * @param data 接口删除请求数据，id 必填
   */
  delete(data: IdRequest) {
    return http.post<boolean>('/interfaceInfo/delete', data);
  },
  /**
   * 更新接口信息
   * @param data 接口更新请求数据，id 必填，其余字段可选
   */
  update(data: InterfaceInfoUpdateRequest) {
    return http.post<boolean>('/interfaceInfo/update', data);
  },
};
