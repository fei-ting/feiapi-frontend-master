import http from './http';
import type { InterfaceInfoVO } from '@/types/api';

export const analysisService = {
  topInvoke() {
    return http.get<Array<InterfaceInfoVO>>('/analysis/top/interface/invoke');
  },
};
