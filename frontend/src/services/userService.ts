import { HttpClient } from '@/utils/request';
import { UserInfo, ApiResponse, PageRequest } from '@/types';

/**
 * 用户管理服务API
 */
export class UserService {
  private static readonly BASE_URL = '/api/users';

  /**
   * 获取用户列表（分页）
   */
  static async getUsers(params: PageRequest & {
    keyword?: string;
    status?: string;
    role?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    list: UserInfo[];
    total: number;
  }>> {
    return HttpClient.get(this.BASE_URL, { params });
  }

  /**
   * 根据ID获取用户详情
   */
  static async getUserById(id: string): Promise<ApiResponse<UserInfo>> {
    return HttpClient.get(`${this.BASE_URL}/${id}`);
  }

  /**
   * 创建用户
   */
  static async createUser(userData: {
    username: string;
    password: string;
    email: string;
    phone?: string;
    nickname?: string;
    roles: string[];
    status?: string;
  }): Promise<ApiResponse<UserInfo>> {
    return HttpClient.post(this.BASE_URL, userData);
  }

  /**
   * 更新用户信息
   */
  static async updateUser(id: string, userData: {
    email?: string;
    phone?: string;
    nickname?: string;
    avatarUrl?: string;
    roles?: string[];
    status?: string;
  }): Promise<ApiResponse<UserInfo>> {
    return HttpClient.put(`${this.BASE_URL}/${id}`, userData);
  }

  /**
   * 删除用户（软删除）
   */
  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    return HttpClient.delete(`${this.BASE_URL}/${id}`);
  }

  /**
   * 批量删除用户
   */
  static async batchDeleteUsers(ids: string[]): Promise<ApiResponse<void>> {
    return HttpClient.delete(`${this.BASE_URL}/batch`, { data: { ids } });
  }

  /**
   * 启用用户
   */
  static async enableUser(id: string): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/enable`);
  }

  /**
   * 禁用用户
   */
  static async disableUser(id: string): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/disable`);
  }

  /**
   * 批量启用用户
   */
  static async batchEnableUsers(ids: string[]): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/batch/enable`, { ids });
  }

  /**
   * 批量禁用用户
   */
  static async batchDisableUsers(ids: string[]): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/batch/disable`, { ids });
  }

  /**
   * 重置用户密码
   */
  static async resetPassword(id: string, newPassword: string): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/password`, { newPassword });
  }

  /**
   * 解锁用户账户
   */
  static async unlockUser(id: string): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/unlock`);
  }

  /**
   * 锁定用户账户
   */
  static async lockUser(id: string, reason?: string): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/lock`, { reason });
  }

  /**
   * 重置用户登录失败次数
   */
  static async resetLoginFailures(id: string): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/reset-failures`);
  }

  /**
   * 获取用户角色列表
   */
  static async getUserRoles(id: string): Promise<ApiResponse<string[]>> {
    return HttpClient.get(`${this.BASE_URL}/${id}/roles`);
  }

  /**
   * 设置用户角色
   */
  static async setUserRoles(id: string, roles: string[]): Promise<ApiResponse<void>> {
    return HttpClient.put(`${this.BASE_URL}/${id}/roles`, { roles });
  }

  /**
   * 添加用户角色
   */
  static async addUserRole(id: string, role: string): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/${id}/roles`, { role });
  }

  /**
   * 移除用户角色
   */
  static async removeUserRole(id: string, role: string): Promise<ApiResponse<void>> {
    return HttpClient.delete(`${this.BASE_URL}/${id}/roles/${role}`);
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStatistics(): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    lockedUsers: number;
    onlineUsers: number;
    usersByRole: Record<string, number>;
    usersByStatus: Record<string, number>;
    registrationTrend: Array<{
      date: string;
      count: number;
    }>;
    loginTrend: Array<{
      date: string;
      count: number;
    }>;
  }>> {
    return HttpClient.get(`${this.BASE_URL}/statistics`);
  }

  /**
   * 导出用户数据
   */
  static async exportUsers(params: {
    format?: 'excel' | 'csv';
    keyword?: string;
    status?: string;
    role?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    downloadUrl: string;
    filename: string;
  }>> {
    return HttpClient.get(`${this.BASE_URL}/export`, { params });
  }

  /**
   * 导入用户数据
   */
  static async importUsers(file: File): Promise<ApiResponse<{
    successCount: number;
    failureCount: number;
    errors: Array<{
      row: number;
      message: string;
    }>;
  }>> {
    return HttpClient.upload(file, `${this.BASE_URL}/import`);
  }

  /**
   * 获取用户活动日志
   */
  static async getUserActivityLog(id: string, params: PageRequest & {
    action?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    list: Array<{
      id: string;
      action: string;
      description: string;
      ip: string;
      userAgent: string;
      createdAt: string;
    }>;
    total: number;
  }>> {
    return HttpClient.get(`${this.BASE_URL}/${id}/activity-log`, { params });
  }

  /**
   * 获取用户登录历史
   */
  static async getUserLoginHistory(id: string, params: PageRequest): Promise<ApiResponse<{
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
    return HttpClient.get(`${this.BASE_URL}/${id}/login-history`, { params });
  }

  /**
   * 获取在线用户列表
   */
  static async getOnlineUsers(params: PageRequest): Promise<ApiResponse<{
    list: Array<{
      userId: string;
      username: string;
      nickname?: string;
      loginTime: string;
      lastActiveTime: string;
      ip: string;
      deviceInfo: string;
      sessionCount: number;
    }>;
    total: number;
  }>> {
    return HttpClient.get(`${this.BASE_URL}/online`, { params });
  }

  /**
   * 强制用户下线
   */
  static async forceLogout(id: string): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/${id}/force-logout`);
  }

  /**
   * 批量强制用户下线
   */
  static async batchForceLogout(ids: string[]): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/batch/force-logout`, { ids });
  }

  /**
   * 发送系统通知给用户
   */
  static async sendNotification(id: string, notification: {
    title: string;
    content: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    urgent?: boolean;
  }): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/${id}/notification`, notification);
  }

  /**
   * 批量发送系统通知
   */
  static async batchSendNotification(ids: string[], notification: {
    title: string;
    content: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    urgent?: boolean;
  }): Promise<ApiResponse<void>> {
    return HttpClient.post(`${this.BASE_URL}/batch/notification`, { ids, ...notification });
  }
}

export default UserService;