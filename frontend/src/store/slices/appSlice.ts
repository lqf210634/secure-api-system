import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '@/types';
import { setTheme, setLanguage } from '@/utils/storage';

// 扩展应用状态接口
interface ExtendedAppState extends AppState {
  sidebarCollapsed: boolean;
  breadcrumbs: Array<{ title: string; path?: string }>;
  notifications: Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  onlineStatus: boolean;
  systemInfo: {
    version: string;
    buildTime: string;
    environment: string;
  };
}

// 初始状态
const initialState: ExtendedAppState = {
  loading: false,
  error: undefined,
  theme: 'light',
  language: 'zh-CN',
  sidebarCollapsed: false,
  breadcrumbs: [],
  notifications: [],
  onlineStatus: navigator.onLine,
  systemInfo: {
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildTime: import.meta.env.VITE_APP_BUILD_TIME || new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
  },
};

// 创建slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // 设置loading状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // 设置错误信息
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },

    // 清除错误
    clearError: (state) => {
      state.error = undefined;
    },

    // 切换主题
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      setTheme(state.theme);
    },

    // 设置主题
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      setTheme(state.theme);
    },

    // 设置语言
    setLanguageMode: (state, action: PayloadAction<'zh-CN' | 'en-US'>) => {
      state.language = action.payload;
      setLanguage(state.language);
    },

    // 切换侧边栏折叠状态
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // 设置侧边栏折叠状态
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // 设置面包屑
    setBreadcrumbs: (state, action: PayloadAction<Array<{ title: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },

    // 添加面包屑
    addBreadcrumb: (state, action: PayloadAction<{ title: string; path?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },

    // 清除面包屑
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // 添加通知
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'info' | 'warning' | 'error';
      title: string;
      message: string;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // 限制通知数量
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },

    // 标记通知为已读
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },

    // 标记所有通知为已读
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },

    // 删除通知
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    // 清除所有通知
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // 设置在线状态
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.onlineStatus = action.payload;
    },

    // 更新系统信息
    updateSystemInfo: (state, action: PayloadAction<Partial<ExtendedAppState['systemInfo']>>) => {
      state.systemInfo = { ...state.systemInfo, ...action.payload };
    },

    // 重置应用状态
    resetAppState: (state) => {
      state.loading = false;
      state.error = undefined;
      state.breadcrumbs = [];
      state.notifications = [];
    },
  },
});

// 导出actions
export const {
  setLoading,
  setError,
  clearError,
  toggleTheme,
  setThemeMode,
  setLanguageMode,
  toggleSidebar,
  setSidebarCollapsed,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  setOnlineStatus,
  updateSystemInfo,
  resetAppState,
} = appSlice.actions;

// 选择器
export const selectApp = (state: { app: ExtendedAppState }) => state.app;
export const selectLoading = (state: { app: ExtendedAppState }) => state.app.loading;
export const selectError = (state: { app: ExtendedAppState }) => state.app.error;
export const selectTheme = (state: { app: ExtendedAppState }) => state.app.theme;
export const selectLanguage = (state: { app: ExtendedAppState }) => state.app.language;
export const selectSidebarCollapsed = (state: { app: ExtendedAppState }) => state.app.sidebarCollapsed;
export const selectBreadcrumbs = (state: { app: ExtendedAppState }) => state.app.breadcrumbs;
export const selectNotifications = (state: { app: ExtendedAppState }) => state.app.notifications;
export const selectUnreadNotifications = (state: { app: ExtendedAppState }) => 
  state.app.notifications.filter(n => !n.read);
export const selectOnlineStatus = (state: { app: ExtendedAppState }) => state.app.onlineStatus;
export const selectSystemInfo = (state: { app: ExtendedAppState }) => state.app.systemInfo;

// 导出reducer
export default appSlice.reducer;