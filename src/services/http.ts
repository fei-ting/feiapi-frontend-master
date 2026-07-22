import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ResponseData } from '@/types/common';

/**
 * HTTP 客户端模块
 *
 * 统一拦截业务错误码，成功时直接解包返回领域对象 T，
 * 使所有服务返回 Promise<T>，页面不再感知 Axios 和后端响应包装结构。
 */

const CSRF_ERROR_MESSAGE = '安全校验失败，请刷新页面后重试';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF 初始化专用客户端。
 *
 * 不安装业务拦截器，避免初始化请求再次触发 CSRF 门禁或业务响应解包。
 */
const csrfHttp = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
});

/**
 * 主业务客户端。
 *
 * 仅通过当前 Origin 的相对路径访问后端，并由 Axios 自动将 CSRF Cookie
 * 写入非安全请求 Header。
 */
const rawHttp = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

let csrfInitializationPromise: Promise<void> | null = null;

/**
 * 判断请求是否属于需要 CSRF 保护的写操作。
 *
 * @param method Axios 请求方法
 * @returns 是否为非安全 HTTP 方法
 */
function isUnsafeMethod(method: string | undefined): boolean {
  return UNSAFE_METHODS.has((method || '').toUpperCase());
}

/**
 * 判断浏览器是否已经持有非空 CSRF Cookie。
 *
 * @returns 是否存在非空 `XSRF-TOKEN` Cookie
 */
function hasCsrfCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie.split(';').some((cookie) => {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 0) {
      return false;
    }

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    return name === 'XSRF-TOKEN' && value.length > 0;
  });
}

/**
 * 创建统一的 CSRF 安全异常。
 *
 * @returns 带业务码的安全异常
 */
function createCsrfError(): Error & { code: number } {
  const error = new Error(CSRF_ERROR_MESSAGE) as Error & { code: number };
  error.code = 40300;
  return error;
}

/**
 * 合并并发的 CSRF Cookie 初始化请求。
 *
 * @returns 初始化完成 Promise
 */
function ensureCsrfToken(): Promise<void> {
  if (!csrfInitializationPromise) {
    csrfInitializationPromise = csrfHttp.get('/csrf')
      .then(() => undefined)
      .catch(() => {
        throw createCsrfError();
      })
      .finally(() => {
        csrfInitializationPromise = null;
      });
  }

  return csrfInitializationPromise;
}

rawHttp.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (isUnsafeMethod(config.method) && !hasCsrfCookie()) {
    await ensureCsrfToken();
  }
  return config;
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
  (error: unknown) => {
    const response = (error as { response?: { status?: number; data?: { code?: number } } })?.response;
    if (response?.status === 403 && response.data?.code === 40300) {
      return Promise.reject(createCsrfError());
    }
    return Promise.reject(error);
  },
);

/**
 * 类型安全的请求接口。
 * 拦截器已在运行时解包成功响应，此处声明返回 Promise<T>。
 */
interface TypedAxiosInstance {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const http = rawHttp as unknown as TypedAxiosInstance;

export default http;
