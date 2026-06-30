import http from './http';
import type { InterfaceQuotaConfigUpdateRequest, InterfaceQuotaConfigVO, ResponseData } from '@/types/api';

export const interfaceQuotaConfigService = {
  /**
   * 查询全部接口配额类型配置
   */
  list() {
    return http
      .get<ResponseData<InterfaceQuotaConfigVO[]>>('/interfaceQuotaConfig/list')
      .then((response) => response.data);
  },

  /**
   * 更新有限额度类型的初始额度
   * @param data 配额配置更新请求
   */
  update(data: InterfaceQuotaConfigUpdateRequest) {
    return http.post<ResponseData<boolean>>('/interfaceQuotaConfig/update', data).then((response) => response.data);
  },
};
