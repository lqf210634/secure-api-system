import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';
import { getGlobalMessage, getGlobalNotification } from './globalMessage';
import { getToken, removeToken, setToken } from './storage';
import { SecurityUtils } from './encryption';

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
  showLoading?: boolean;
  encrypt?: boolean;
}

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config: any) => {
      // 添加请求ID用于追踪
      config.headers['X-Request-ID'] = SecurityUtils.generateUUID();
      
      // 添加时间戳防止缓存
      config.headers['X-Timestamp'] = Date.now().toString();

      // 添加认证token
      if (!config.skipAuth) {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // 添加设备信息
      config.headers['X-Device-Info'] = JSON.stringify({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
      });

      // 请求日志
      if (import.meta.env.DEV) {
        console.log('🚀 Request:', {
          url: config.url,
          method: config.method,
          headers: SecurityUtils.sanitizeObject(config.headers),
          data: SecurityUtils.sanitizeObject(config.data),
        });
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response;

      // 响应日志
      if (import.meta.env.DEV) {
        console.log('✅ Response:', {
          url: response.config.url,
          status: response.status,
          data: SecurityUtils.sanitizeObject(data),
        });
      }

      // 检查业务状态码
      if (data.code !== 200) {
        const error: ApiError = {
          code: data.code,
          message: data.message,
          timestamp: data.timestamp,
          traceId: data.traceId,
        };

        // 特殊错误码处理
        switch (data.code) {
          case 401:
            // 未授权，清除token并跳转登录
            removeToken();
            window.location.href = '/login';
            break;
          case 403:
            // 权限不足
            getGlobalNotification().error({
              message: '权限不足',
              description: data.message || '您没有权限执行此操作',
            });
            break;
          case 429:
            // 请求过于频繁
            getGlobalNotification().warning({
              message: '请求过于频繁',
              description: '请稍后再试',
            });
            break;
          default:
            // 其他业务错误
            if (!(response.config as RequestConfig).skipErrorHandler) {
              getGlobalMessage().error(data.message || '操作失败');
            }
        }

        return Promise.reject(error);
      }

      return response;
    },
    (error: AxiosError) => {
      console.error('❌ Response Error:', error);

      // 网络错误处理
      if (!error.response) {
        notification.error({
          message: '网络错误',
          description: '请检查网络连接',
        });
        return Promise.reject(error);
      }

      const { status, data } = error.response;
      const config = error.config as RequestConfig;

      // HTTP状态码错误处理
      switch (status) {
        case 400:
          if (!config?.skipErrorHandler) {
            message.error('请求参数错误');
          }
          break;
        case 401:
          removeToken();
          window.location.href = '/login';
          break;
        case 403:
          getGlobalNotification().error({
            message: '权限不足',
            description: '您没有权限访问此资源',
          });
          break;
        case 404:
          if (!config?.skipErrorHandler) {
            getGlobalMessage().error('请求的资源不存在');
          }
          break;
        case 500:
          getGlobalNotification().error({
            message: '服务器错误',
            description: '服务器内部错误，请稍后重试',
          });
          break;
        case 502:
        case 503:
        case 504:
          getGlobalNotification().error({
            message: '服务不可用',
            description: '服务暂时不可用，请稍后重试',
          });
          break;
        default:
          if (!config?.skipErrorHandler) {
            getGlobalMessage().error(`请求失败 (${status})`);
          }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// 创建请求实例
const request = createAxiosInstance();

// 请求方法封装
export class HttpClient {
  /**
   * GET请求
   */
  static async get<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await request.get(url, { params, ...config });
    return response.data;
  }

  /**
   * POST请求
   */
  static async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await request.post(url, data, config);
    return response.data;
  }

  /**
   * PUT请求
   */
  static async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await request.put(url, data, config);
    return response.data;
  }

  /**
   * DELETE请求
   */
  static async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await request.delete(url, config);
    return response.data;
  }

  /**
   * PATCH请求
   */
  static async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await request.patch(url, data, config);
    return response.data;
  }

  /**
   * 文件上传
   */
  static async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await request.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
      ...config,
    });

    return response.data;
  }

  /**
   * 文件下载
   */
  static async download(
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    const response = await request.get(url, {
      responseType: 'blob',
      ...config,
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 批量请求
   */
  static async batch<T = any>(
    requests: Array<() => Promise<ApiResponse<T>>>
  ): Promise<ApiResponse<T>[]> {
    try {
      const results = await Promise.allSettled(requests.map(req => req()));
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Batch request ${index} failed:`, result.reason);
          throw result.reason;
        }
      });
    } catch (error) {
      console.error('Batch requests failed:', error);
      throw error;
    }
  }

  /**
   * 重试请求
   */
  static async retry<T = any>(
    requestFn: () => Promise<ApiResponse<T>>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }

  /**
   * 取消请求
   */
  static createCancelToken() {
    return axios.CancelToken.source();
  }

  /**
   * 检查请求是否被取消
   */
  static isCancel(error: any): boolean {
    return axios.isCancel(error);
  }
}

// 刷新token
export const refreshToken = async (): Promise<string> => {
  try {
    const response = await HttpClient.post('/auth/refresh', {}, { skipAuth: true });
    const newToken = response.data.accessToken;
    setToken(newToken);
    return newToken;
  } catch (error) {
    removeToken();
    window.location.href = '/login';
    throw error;
  }
};

// 导出默认实例
export default request;
export { request };