import { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  UserInfo, 
  ApiResponse 
} from '@/types';

/**
 * 模拟认证服务 - 用于演示和测试
 */
export class MockAuthService {
  // 模拟用户数据
  private static mockUsers = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      nickname: '系统管理员',
      avatar: '',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['*'],
      status: 'ACTIVE',
      lastLoginTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      username: 'user',
      password: 'user123',
      email: 'user@example.com',
      nickname: '普通用户',
      avatar: '',
      roles: ['USER'],
      permissions: ['read'],
      status: 'ACTIVE',
      lastLoginTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      username: 'demo',
      password: 'demo123',
      email: 'demo@example.com',
      nickname: '演示账户',
      avatar: '',
      roles: ['USER'],
      permissions: ['read'],
      status: 'ACTIVE',
      lastLoginTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  /**
   * 模拟用户登录
   */
  static async login(loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { username, password } = loginData;
    
    // 查找用户
    const user = this.mockUsers.find(u => 
      u.username === username && u.password === password
    );

    if (!user) {
      return {
        success: false,
        code: 3004,
        message: '用户名或密码错误',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    // 生成模拟token
    const accessToken = `mock_access_token_${user.id}_${Date.now()}`;
    const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

    const response: LoginResponse = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        roles: user.roles,
        permissions: user.permissions,
        status: user.status,
        lastLoginTime: user.lastLoginTime,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };

    return {
      success: true,
      code: 200,
      message: '登录成功',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟用户注册
   */
  static async register(registerData: RegisterRequest): Promise<ApiResponse<UserInfo>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { username, email } = registerData;
    
    // 检查用户名是否已存在
    const existingUser = this.mockUsers.find(u => 
      u.username === username || u.email === email
    );

    if (existingUser) {
      return {
        success: false,
        code: 3001,
        message: existingUser.username === username ? '用户名已存在' : '邮箱已存在',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    // 创建新用户
    const newUser: UserInfo = {
      id: String(this.mockUsers.length + 1),
      username: registerData.username,
      email: registerData.email,
      nickname: registerData.nickname || registerData.username,
      avatar: '',
      phone: registerData.phone || '',
      roles: ['USER'],
      permissions: ['read'],
      status: 1,
      lastLoginTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      code: 200,
      message: '注册成功',
      data: newUser,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟刷新令牌
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 简单验证refresh token格式
    if (!refreshToken.startsWith('mock_refresh_token_')) {
      return {
        success: false,
        code: 4001,
        message: '无效的刷新令牌',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    // 从token中提取用户ID
    const userId = refreshToken.split('_')[3];
    const user = this.mockUsers.find(u => u.id === userId);

    if (!user) {
      return {
        success: false,
        code: 4001,
        message: '用户不存在',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    // 生成新的token
    const newAccessToken = `mock_access_token_${user.id}_${Date.now()}`;
    const newRefreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

    const response: LoginResponse = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        roles: user.roles,
        permissions: user.permissions,
        status: user.status,
        lastLoginTime: user.lastLoginTime,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };

    return {
      success: true,
      code: 200,
      message: '令牌刷新成功',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟用户登出
   */
  static async logout(): Promise<ApiResponse<void>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      code: 200,
      message: '登出成功',
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟获取当前用户信息
   */
  static async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 在实际应用中，这里会从token中解析用户信息
    // 这里我们返回默认的admin用户
    const user = this.mockUsers[0];

    return {
      success: true,
      code: 200,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        roles: user.roles,
        permissions: user.permissions,
        status: user.status,
        lastLoginTime: user.lastLoginTime,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟检查用户名可用性
   */
  static async checkUsernameAvailability(username: string): Promise<ApiResponse<boolean>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    const exists = this.mockUsers.some(u => u.username === username);

    return {
      success: true,
      code: 200,
      message: '检查完成',
      data: !exists,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟检查邮箱可用性
   */
  static async checkEmailAvailability(email: string): Promise<ApiResponse<boolean>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    const exists = this.mockUsers.some(u => u.email === email);

    return {
      success: true,
      code: 200,
      message: '检查完成',
      data: !exists,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取模拟用户列表（用于显示测试账户）
   */
  static getMockUsers() {
    return this.mockUsers.map(user => ({
      username: user.username,
      password: user.password,
      nickname: user.nickname,
      roles: user.roles
    }));
  }
}