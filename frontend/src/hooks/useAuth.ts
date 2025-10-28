import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  selectAuth, 
  selectIsAuthenticated, 
  selectUser, 
  selectAuthLoading, 
  selectAuthError,
  login,
  register,
  logout,
  refreshToken,
  getUserInfo,
  updatePassword,
  clearError,
  restoreAuth,
  clearAuth
} from '@/store/slices/authSlice';
import { LoginRequest, RegisterRequest, UserInfo } from '@/types';
import { getToken, getUserInfo as getStoredUserInfo, removeToken } from '@/utils/storage';
import { AppDispatch } from '@/store';

/**
 * 认证相关的自定义Hook
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const auth = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // 登录
  const handleLogin = useCallback(async (loginData: LoginRequest) => {
    try {
      const result = await dispatch(login(loginData)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // 注册
  const handleRegister = useCallback(async (registerData: RegisterRequest) => {
    try {
      const result = await dispatch(register(registerData)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // 登出
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login', { replace: true });
    } catch (error) {
      // 即使登出失败，也要跳转到登录页
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  // 刷新token
  const handleRefreshToken = useCallback(async () => {
    try {
      const result = await dispatch(refreshToken()).unwrap();
      return result;
    } catch (error) {
      // token刷新失败，跳转到登录页
      navigate('/login', { replace: true });
      throw error;
    }
  }, [dispatch, navigate]);

  // 获取用户信息
  const handleGetUserInfo = useCallback(async () => {
    try {
      const result = await dispatch(getUserInfo()).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // 更新密码
  const handleUpdatePassword = useCallback(async (passwordData: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const result = await dispatch(updatePassword(passwordData)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // 清除错误
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 检查认证状态
  const checkAuthStatus = useCallback(() => {
    const token = getToken();
    const storedUserInfo = getStoredUserInfo();
    
    if (token && storedUserInfo) {
      // 从本地存储恢复认证状态
      dispatch(restoreAuth({ user: storedUserInfo, accessToken: token }));
      return true;
    } else {
      // 清除认证状态
      dispatch(clearAuth());
      return false;
    }
  }, [dispatch]);

  // 检查用户权限
  const hasPermission = useCallback((permission: string | string[]) => {
    if (!user || !user.roles) return false;
    
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some(p => user.roles.includes(p));
  }, [user]);

  // 检查用户角色
  const hasRole = useCallback((role: string | string[]) => {
    if (!user || !user.roles) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.roles.includes(r));
  }, [user]);

  // 检查是否为管理员
  const isAdmin = useCallback(() => {
    return hasRole(['ADMIN', 'SUPER_ADMIN']);
  }, [hasRole]);

  // 检查是否为超级管理员
  const isSuperAdmin = useCallback(() => {
    return hasRole('SUPER_ADMIN');
  }, [hasRole]);

  // 获取用户显示名称
  const getDisplayName = useCallback(() => {
    if (!user) return '';
    return user.nickname || user.username || user.email || '';
  }, [user]);

  // 检查账户是否可用
  const isAccountAvailable = useCallback(() => {
    if (!user) return false;
    return user.status === 'ACTIVE' && !user.accountLockTime;
  }, [user]);

  // 初始化认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      checkAuthStatus();
    }
  }, [isAuthenticated, checkAuthStatus]);

  // 监听token过期
  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout;

    if (isAuthenticated) {
      // 每5分钟检查一次token状态
      tokenCheckInterval = setInterval(() => {
        const token = getToken();
        if (!token) {
          dispatch(clearAuth());
          navigate('/login', { replace: true });
        }
      }, 5 * 60 * 1000);
    }

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [isAuthenticated, dispatch, navigate]);

  return {
    // 状态
    auth,
    isAuthenticated,
    user,
    loading,
    error,
    
    // 方法
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    getUserInfo: handleGetUserInfo,
    updatePassword: handleUpdatePassword,
    clearError: handleClearError,
    checkAuthStatus,
    
    // 权限检查
    hasPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    
    // 工具方法
    getDisplayName,
    isAccountAvailable,
  };
};

/**
 * 权限检查Hook
 */
export const usePermission = (permission: string | string[]) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * 角色检查Hook
 */
export const useRole = (role: string | string[]) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

/**
 * 管理员检查Hook
 */
export const useAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin();
};

/**
 * 路由守卫Hook
 */
export const useAuthGuard = (requiredRoles?: string[]) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      if (requiredRoles && requiredRoles.length > 0) {
        if (!hasRole(requiredRoles)) {
          navigate('/403', { replace: true });
          return;
        }
      }
    }
  }, [isAuthenticated, hasRole, loading, navigate, requiredRoles]);

  return { isAuthenticated, loading };
};

export default useAuth;