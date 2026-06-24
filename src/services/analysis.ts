import http from './http';
import type { InterfaceInfoVO, ResponseData } from '@/types/api';

export const analysisService = {
  topInvoke() {
    return http
      .get<ResponseData<Array<InterfaceInfoVO>>>('/analysis/top/interface/invoke')
      .then((response) => response.data);
  },
};
