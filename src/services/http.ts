import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { ResponseData } from '@/types/api';

const http = axios.create({
  // 从环境变量读取 API 基础地址，开发环境使用完整地址，生产环境使用相对路径
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:9527/api',
  timeout: 15000,
  withCredentials: true,
});

http.interceptors.response.use(
  (response: AxiosResponse<ResponseData<unknown>>) => {
    // 检查业务错误码，code !== 0 表示业务失败
    const { data } = response;
    if (data.code !== 0) {
      const err = new Error(data.message || '请求失败') as Error & { code: number };
      err.code = data.code;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export default http;
