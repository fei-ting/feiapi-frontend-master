import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ResponseData } from '@/types/api';

/**
 * HTTP 客户端模块
 *
 * 统一拦截业务错误码，成功时直接解包返回领域对象 T，
 * 使所有服务返回 Promise<T>，页面不再感知 Axios 和后端响应包装结构。
 */

const rawHttp = axios.create({
  // 从环境变量读取 API 基础地址，开发环境使用完整地址，生产环境使用相对路径
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:9527/api',
  timeout: 15000,
  withCredentials: true,
});

rawHttp.interceptors.response.use(
  (response: AxiosResponse<ResponseData<unknown>>) => {
    // 检查业务错误码，code !== 0 表示业务失败
    const { data } = response;
    if (data.code !== 0) {
      const err = new Error(data.message || '请求失败') as Error & { code: number };
      err.code = data.code;
      return Promise.reject(err);
    }
    // 统一解包成功响应，直接返回 data 字段
    // 运行时返回 T，类型声明由 TypedAxiosInstance 保证
    return data.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  (error) => Promise.reject(error),
);

/**
 * 类型安全的请求接口。
 * 拦截器已在运行时解包成功响应，此处声明返回 Promise<T>。
 */
interface TypedAxiosInstance {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const http = rawHttp as unknown as TypedAxiosInstance;

export default http;
