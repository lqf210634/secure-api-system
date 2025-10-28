// 用户相关类型
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatarUrl?: string;
  status: UserStatus;
  roles: string[];
  lastLoginTime?: string;
  lastLoginIp?: string;
  loginFailureCount: number;
  accountLockTime?: string;
  createTime: string;
  updateTime: string;
  displayName: string;
  accountAvailable: boolean;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING'
}

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: string;
  clientType?: string;
  captcha?: string;
  captchaToken?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  nickname?: string;
  emailVerifyCode?: string;
  phoneVerifyCode?: string;
  captcha?: string;
  captchaToken?: string;
  agreeToTerms: boolean;
  inviteCode?: string;
  deviceInfo?: string;
  clientType?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  sessionId: string;
  loginTime: string;
  loginIp: string;
  deviceInfo?: string;
  firstLogin: boolean;
  userInfo: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatarUrl?: string;
  status: UserStatus;
  roles: string[];
  lastLoginTime?: string;
  createTime: string;
  displayName: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: string;
  traceId?: string;
  pageInfo?: PageInfo;
}

export interface PageInfo {
  current: number;
  size: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 分页请求类型
export interface PageRequest {
  current?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 错误类型
export interface ApiError {
  code: number;
  message: string;
  details?: string;
  timestamp: string;
  traceId?: string;
}

// 表单验证类型
export interface ValidationError {
  field: string;
  message: string;
}

// 应用状态类型
export interface AppState {
  loading: boolean;
  error?: string;
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
}

// 认证状态类型
export interface AuthState {
  isAuthenticated: boolean;
  user?: UserInfo;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  loading: boolean;
  error?: string;
}

// 路由类型
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  requireAuth?: boolean;
  roles?: string[];
  title?: string;
  icon?: string;
  hidden?: boolean;
  children?: RouteConfig[];
}

// 菜单类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
  hidden?: boolean;
}

// 设备信息类型
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
}

// 加密相关类型
export interface EncryptionConfig {
  rsaPublicKey: string;
  aesKeySize: number;
  encryptionMode: 'HYBRID' | 'AES_ONLY' | 'RSA_ONLY';
}

// 文件上传类型
export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  url?: string;
  thumbUrl?: string;
  size?: number;
  type?: string;
  percent?: number;
  response?: any;
  error?: any;
}

// 通知类型
export interface NotificationConfig {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

// 表格列配置类型
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: string; value: any }>;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
}

// 搜索表单类型
export interface SearchForm {
  keyword?: string;
  status?: UserStatus;
  role?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

// 统计数据类型
export interface Statistics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  lockedUsers: number;
  onlineUsers: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  sessionId?: string;
}

// 主题配置类型
export interface ThemeConfig {
  primaryColor: string;
  borderRadius: number;
  fontSize: number;
  colorBgBase: string;
  colorTextBase: string;
}

// 国际化类型
export interface I18nConfig {
  locale: string;
  messages: Record<string, string>;
  fallbackLocale: string;
}