import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { HttpClient } from '@/utils/request';
import { ApiResponse, ApiError } from '@/types';

/**
 * API请求状态
 */
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * API请求配置
 */
interface ApiConfig {
  immediate?: boolean; // 是否立即执行
  onSuccess?: (data: any) => void; // 成功回调
  onError?: (error: ApiError) => void; // 错误回调
  showSuccessMessage?: boolean; // 是否显示成功消息
  showErrorMessage?: boolean; // 是否显示错误消息
  successMessage?: string; // 自定义成功消息
}

/**
 * 通用API请求Hook
 */
export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  config: ApiConfig = {}
) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    showSuccessMessage = false,
    showErrorMessage = true,
    successMessage = '操作成功'
  } = config;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const cancelTokenRef = useRef<AbortController | null>(null);

  // 执行API请求
  const execute = useCallback(async (...args: any[]) => {
    try {
      // 取消之前的请求
      if (cancelTokenRef.current) {
        cancelTokenRef.current.abort();
      }

      // 创建新的取消令牌
      cancelTokenRef.current = new AbortController();

      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await apiFunction(...args);

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null
        });

        if (showSuccessMessage) {
          message.success(successMessage);
        }

        onSuccess?.(response.data);
        return response.data;
      } else {
        const error: ApiError = {
          code: response.code || 'UNKNOWN_ERROR',
          message: response.message || '请求失败',
          details: response.data
        };

        setState({
          data: null,
          loading: false,
          error
        });

        if (showErrorMessage) {
          message.error(error.message);
        }

        onError?.(error);
        throw error;
      }
    } catch (err: any) {
      const error: ApiError = {
        code: err.code || 'NETWORK_ERROR',
        message: err.message || '网络错误',
        details: err
      };

      setState({
        data: null,
        loading: false,
        error
      });

      if (showErrorMessage && !err.name?.includes('AbortError')) {
        message.error(error.message);
      }

      onError?.(error);
      throw error;
    }
  }, [apiFunction, onSuccess, onError, showSuccessMessage, showErrorMessage, successMessage]);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  // 取消请求
  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort();
      cancelTokenRef.current = null;
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // 立即执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
    
    return () => {
      cancel();
    };
  }, [immediate]);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute,
    reset,
    cancel
  };
};

/**
 * 分页数据Hook
 */
export const usePagination = <T = any>(
  apiFunction: (params: any) => Promise<ApiResponse<{ list: T[]; total: number }>>,
  initialParams: any = {}
) => {
  const [params, setParams] = useState({
    page: 1,
    size: 10,
    ...initialParams
  });

  const { data, loading, error, execute } = useApi(apiFunction);

  // 加载数据
  const loadData = useCallback((newParams?: any) => {
    const finalParams = { ...params, ...newParams };
    setParams(finalParams);
    return execute(finalParams);
  }, [params, execute]);

  // 刷新当前页
  const refresh = useCallback(() => {
    return execute(params);
  }, [params, execute]);

  // 重置到第一页
  const reset = useCallback((newParams?: any) => {
    const finalParams = { page: 1, size: 10, ...initialParams, ...newParams };
    setParams(finalParams);
    return execute(finalParams);
  }, [initialParams, execute]);

  // 改变页码
  const changePage = useCallback((page: number, size?: number) => {
    const newParams = { ...params, page, ...(size && { size }) };
    setParams(newParams);
    return execute(newParams);
  }, [params, execute]);

  // 改变页大小
  const changePageSize = useCallback((size: number) => {
    const newParams = { ...params, page: 1, size };
    setParams(newParams);
    return execute(newParams);
  }, [params, execute]);

  return {
    data: data?.list || [],
    total: data?.total || 0,
    loading,
    error,
    params,
    loadData,
    refresh,
    reset,
    changePage,
    changePageSize
  };
};

/**
 * 表单提交Hook
 */
export const useFormSubmit = <T = any>(
  apiFunction: (data: any) => Promise<ApiResponse<T>>,
  config: ApiConfig = {}
) => {
  const { execute, loading, error } = useApi(apiFunction, {
    showSuccessMessage: true,
    showErrorMessage: true,
    ...config
  });

  const submit = useCallback(async (formData: any) => {
    try {
      const result = await execute(formData);
      return result;
    } catch (err) {
      throw err;
    }
  }, [execute]);

  return {
    submit,
    loading,
    error
  };
};

/**
 * 文件上传Hook
 */
export const useUpload = (config: ApiConfig = {}) => {
  const { execute, loading, error } = useApi(HttpClient.upload, {
    showSuccessMessage: true,
    successMessage: '上传成功',
    ...config
  });

  const upload = useCallback(async (file: File, path?: string) => {
    try {
      const result = await execute(file, path);
      return result;
    } catch (err) {
      throw err;
    }
  }, [execute]);

  return {
    upload,
    loading,
    error
  };
};

/**
 * 批量操作Hook
 */
export const useBatchOperation = <T = any>(
  apiFunction: (ids: string[]) => Promise<ApiResponse<T>>,
  config: ApiConfig = {}
) => {
  const { execute, loading, error } = useApi(apiFunction, {
    showSuccessMessage: true,
    showErrorMessage: true,
    ...config
  });

  const batchExecute = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) {
      message.warning('请选择要操作的项目');
      return;
    }

    try {
      const result = await execute(ids);
      return result;
    } catch (err) {
      throw err;
    }
  }, [execute]);

  return {
    execute: batchExecute,
    loading,
    error
  };
};

/**
 * 轮询Hook
 */
export const usePolling = <T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  interval: number = 5000,
  config: ApiConfig = {}
) => {
  const { data, loading, error, execute } = useApi(apiFunction, {
    showErrorMessage: false,
    ...config
  });

  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 开始轮询
  const startPolling = useCallback((...args: any[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    execute(...args); // 立即执行一次

    intervalRef.current = setInterval(() => {
      execute(...args);
    }, interval);
  }, [execute, interval]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    execute
  };
};

export default useApi;