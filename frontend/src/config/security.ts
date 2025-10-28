/**
 * 安全配置文件
 * 集中管理前端安全相关的配置
 */

// 密码策略配置
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*(),.?":{}|<>',
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
} as const;

// 用户名策略配置
export const USERNAME_POLICY = {
  minLength: 3,
  maxLength: 50,
  allowedChars: /^[a-zA-Z0-9_]+$/,
  reservedNames: [
    'admin', 'administrator', 'root', 'system', 'api', 'www',
    'mail', 'email', 'support', 'help', 'info', 'service',
    'test', 'demo', 'guest', 'user', 'null', 'undefined'
  ]
} as const;

// 邮箱策略配置
export const EMAIL_POLICY = {
  maxLength: 100,
  allowedDomains: [], // 空数组表示允许所有域名
  blockedDomains: [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com'
  ]
} as const;

// 手机号策略配置
export const PHONE_POLICY = {
  pattern: /^1[3-9]\d{9}$/,
  allowedCountryCodes: ['+86'],
  maxLength: 11
} as const;

// XSS防护配置
export const XSS_PROTECTION = {
  enabled: true,
  escapeHtml: true,
  stripTags: false,
  allowedTags: [],
  allowedAttributes: {}
} as const;

// CSRF防护配置
export const CSRF_PROTECTION = {
  enabled: true,
  tokenName: 'X-CSRF-Token',
  cookieName: 'csrf-token',
  headerName: 'X-Requested-With'
} as const;

// 速率限制配置
export const RATE_LIMITING = {
  enabled: true,
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15分钟
  skipSuccessfulRequests: false,
  skipFailedRequests: false
} as const;

// 内容安全策略配置
export const CSP_CONFIG = {
  enabled: true,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }
} as const;

// 会话安全配置
export const SESSION_SECURITY = {
  tokenExpiry: 24 * 60 * 60 * 1000, // 24小时
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7天
  maxConcurrentSessions: 5,
  sessionTimeout: 30 * 60 * 1000, // 30分钟无活动超时
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000 // 30天
} as const;

// 文件上传安全配置
export const FILE_UPLOAD_SECURITY = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json'
  ],
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs',
    '.js', '.jar', '.php', '.asp', '.aspx', '.jsp'
  ],
  scanForMalware: true
} as const;

// 日志安全配置
export const LOGGING_SECURITY = {
  logLevel: 'info',
  logSensitiveData: false,
  maxLogSize: 100 * 1024 * 1024, // 100MB
  logRetentionDays: 30,
  auditEvents: [
    'login',
    'logout',
    'register',
    'password_change',
    'profile_update',
    'permission_change',
    'file_upload',
    'api_access'
  ]
} as const;

// 加密配置
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
  iterations: 100000
} as const;

// 安全头配置
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
} as const;

// 开发环境安全配置
export const DEV_SECURITY = {
  enableMockAuth: process.env.NODE_ENV === 'development',
  disableCSP: process.env.NODE_ENV === 'development',
  allowInsecureConnections: process.env.NODE_ENV === 'development',
  debugMode: process.env.NODE_ENV === 'development'
} as const;

// 安全事件类型
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access'
}

// 安全级别
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 导出所有配置
export const SECURITY_CONFIG = {
  PASSWORD_POLICY,
  USERNAME_POLICY,
  EMAIL_POLICY,
  PHONE_POLICY,
  XSS_PROTECTION,
  CSRF_PROTECTION,
  RATE_LIMITING,
  CSP_CONFIG,
  SESSION_SECURITY,
  FILE_UPLOAD_SECURITY,
  LOGGING_SECURITY,
  ENCRYPTION_CONFIG,
  SECURITY_HEADERS,
  DEV_SECURITY
} as const;

export default SECURITY_CONFIG;