import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { setGlobalMessageInstance } from '@/utils/globalMessage';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { MainLayout } from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import SecurityPage from '@/pages/Security';
import { useAuth } from '@/hooks';
import '@/styles/global.css';

// 设置dayjs中文
dayjs.locale('zh-cn');

// 应用路由组件
const AppRoutes: React.FC = () => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const { message: messageApi, notification: notificationApi } = AntApp.useApp();

  useEffect(() => {
    // 设置全局消息实例
    setGlobalMessageInstance(messageApi, notificationApi);
  }, [messageApi, notificationApi]);

  useEffect(() => {
    // 应用启动时恢复认证状态
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* 受保护的路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* 仪表板 */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* 用户管理 */}
        <Route path="users" element={
          <ProtectedRoute requiredPermissions={['user:read']}>
            <div>用户管理页面 - 开发中</div>
          </ProtectedRoute>
        } />
        
        {/* API管理 */}
        <Route path="apis" element={
          <ProtectedRoute requiredPermissions={['api:read']}>
            <div>API管理页面 - 开发中</div>
          </ProtectedRoute>
        } />
        
        {/* 安全中心 */}
        <Route path="security" element={
          <ProtectedRoute requiredPermissions={['security:read']}>
            <SecurityPage />
          </ProtectedRoute>
        } />
        
        {/* 系统监控 */}
        <Route path="monitoring" element={
          <ProtectedRoute requireAdmin>
            <div>系统监控页面 - 开发中</div>
          </ProtectedRoute>
        } />
        
        {/* 系统设置 */}
        <Route path="settings" element={
          <ProtectedRoute requireAdmin>
            <div>系统设置页面 - 开发中</div>
          </ProtectedRoute>
        } />
        
        {/* 个人中心 */}
        <Route path="profile" element={
          <div>个人中心页面 - 开发中</div>
        } />
      </Route>
      
      {/* 错误页面 */}
      <Route path="/403" element={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <h1>403 - 访问被拒绝</h1>
          <p>您没有权限访问此页面</p>
        </div>
      } />
      
      <Route path="/404" element={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <h1>404 - 页面未找到</h1>
          <p>您访问的页面不存在</p>
        </div>
      } />
      
      {/* 默认重定向到404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

// 主应用组件
const App: React.FC = () => {
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          wireframe: false,
        },
        components: {
          Layout: {
            headerBg: '#fff',
            siderBg: '#fff',
            bodyBg: '#f5f5f5',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#e6f7ff',
            itemSelectedColor: '#1890ff',
            itemHoverBg: '#f5f5f5',
          },
          Card: {
            borderRadiusLG: 8,
            paddingLG: 24,
          },
          Button: {
            borderRadius: 6,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 40,
          },
          Table: {
            borderRadius: 8,
            headerBg: '#fafafa',
          },
        },
      }}
    >
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;