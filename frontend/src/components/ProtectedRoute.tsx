import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '@/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAdmin = false,
  requireSuperAdmin = false,
  fallback
}) => {
  const { 
    isAuthenticated, 
    loading, 
    hasPermission, 
    hasRole, 
    isAdmin, 
    isSuperAdmin 
  } = useAuth();
  const location = useLocation();

  // 显示加载状态
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 检查超级管理员权限
  if (requireSuperAdmin && !isSuperAdmin()) {
    return fallback || (
      <Navigate 
        to="/403" 
        state={{ 
          message: '需要超级管理员权限',
          from: location 
        }} 
        replace 
      />
    );
  }

  // 检查管理员权限
  if (requireAdmin && !isAdmin()) {
    return fallback || (
      <Navigate 
        to="/403" 
        state={{ 
          message: '需要管理员权限',
          from: location 
        }} 
        replace 
      />
    );
  }

  // 检查角色权限
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return fallback || (
        <Navigate 
          to="/403" 
          state={{ 
            message: `需要以下角色之一: ${requiredRoles.join(', ')}`,
            from: location 
          }} 
          replace 
        />
      );
    }
  }

  // 检查权限
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    if (!hasRequiredPermission) {
      return fallback || (
        <Navigate 
          to="/403" 
          state={{ 
            message: `缺少必要权限: ${requiredPermissions.join(', ')}`,
            from: location 
          }} 
          replace 
        />
      );
    }
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;