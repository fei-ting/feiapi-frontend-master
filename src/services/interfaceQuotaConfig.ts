import http from './http';
import type { InterfaceQuotaConfigUpdateRequest, InterfaceQuotaConfigVO } from '@/types/api';

export const interfaceQuotaConfigService = {
  /**
   * 查询全部接口配额类型配置
   */
  list() {
    return http.get<InterfaceQuotaConfigVO[]>('/interfaceQuotaConfig/list');
  },

  /**
   * 更新有限额度类型的初始额度
   * @param data 配额配置更新请求
   */
  update(data: InterfaceQuotaConfigUpdateRequest) {
    return http.post<boolean>('/interfaceQuotaConfig/update', data);
  },
};
