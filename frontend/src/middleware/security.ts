/**
 * 安全中间件
 * 提供全局安全防护功能
 */

import { message, notification } from 'antd';
import { preventClickjacking, isSafeUrl, escapeHtml } from '@/utils/security';

/**
 * 安全配置接口
 */
interface SecurityConfig {
  enableClickjackingProtection: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  blockedDomains: string[];
  allowedOrigins: string[];
}

/**
 * 默认安全配置
 */
const defaultSecurityConfig: SecurityConfig = {
  enableClickjackingProtection: true,
  enableXSSProtection: true,
  enableCSRFProtection: true,
  enableRateLimiting: true,
  maxRequestsPerMinute: 60,
  blockedDomains: [
    'malicious-site.com',
    'phishing-site.com'
  ],
  allowedOrigins: [
    'localhost:3000',
    'localhost:8080',
    '127.0.0.1:3000',
    '127.0.0.1:8080'
  ]
};

/**
 * 请求计数器（用于速率限制）
 */
class RequestCounter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1分钟

  /**
   * 检查是否超过速率限制
   */
  isRateLimited(identifier: string, maxRequests: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // 清理过期的请求记录
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= maxRequests) {
      return true;
    }
    
    // 记录新请求
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return false;
  }

  /**
   * 清理过期记录
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

/**
 * 安全中间件类
 */
export class SecurityMiddleware {
  private config: SecurityConfig;
  private requestCounter: RequestCounter;
  private csrfToken: string | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config };
    this.requestCounter = new RequestCounter();
    this.init();
  }

  /**
   * 初始化安全中间件
   */
  private init(): void {
    // 防止点击劫持
    if (this.config.enableClickjackingProtection) {
      preventClickjacking();
    }

    // 设置安全头
    this.setSecurityHeaders();

    // 监听页面可见性变化
    this.setupVisibilityChangeHandler();

    // 定期清理请求计数器
    setInterval(() => {
      this.requestCounter.cleanup();
    }, 60000);

    // 监听页面卸载事件
    this.setupUnloadHandler();
  }

  /**
   * 设置安全头
   */
  private setSecurityHeaders(): void {
    // 设置CSP（内容安全策略）
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);

    // 设置其他安全头
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityHeaders.forEach(header => {
      const metaElement = document.createElement('meta');
      metaElement.httpEquiv = header.name;
      metaElement.content = header.content;
      document.head.appendChild(metaElement);
    });
  }

  /**
   * 设置页面可见性变化处理器
   */
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时的安全处理
        this.onPageHidden();
      } else {
        // 页面显示时的安全检查
        this.onPageVisible();
      }
    });
  }

  /**
   * 设置页面卸载处理器
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      // 清理敏感数据
      this.clearSensitiveData();
    });
  }

  /**
   * 页面隐藏时的处理
   */
  private onPageHidden(): void {
    // 可以在这里实现自动锁屏等功能
    console.log('Page hidden - security check');
  }

  /**
   * 页面显示时的处理
   */
  private onPageVisible(): void {
    // 检查是否需要重新认证
    console.log('Page visible - security check');
  }

  /**
   * 清理敏感数据
   */
  private clearSensitiveData(): void {
    // 清理内存中的敏感数据
    this.csrfToken = null;
  }

  /**
   * 验证请求URL
   */
  validateUrl(url: string): boolean {
    if (!isSafeUrl(url)) {
      notification.error({
        message: '安全警告',
        description: '检测到不安全的URL，请求已被阻止'
      });
      return false;
    }

    // 检查是否在黑名单中
    const hostname = new URL(url).hostname;
    if (this.config.blockedDomains.includes(hostname)) {
      notification.error({
        message: '安全警告',
        description: '该域名已被列入黑名单，请求已被阻止'
      });
      return false;
    }

    return true;
  }

  /**
   * 速率限制检查
   */
  checkRateLimit(identifier: string = 'default'): boolean {
    if (!this.config.enableRateLimiting) {
      return true;
    }

    if (this.requestCounter.isRateLimited(identifier, this.config.maxRequestsPerMinute)) {
      notification.warning({
        message: '请求过于频繁',
        description: '您的请求过于频繁，请稍后再试'
      });
      return false;
    }

    return true;
  }

  /**
   * XSS防护
   */
  sanitizeInput(input: string): string {
    if (!this.config.enableXSSProtection) {
      return input;
    }

    return escapeHtml(input);
  }

  /**
   * 生成CSRF令牌
   */
  generateCSRFToken(): string {
    if (!this.config.enableCSRFProtection) {
      return '';
    }

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    this.csrfToken = token;
    return token;
  }

  /**
   * 验证CSRF令牌
   */
  validateCSRFToken(token: string): boolean {
    if (!this.config.enableCSRFProtection) {
      return true;
    }

    return this.csrfToken === token;
  }

  /**
   * 检查来源域名
   */
  validateOrigin(origin: string): boolean {
    const hostname = new URL(origin).hostname;
    return this.config.allowedOrigins.some(allowed => 
      hostname === allowed || hostname.endsWith('.' + allowed)
    );
  }

  /**
   * 安全日志记录
   */
  logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 在开发环境下输出到控制台
    if (import.meta.env.DEV) {
      console.warn('🔒 Security Event:', logEntry);
    }

    // 在生产环境下可以发送到安全监控系统
    if (import.meta.env.PROD) {
      // 发送到安全监控API
      this.sendSecurityLog(logEntry);
    }
  }

  /**
   * 发送安全日志到服务器
   */
  private async sendSecurityLog(logEntry: any): Promise<void> {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }

  /**
   * 检测可疑活动
   */
  detectSuspiciousActivity(): void {
    // 检测多次失败的登录尝试
    const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0');
    if (failedAttempts > 5) {
      this.logSecurityEvent('SUSPICIOUS_LOGIN_ATTEMPTS', {
        attempts: failedAttempts,
        timestamp: Date.now()
      });
    }

    // 检测异常的用户行为
    this.detectAbnormalBehavior();
  }

  /**
   * 检测异常行为
   */
  private detectAbnormalBehavior(): void {
    // 检测快速点击
    let clickCount = 0;
    const clickWindow = 1000; // 1秒

    document.addEventListener('click', () => {
      clickCount++;
      setTimeout(() => {
        clickCount--;
      }, clickWindow);

      if (clickCount > 10) {
        this.logSecurityEvent('RAPID_CLICKING', {
          clickCount,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * 更新安全配置
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前安全配置
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

// 创建全局安全中间件实例
export const securityMiddleware = new SecurityMiddleware();

// 导出安全中间件初始化函数
export const initSecurity = (config?: Partial<SecurityConfig>) => {
  return new SecurityMiddleware(config);
};