/**
 * 安全工具类
 * 提供XSS防护、输入验证、数据加密等安全功能
 */

/**
 * XSS防护 - HTML转义
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * 移除HTML标签
 */
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * @param password 密码
 * @returns 强度等级 (weak, medium, strong)
 */
export const validatePasswordStrength = (password: string): {
  level: 'weak' | 'medium' | 'strong';
  score: number;
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];

  // 长度检查
  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('密码长度至少8位');
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含大写字母');
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含数字');
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含特殊字符');
  }

  // 长度超过12位
  if (password.length >= 12) {
    score += 1;
  }

  let level: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    level = 'weak';
  } else if (score <= 4) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  return { level, score, suggestions };
};

/**
 * 验证用户名格式
 */
export const validateUsername = (username: string): boolean => {
  // 3-50位，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};

/**
 * 验证手机号格式（中国大陆）
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 防止SQL注入 - 基础过滤
 */
export const sanitizeSqlInput = (input: string): string => {
  // 移除常见的SQL注入关键词
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'JAVASCRIPT', 'VBSCRIPT'
  ];
  
  let sanitized = input;
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.replace(/['"`;\\]/g, '');
};

/**
 * 生成随机字符串
 */
export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 简单的Base64编码/解码
 */
export const base64 = {
  encode: (str: string): string => {
    return btoa(encodeURIComponent(str));
  },
  decode: (str: string): string => {
    try {
      return decodeURIComponent(atob(str));
    } catch {
      return '';
    }
  }
};

/**
 * 检查是否为安全的URL
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // 只允许http和https协议
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * 防止点击劫持 - 检查是否在iframe中
 */
export const preventClickjacking = (): void => {
  if (window.top !== window.self) {
    // 如果页面被嵌入到iframe中，跳转到顶层
    window.top!.location = window.location;
  }
};

/**
 * 安全的localStorage操作
 */
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      // 简单加密存储（实际项目中应使用更强的加密）
      const encrypted = base64.encode(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return base64.decode(encrypted);
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }
};

/**
 * 内容安全策略（CSP）辅助函数
 */
export const cspUtils = {
  // 生成nonce值用于内联脚本
  generateNonce: (): string => {
    return generateRandomString(32);
  },
  
  // 检查脚本来源是否安全
  isScriptSourceSafe: (src: string): boolean => {
    const safeDomains = [
      'localhost',
      '127.0.0.1',
      window.location.hostname
    ];
    
    try {
      const url = new URL(src);
      return safeDomains.includes(url.hostname);
    } catch {
      return false;
    }
  }
};

/**
 * 输入验证规则
 */
export const validationRules = {
  // 用户名验证
  username: {
    required: true,
    pattern: /^[a-zA-Z0-9_]{3,50}$/,
    message: '用户名只能包含字母、数字、下划线，长度3-50位'
  },
  
  // 邮箱验证
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入有效的邮箱地址'
  },
  
  // 密码验证
  password: {
    required: true,
    minLength: 6,
    message: '密码长度至少6位'
  },
  
  // 手机号验证
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效的手机号码'
  }
};