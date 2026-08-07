import http from './http';
import type { IdRequest, PageResult } from '@/types/common';
import type {
  InterfaceInfoAddRequest,
  InterfaceInfoUpdateRequest,
  InterfaceInfoVO,
  InterfaceQuery,
  SdkMethodOption,
} from '@/types/interface';
import type { InterfaceDocDetailVO, InterfaceDocSaveRequest } from '@/features/interface-platform/documentation/types/interfaceDoc';
import type { InterfacePublishCheckVO } from '@/features/interface-platform/publishing/types/interfacePublish';
import type { InvokeRequest, InvokeResponse } from '@/types/invoke';

/** 发布接口包含最长 15 秒后端探测，预留响应传输和服务端处理时间。 */
const PUBLISH_REQUEST_TIMEOUT_MS = 20000;

export const interfaceService = {
  /** 查询管理员新增接口时可选择的已注册 SDK 方法。 */
  listSdkMethods() {
    return http.get<SdkMethodOption[]>('/interfaceInfo/sdk-method/list');
  },
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
  /**
   * 执行发布前只读检查
   * @param id 接口 ID
   */
  checkPublish(id: number) {
    return http.get<InterfacePublishCheckVO>('/interfaceInfo/publish/check', {
      params: { id },
    });
  },
  invoke(data: InvokeRequest) {
    return http.post<InvokeResponse>('/interfaceInfo/invoke', data);
  },
  /**
   * 新增接口信息
   * @param data 接口新增请求数据
   */
  add(data: InterfaceInfoAddRequest) {
    return http.post<number>('/interfaceInfo/add', data);
  },
  online(data: IdRequest) {
    return http.post<boolean>('/interfaceInfo/online', data, {
      timeout: PUBLISH_REQUEST_TIMEOUT_MS,
    });
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
