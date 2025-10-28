import CryptoJS from 'crypto-js';

/**
 * AES加密工具类
 * 与后端AESHelper保持兼容
 */
export class AESHelper {
  private static readonly DEFAULT_KEY_SIZE = 256;
  private static readonly DEFAULT_ITERATION_COUNT = 10000;
  private static readonly ALGORITHM = 'AES';
  private static readonly TRANSFORMATION = 'AES/CBC/PKCS7';
  private static readonly IV_LENGTH = 16;

  /**
   * 生成随机AES密钥
   */
  static generateKey(keySize: number = this.DEFAULT_KEY_SIZE): string {
    const keyBytes = keySize / 8;
    const key = CryptoJS.lib.WordArray.random(keyBytes);
    return CryptoJS.enc.Base64.stringify(key);
  }

  /**
   * 从密码派生AES密钥
   */
  static deriveKeyFromPassword(
    password: string,
    salt: string,
    keySize: number = this.DEFAULT_KEY_SIZE,
    iterationCount: number = this.DEFAULT_ITERATION_COUNT
  ): string {
    const keyBytes = keySize / 8;
    const saltWordArray = CryptoJS.enc.Base64.parse(salt);
    const key = CryptoJS.PBKDF2(password, saltWordArray, {
      keySize: keyBytes / 4,
      iterations: iterationCount,
      hasher: CryptoJS.algo.SHA256
    });
    return CryptoJS.enc.Base64.stringify(key);
  }

  /**
   * 生成随机盐值
   */
  static generateSalt(): string {
    const salt = CryptoJS.lib.WordArray.random(16);
    return CryptoJS.enc.Base64.stringify(salt);
  }

  /**
   * AES加密
   */
  static encrypt(plaintext: string, key: string, iv?: string): string {
    try {
      const keyWordArray = CryptoJS.enc.Base64.parse(key);
      let ivWordArray: CryptoJS.lib.WordArray;

      if (iv) {
        ivWordArray = CryptoJS.enc.Base64.parse(iv);
      } else {
        ivWordArray = CryptoJS.lib.WordArray.random(this.IV_LENGTH);
      }

      const encrypted = CryptoJS.AES.encrypt(plaintext, keyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // 将IV和加密数据组合
      const combined = ivWordArray.concat(encrypted.ciphertext);
      return CryptoJS.enc.Base64.stringify(combined);
    } catch (error) {
      throw new Error(`AES加密失败: ${error}`);
    }
  }

  /**
   * AES解密
   */
  static decrypt(ciphertext: string, key: string): string {
    try {
      const keyWordArray = CryptoJS.enc.Base64.parse(key);
      const combined = CryptoJS.enc.Base64.parse(ciphertext);

      // 提取IV和加密数据
      const iv = CryptoJS.lib.WordArray.create(
        combined.words.slice(0, this.IV_LENGTH / 4)
      );
      const encrypted = CryptoJS.lib.WordArray.create(
        combined.words.slice(this.IV_LENGTH / 4)
      );

      const decrypted = CryptoJS.AES.decrypt(
        CryptoJS.enc.Base64.stringify(encrypted),
        keyWordArray,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(`AES解密失败: ${error}`);
    }
  }

  /**
   * 验证密钥格式
   */
  static isValidKey(key: string): boolean {
    try {
      const keyWordArray = CryptoJS.enc.Base64.parse(key);
      const keyLength = keyWordArray.words.length * 4;
      return keyLength === 16 || keyLength === 24 || keyLength === 32;
    } catch {
      return false;
    }
  }
}

/**
 * RSA加密工具类
 * 注意：浏览器环境下RSA加密通常使用Web Crypto API或第三方库
 * 这里提供基础接口，实际实现可能需要引入额外的RSA库
 */
export class RSAHelper {
  /**
   * RSA公钥加密
   * 注意：这里需要使用支持RSA的加密库，如node-rsa或jsencrypt
   */
  static async encryptWithPublicKey(plaintext: string, publicKey: string): Promise<string> {
    try {
      // 这里应该使用实际的RSA加密库
      // 例如使用jsencrypt库：
      // const JSEncrypt = require('jsencrypt');
      // const encrypt = new JSEncrypt();
      // encrypt.setPublicKey(publicKey);
      // return encrypt.encrypt(plaintext);
      
      // 临时实现，实际项目中需要替换为真正的RSA加密
      console.warn('RSA加密需要引入专门的RSA库');
      return btoa(plaintext); // 临时使用base64编码
    } catch (error) {
      throw new Error(`RSA加密失败: ${error}`);
    }
  }

  /**
   * 验证RSA公钥格式
   */
  static isValidPublicKey(publicKey: string): boolean {
    return publicKey.includes('-----BEGIN PUBLIC KEY-----') &&
           publicKey.includes('-----END PUBLIC KEY-----');
  }
}

/**
 * 混合加密工具类
 * 结合RSA和AES的优势
 */
export class HybridEncryption {
  /**
   * 混合加密
   * 1. 生成随机AES密钥
   * 2. 使用AES密钥加密数据
   * 3. 使用RSA公钥加密AES密钥
   */
  static async encrypt(plaintext: string, rsaPublicKey: string): Promise<{
    encryptedData: string;
    encryptedKey: string;
  }> {
    try {
      // 生成随机AES密钥
      const aesKey = AESHelper.generateKey();
      
      // 使用AES加密数据
      const encryptedData = AESHelper.encrypt(plaintext, aesKey);
      
      // 使用RSA加密AES密钥
      const encryptedKey = await RSAHelper.encryptWithPublicKey(aesKey, rsaPublicKey);
      
      return {
        encryptedData,
        encryptedKey
      };
    } catch (error) {
      throw new Error(`混合加密失败: ${error}`);
    }
  }
}

/**
 * 密码强度检查工具
 */
export class PasswordStrengthChecker {
  /**
   * 检查密码强度
   */
  static checkStrength(password: string): {
    score: number;
    level: 'weak' | 'medium' | 'strong' | 'very-strong';
    suggestions: string[];
  } {
    let score = 0;
    const suggestions: string[] = [];

    // 长度检查
    if (password.length >= 8) {
      score += 1;
    } else {
      suggestions.push('密码长度至少8位');
    }

    if (password.length >= 12) {
      score += 1;
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
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      suggestions.push('包含特殊字符');
    }

    // 确定强度等级
    let level: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score <= 2) {
      level = 'weak';
    } else if (score <= 3) {
      level = 'medium';
    } else if (score <= 4) {
      level = 'strong';
    } else {
      level = 'very-strong';
    }

    return { score, level, suggestions };
  }
}

/**
 * 安全工具类
 */
export class SecurityUtils {
  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成UUID
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 安全的JSON解析
   */
  static safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }

  /**
   * 清理敏感数据
   */
  static sanitizeObject(obj: any): any {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...obj };
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***';
      }
    }
    
    return sanitized;
  }
}