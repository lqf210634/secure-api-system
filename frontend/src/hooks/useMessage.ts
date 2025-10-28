import { App } from 'antd';

/**
 * 使用Ant Design App组件提供的message和notification实例
 * 替代静态方法以支持动态主题
 */
export const useMessage = () => {
  const { message, notification } = App.useApp();
  
  return {
    message,
    notification
  };
};

export default useMessage;