import type { AxiosResponse, RequestConfig } from '@@/plugin-request/request';

/**
 * 通用响应结构。
 */
interface ResponseStructure<T = unknown> {
  code?: number;
  data?: T;
  message?: string;
}

const rawRequestConfig = {
  baseURL: process.env.UMI_APP_API_BASE || '/api',
  withCredentials: true,
  responseInterceptors: [
    (response: AxiosResponse<ResponseStructure>) => {
      const responseData = response.data;
      if (responseData?.code !== 0) {
        throw new Error(responseData?.message || '请求失败');
      }
      return response;
    },
  ],
};

/**
 * 全局请求配置。
 */
export const requestConfig = rawRequestConfig as RequestConfig;
