import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginRequest, RegisterRequest, LoginResponse, UserInfo } from '@/types';
import { HttpClient } from '@/utils/request';
import { 
  setToken, 
  setRefreshToken, 
  setUserInfo, 
  removeToken, 
  removeRefreshToken, 
  removeUserInfo,
  setRememberMe,
  setLastLoginTime
} from '@/utils/storage';

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: undefined,
  accessToken: undefined,
  refreshToken: undefined,
  sessionId: undefined,
  loading: false,
  error: undefined,
};

// 异步actions

// 登录
export const login = createAsyncThunk(
  'auth/login',
  async (loginData: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await HttpClient.post<LoginResponse>('/auth/login', loginData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败');
    }
  }
);

// 注册
export const register = createAsyncThunk(
  'auth/register',
  async (registerData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await HttpClient.post<LoginResponse>('/auth/register', registerData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败');
    }
  }
);

// 刷新token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await HttpClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '刷新token失败');
    }
  }
);

// 登出
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await HttpClient.post('/auth/logout');
      return true;
    } catch (error: any) {
      // 即使登出接口失败，也要清理本地数据
      return true;
    }
  }
);

// 获取用户信息
export const getUserInfo = createAsyncThunk(
  'auth/getUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await HttpClient.get<UserInfo>('/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败');
    }
  }
);

// 更新密码
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData: { oldPassword: string; newPassword: string; confirmPassword: string }, { rejectWithValue }) => {
    try {
      await HttpClient.put('/auth/password', passwordData);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || '修改密码失败');
    }
  }
);

// 创建slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = undefined;
    },
    
    // 设置loading状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // 更新用户信息
    updateUserInfo: (state, action: PayloadAction<Partial<UserInfo>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        setUserInfo(state.user);
      }
    },
    
    // 清除认证状态
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = undefined;
      state.accessToken = undefined;
      state.refreshToken = undefined;
      state.sessionId = undefined;
      state.error = undefined;
      
      // 清理本地存储
      removeToken();
      removeRefreshToken();
      removeUserInfo();
    },
    
    // 从本地存储恢复认证状态
    restoreAuth: (state, action: PayloadAction<{ user: UserInfo; accessToken: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
  },
  extraReducers: (builder) => {
    // 登录
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.userInfo;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.sessionId = action.payload.sessionId;
        
        // 保存到本地存储
        const rememberMe = action.meta.arg.rememberMe || false;
        setToken(action.payload.accessToken, rememberMe);
        setRefreshToken(action.payload.refreshToken, rememberMe);
        setUserInfo(action.payload.userInfo);
        setRememberMe(rememberMe);
        setLastLoginTime(action.payload.loginTime);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // 注册
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.userInfo;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.sessionId = action.payload.sessionId;
        
        // 保存到本地存储
        setToken(action.payload.accessToken, false); // 注册后不记住登录状态
        setRefreshToken(action.payload.refreshToken, false);
        setUserInfo(action.payload.userInfo);
        setLastLoginTime(action.payload.loginTime);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 刷新token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        
        // 更新本地存储
        setToken(action.payload.accessToken, true);
        setRefreshToken(action.payload.refreshToken, true);
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // token刷新失败，清除认证状态
        state.isAuthenticated = false;
        state.user = undefined;
        state.accessToken = undefined;
        state.refreshToken = undefined;
        state.sessionId = undefined;
        
        removeToken();
        removeRefreshToken();
        removeUserInfo();
      });

    // 登出
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = undefined;
        state.accessToken = undefined;
        state.refreshToken = undefined;
        state.sessionId = undefined;
        state.error = undefined;
        
        // 清理本地存储
        removeToken();
        removeRefreshToken();
        removeUserInfo();
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        // 即使登出失败，也要清理本地状态
        state.isAuthenticated = false;
        state.user = undefined;
        state.accessToken = undefined;
        state.refreshToken = undefined;
        state.sessionId = undefined;
        
        removeToken();
        removeRefreshToken();
        removeUserInfo();
      });

    // 获取用户信息
    builder
      .addCase(getUserInfo.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        setUserInfo(action.payload);
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新密码
    builder
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const { 
  clearError, 
  setLoading, 
  updateUserInfo, 
  clearAuth, 
  restoreAuth 
} = authSlice.actions;

// 选择器
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// 导出reducer
export default authSlice.reducer;