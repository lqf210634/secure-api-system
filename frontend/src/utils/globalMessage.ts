import { App } from 'antd';

// 全局消息实例
let globalMessage: any = null;
let globalNotification: any = null;

/**
 * 设置全局消息实例
 * 这个函数应该在App组件中调用
 */
export const setGlobalMessageInstance = (messageInstance: any, notificationInstance: any) => {
  globalMessage = messageInstance;
  globalNotification = notificationInstance;
};

/**
 * 获取全局消息实例
 */
export const getGlobalMessage = () => {
  if (!globalMessage) {
    console.warn('Global message instance not initialized. Please ensure App component is properly set up.');
    // 返回一个空的实现作为fallback
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      loading: () => {},
    };
  }
  return globalMessage;
};

/**
 * 获取全局通知实例
 */
export const getGlobalNotification = () => {
  if (!globalNotification) {
    console.warn('Global notification instance not initialized. Please ensure App component is properly set up.');
    // 返回一个空的实现作为fallback
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      open: () => {},
    };
  }
  return globalNotification;
};