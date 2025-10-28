import { HttpClient } from '@/utils/request';
import { MockAuthService } from './mockAuthService';
import { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  UserInfo, 
  ApiResponse 
} from '@/types';

// 检查是否使用模拟模式
const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_DISABLE_MOCK;

/**
 * 认证服务API
 */
export class AuthService {
  private static readonly BASE_URL = '/api/auth';

  /**
   * 用户登录
   */
  static async login(loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    if (USE_MOCK) {
      return MockAuthService.login(loginData);
    }
    return HttpClient.post(`${this.BASE_URL}/login`, loginData);
  }

  /**
   * 用户注册
   */
  static async register(registerData: RegisterRequest): Promise<ApiResponse<UserInfo>> {
    if (USE_MOCK) {
      return MockAuthService.register(registerData);
    }
    return HttpClient.post(`${this.BASE_URL}/register`, registerData);
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    if (USE_MOCK) {
      return MockAuthService.refreshToken(refreshToken);
    }
    return HttpClient.post(`${this.BASE_URL}/refresh`, { refreshToken });
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return MockAuthService.logout();
    }
    return HttpClient.post(`${this.BASE_URL}/logout`);
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    if (USE_MOCK) {
      return MockAuthService.getCurrentUser();
    }
    return HttpClient.get(`${this.BASE_URL}/me`);
  }

  /**
   * 更新用户密码
   */
  static async updatePassword(passwordData: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/password`, passwordData);
  }

  /**
   * 发送邮箱验证码
   */
  static async sendEmailCode(email: string, type: 'register' | 'reset' | 'update'): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/email/code`, { email, type });
  }

  /**
   * 发送手机验证码
   */
  static async sendPhoneCode(phone: string, type: 'register' | 'reset' | 'update'): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/phone/code`, { phone, type });
  }

  /**
   * 验证邮箱验证码
   */
  static async verifyEmailCode(email: string, code: string): Promise<ApiResponse<boolean>> {
    return HttpClient.post(`${this.BASE_URL}/email/verify`, { email, code });
  }

  /**
   * 验证手机验证码
   */
  static async verifyPhoneCode(phone: string, code: string): Promise<ApiResponse<boolean>> {
    return HttpClient.post(`${this.BASE_URL}/phone/verify`, { phone, code });
  }

  /**
   * 获取图形验证码
   */
  static async getCaptcha(): Promise<ApiResponse<{ image: string; token: string }>> {
    return HttpClient.get(`${this.BASE_URL}/captcha`);
  }

  /**
   * 验证图形验证码
   */
  static async verifyCaptcha(token: string, code: string): Promise<ApiResponse<boolean>> {
    return HttpClient.post(`${this.BASE_URL}/captcha/verify`, { token, code });
  }

  /**
   * 忘记密码 - 发送重置邮件
   */
  static async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/forgot-password`, { email });
  }

  /**
   * 重置密码
   */
  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/reset-password`, { token, newPassword });
  }

  /**
   * 检查用户名是否可用
   */
  static async checkUsername(username: string): Promise<ApiResponse<boolean>> {
    if (USE_MOCK) {
      return MockAuthService.checkUsernameAvailability(username);
    }
    return HttpClient.get(`${this.BASE_URL}/check/username`, { params: { username } });
  }

  /**
   * 检查邮箱是否可用
   */
  static async checkEmail(email: string): Promise<ApiResponse<boolean>> {
    if (USE_MOCK) {
      return MockAuthService.checkEmailAvailability(email);
    }
    return HttpClient.get(`${this.BASE_URL}/check/email`, { params: { email } });
  }

  /**
   * 检查手机号是否可用
   */
  static async checkPhone(phone: string): Promise<ApiResponse<boolean>> {
    return HttpClient.get(`${this.BASE_URL}/check/phone`, { params: { phone } });
  }

  /**
   * 获取登录历史
   */
  static async getLoginHistory(params: {
    page?: number;
    size?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    list: Array<{
      id: string;
      loginTime: string;
      loginIp: string;
      deviceInfo: string;
      clientType: string;
      success: boolean;
      failureReason?: string;
    }>;
    total: number;
  }>> {
    return HttpClient.get(`${this.BASE_URL}/login-history`, { params });
  }

  /**
   * 获取在线会话
   */
  static async getActiveSessions(): Promise<ApiResponse<Array<{
    sessionId: string;
    loginTime: string;
    lastActiveTime: string;
    loginIp: string;
    deviceInfo: string;
    clientType: string;
    current: boolean;
  }>>> {
    return HttpClient.get(`${this.BASE_URL}/sessions`);
  }

  /**
   * 踢出指定会话
   */
  static async kickSession(sessionId: string): Promise<ApiResponse<void>> {
    return HttpClient.delete(`${this.BASE_URL}/sessions/${sessionId}`);
  }

  /**
   * 踢出所有其他会话
   */
  static async kickAllOtherSessions(): Promise<ApiResponse<void>> {
    return HttpClient.delete(`${this.BASE_URL}/sessions/others`);
  }

  /**
   * 启用两步验证
   */
  static async enableTwoFactor(): Promise<ApiResponse<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  }>> {
    return HttpClient.post(`${this.BASE_URL}/2fa/enable`);
  }

  /**
   * 确认启用两步验证
   */
  static async confirmTwoFactor(code: string): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/2fa/confirm`, { code });
  }

  /**
   * 禁用两步验证
   */
  static async disableTwoFactor(code: string): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/2fa/disable`, { code });
  }

  /**
   * 验证两步验证码
   */
  static async verifyTwoFactor(code: string): Promise<ApiResponse<boolean>> {
    return HttpClient.post(`${this.BASE_URL}/2fa/verify`, { code });
  }

  /**
   * 生成新的备份码
   */
  static async generateBackupCodes(): Promise<ApiResponse<string[]>> {
    return HttpClient.post(`${this.BASE_URL}/2fa/backup-codes`);
  }
}

export default AuthService;