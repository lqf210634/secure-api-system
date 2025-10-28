import { AESHelper, SecurityUtils } from './encryption';

// 存储键名常量
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
  REMEMBER_ME: 'remember_me',
  DEVICE_ID: 'device_id',
  LAST_LOGIN_TIME: 'last_login_time',
  APP_SETTINGS: 'app_settings',
  ENCRYPTION_KEY: 'encryption_key',
} as const;

// 存储配置
interface StorageConfig {
  encrypt?: boolean;
  expiry?: number; // 过期时间（毫秒）
  storage?: Storage; // localStorage 或 sessionStorage
}

// 存储项接口
interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expiry?: number;
  encrypted?: boolean;
}

/**
 * 安全存储工具类
 */
export class SecureStorage {
  private static encryptionKey: string | null = null;

  /**
   * 初始化加密密钥
   */
  static initEncryptionKey(): void {
    if (!this.encryptionKey) {
      // 尝试从存储中获取密钥
      const storedKey = localStorage.getItem('__enc_key__');
      if (storedKey) {
        this.encryptionKey = storedKey;
      } else {
        // 生成新的加密密钥
        this.encryptionKey = AESHelper.generateKey();
        localStorage.setItem('__enc_key__', this.encryptionKey);
      }
    }
  }

  /**
   * 设置存储项
   */
  static setItem<T>(
    key: string,
    value: T,
    config: StorageConfig = {}
  ): void {
    try {
      const {
        encrypt = false,
        expiry,
        storage = localStorage
      } = config;

      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry,
        encrypted: encrypt
      };

      let serializedItem = JSON.stringify(item);

      // 加密存储
      if (encrypt) {
        this.initEncryptionKey();
        if (this.encryptionKey) {
          serializedItem = AESHelper.encrypt(serializedItem, this.encryptionKey);
        }
      }

      storage.setItem(key, serializedItem);
    } catch (error) {
      console.error(`Failed to set storage item ${key}:`, error);
    }
  }

  /**
   * 获取存储项
   */
  static getItem<T>(
    key: string,
    defaultValue?: T,
    storage: Storage = localStorage
  ): T | undefined {
    try {
      const serializedItem = storage.getItem(key);
      if (!serializedItem) {
        return defaultValue;
      }

      let item: StorageItem<T>;

      // 尝试解析为加密数据
      try {
        // 先尝试直接解析
        item = JSON.parse(serializedItem);
      } catch {
        // 如果解析失败，尝试解密
        this.initEncryptionKey();
        if (this.encryptionKey) {
          const decrypted = AESHelper.decrypt(serializedItem, this.encryptionKey);
          item = JSON.parse(decrypted);
        } else {
          throw new Error('Decryption key not available');
        }
      }

      // 检查是否过期
      if (item.expiry && Date.now() > item.timestamp + item.expiry) {
        storage.removeItem(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      console.error(`Failed to get storage item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 移除存储项
   */
  static removeItem(key: string, storage: Storage = localStorage): void {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove storage item ${key}:`, error);
    }
  }

  /**
   * 清空存储
   */
  static clear(storage: Storage = localStorage): void {
    try {
      storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * 获取存储大小
   */
  static getStorageSize(storage: Storage = localStorage): number {
    let total = 0;
    for (const key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total;
  }

  /**
   * 检查存储是否可用
   */
  static isStorageAvailable(storage: Storage = localStorage): boolean {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 批量设置
   */
  static setBatch(
    items: Record<string, any>,
    config: StorageConfig = {}
  ): void {
    Object.entries(items).forEach(([key, value]) => {
      this.setItem(key, value, config);
    });
  }

  /**
   * 批量获取
   */
  static getBatch<T extends Record<string, any>>(
    keys: (keyof T)[],
    storage: Storage = localStorage
  ): Partial<T> {
    const result: Partial<T> = {};
    keys.forEach(key => {
      result[key] = this.getItem(key as string, undefined, storage);
    });
    return result;
  }
}

/**
 * Token管理
 */
export const getToken = (): string | undefined => {
  return SecureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const setToken = (token: string, rememberMe: boolean = false): void => {
  const storage = rememberMe ? localStorage : sessionStorage;
  SecureStorage.setItem(
    STORAGE_KEYS.ACCESS_TOKEN,
    token,
    {
      encrypt: true,
      storage,
      expiry: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined // 7天
    }
  );
};

export const removeToken = (): void => {
  SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN, localStorage);
  SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN, sessionStorage);
};

export const getRefreshToken = (): string | undefined => {
  return SecureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const setRefreshToken = (token: string, rememberMe: boolean = false): void => {
  const storage = rememberMe ? localStorage : sessionStorage;
  SecureStorage.setItem(
    STORAGE_KEYS.REFRESH_TOKEN,
    token,
    {
      encrypt: true,
      storage,
      expiry: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined // 30天
    }
  );
};

export const removeRefreshToken = (): void => {
  SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN, localStorage);
  SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN, sessionStorage);
};

/**
 * 用户信息管理
 */
export const getUserInfo = (): any => {
  return SecureStorage.getItem(STORAGE_KEYS.USER_INFO);
};

export const setUserInfo = (userInfo: any): void => {
  SecureStorage.setItem(
    STORAGE_KEYS.USER_INFO,
    userInfo,
    { encrypt: true }
  );
};

export const removeUserInfo = (): void => {
  SecureStorage.removeItem(STORAGE_KEYS.USER_INFO);
};

/**
 * 应用设置管理
 */
export const getTheme = (): string => {
  return SecureStorage.getItem(STORAGE_KEYS.THEME, 'light');
};

export const setTheme = (theme: string): void => {
  SecureStorage.setItem(STORAGE_KEYS.THEME, theme);
};

export const getLanguage = (): string => {
  return SecureStorage.getItem(STORAGE_KEYS.LANGUAGE, 'zh-CN');
};

export const setLanguage = (language: string): void => {
  SecureStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
};

export const getRememberMe = (): boolean => {
  return SecureStorage.getItem(STORAGE_KEYS.REMEMBER_ME, false);
};

export const setRememberMe = (remember: boolean): void => {
  SecureStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember);
};

/**
 * 设备管理
 */
export const getDeviceId = (): string => {
  let deviceId = SecureStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = SecurityUtils.generateUUID();
    SecureStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
};

export const getLastLoginTime = (): string | undefined => {
  return SecureStorage.getItem(STORAGE_KEYS.LAST_LOGIN_TIME);
};

export const setLastLoginTime = (time: string): void => {
  SecureStorage.setItem(STORAGE_KEYS.LAST_LOGIN_TIME, time);
};

export const getDeviceInfo = (): any => {
  return {
    deviceId: getDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };
};

/**
 * 应用设置
 */
export const getAppSettings = (): any => {
  return SecureStorage.getItem(STORAGE_KEYS.APP_SETTINGS, {});
};

export const setAppSettings = (settings: any): void => {
  SecureStorage.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
};

export const updateAppSettings = (updates: any): void => {
  const currentSettings = getAppSettings();
  const newSettings = { ...currentSettings, ...updates };
  setAppSettings(newSettings);
};

/**
 * 清理所有存储数据
 */
export const clearAllStorage = (): void => {
  // 清理认证相关
  removeToken();
  removeRefreshToken();
  removeUserInfo();
  
  // 保留用户偏好设置
  // SecureStorage.removeItem(STORAGE_KEYS.THEME);
  // SecureStorage.removeItem(STORAGE_KEYS.LANGUAGE);
  
  // 清理其他数据
  SecureStorage.removeItem(STORAGE_KEYS.LAST_LOGIN_TIME);
  SecureStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
};

/**
 * 存储监听器
 */
export class StorageListener {
  private static listeners: Map<string, Set<(value: any) => void>> = new Map();

  /**
   * 添加监听器
   */
  static addListener(key: string, callback: (value: any) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  /**
   * 移除监听器
   */
  static removeListener(key: string, callback: (value: any) => void): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * 触发监听器
   */
  static trigger(key: string, value: any): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }
}

// 监听storage变化
window.addEventListener('storage', (event) => {
  if (event.key && event.newValue !== event.oldValue) {
    const value = SecureStorage.getItem(event.key);
    StorageListener.trigger(event.key, value);
  }
});

export default SecureStorage;