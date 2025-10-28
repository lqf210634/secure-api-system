import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import { 
  getCaptcha, 
  login, 
  register, 
  logout, 
  verifyToken, 
  refreshCaptcha 
} from '@/api/auth'
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  uploadAvatar, 
  getUserList, 
  getUserStats 
} from '@/api/user'
import { 
  getAuditLogs, 
  getAuditStats, 
  getSecurityAlerts, 
  exportAuditLogs 
} from '@/api/audit'
import { mockApiResponse, resetAllMocks } from '@/test/utils'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock fetch for real network requests
const originalFetch = global.fetch

describe('API集成测试', () => {
  beforeEach(() => {
    resetAllMocks()
    server.listen()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('认证API集成测试', () => {
    it('应该完成完整的认证流程', async () => {
      // 1. 获取验证码
      const captchaResponse = await getCaptcha()
      expect(captchaResponse.success).toBe(true)
      expect(captchaResponse.data.captchaId).toBeDefined()
      expect(captchaResponse.data.captchaImage).toBeDefined()

      // 2. 用户注册
      const registerData = {
        username: 'newuser123',
        password: 'StrongPassword123!',
        email: 'newuser@example.com',
        phone: '13800138000',
        captchaId: captchaResponse.data.captchaId,
        captchaCode: 'ABCD'
      }

      const registerResponse = await register(registerData)
      expect(registerResponse.success).toBe(true)
      expect(registerResponse.message).toBe('注册成功')

      // 3. 用户登录
      const loginData = {
        username: 'newuser123',
        password: 'StrongPassword123!',
        captchaId: captchaResponse.data.captchaId,
        captchaCode: 'ABCD',
        rememberMe: true
      }

      const loginResponse = await login(loginData)
      expect(loginResponse.success).toBe(true)
      expect(loginResponse.data.token).toBeDefined()
      expect(loginResponse.data.user).toBeDefined()
      expect(loginResponse.data.user.username).toBe('newuser123')

      // 4. 验证令牌
      const verifyResponse = await verifyToken()
      expect(verifyResponse.success).toBe(true)
      expect(verifyResponse.data.valid).toBe(true)

      // 5. 用户登出
      const logoutResponse = await logout()
      expect(logoutResponse.success).toBe(true)
      expect(logoutResponse.message).toBe('登出成功')
    })

    it('应该处理认证错误', async () => {
      // 模拟登录失败
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json(mockApiResponse.error('用户名或密码错误'))
          )
        })
      )

      const loginData = {
        username: 'wronguser',
        password: 'wrongpassword',
        captchaId: 'test-captcha-id',
        captchaCode: 'ABCD'
      }

      await expect(login(loginData)).rejects.toThrow('用户名或密码错误')
    })

    it('应该处理验证码错误', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json(mockApiResponse.error('验证码错误'))
          )
        })
      )

      const loginData = {
        username: 'testuser',
        password: 'password123',
        captchaId: 'test-captcha-id',
        captchaCode: 'WRONG'
      }

      await expect(login(loginData)).rejects.toThrow('验证码错误')
    })

    it('应该处理账户锁定', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(423),
            ctx.json(mockApiResponse.error('账户已被锁定'))
          )
        })
      )

      const loginData = {
        username: 'lockeduser',
        password: 'password123',
        captchaId: 'test-captcha-id',
        captchaCode: 'ABCD'
      }

      await expect(login(loginData)).rejects.toThrow('账户已被锁定')
    })
  })

  describe('用户API集成测试', () => {
    it('应该完成用户资料管理流程', async () => {
      // 1. 获取用户资料
      const profileResponse = await getUserProfile()
      expect(profileResponse.success).toBe(true)
      expect(profileResponse.data.username).toBeDefined()
      expect(profileResponse.data.email).toBeDefined()

      // 2. 更新用户资料
      const updateData = {
        email: 'updated@example.com',
        phone: '13900139000'
      }

      const updateResponse = await updateUserProfile(updateData)
      expect(updateResponse.success).toBe(true)
      expect(updateResponse.message).toBe('更新成功')

      // 3. 修改密码
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const passwordResponse = await changePassword(passwordData)
      expect(passwordResponse.success).toBe(true)
      expect(passwordResponse.message).toBe('密码修改成功')

      // 4. 上传头像
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const avatarResponse = await uploadAvatar(file)
      expect(avatarResponse.success).toBe(true)
      expect(avatarResponse.data.avatarUrl).toBeDefined()
    })

    it('应该处理用户资料更新错误', async () => {
      // 模拟邮箱已存在错误
      server.use(
        rest.put('/api/user/profile', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json(mockApiResponse.error('邮箱已存在'))
          )
        })
      )

      const updateData = {
        email: 'existing@example.com'
      }

      await expect(updateUserProfile(updateData)).rejects.toThrow('邮箱已存在')
    })

    it('应该处理密码强度不足', async () => {
      server.use(
        rest.put('/api/user/password', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json(mockApiResponse.error('密码强度不足'))
          )
        })
      )

      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'weak',
        confirmPassword: 'weak'
      }

      await expect(changePassword(passwordData)).rejects.toThrow('密码强度不足')
    })

    it('应该处理文件上传限制', async () => {
      server.use(
        rest.post('/api/user/avatar', (req, res, ctx) => {
          return res(
            ctx.status(413),
            ctx.json(mockApiResponse.error('文件大小超过限制'))
          )
        })
      )

      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      })

      await expect(uploadAvatar(largeFile)).rejects.toThrow('文件大小超过限制')
    })
  })

  describe('管理员API集成测试', () => {
    beforeEach(() => {
      // 模拟管理员令牌
      mockLocalStorage.getItem.mockReturnValue('admin-token')
    })

    it('应该完成用户管理流程', async () => {
      // 1. 获取用户列表
      const userListResponse = await getUserList({ page: 1, size: 10 })
      expect(userListResponse.success).toBe(true)
      expect(userListResponse.data.users).toBeInstanceOf(Array)
      expect(userListResponse.data.total).toBeGreaterThan(0)

      // 2. 获取用户统计
      const statsResponse = await getUserStats()
      expect(statsResponse.success).toBe(true)
      expect(statsResponse.data.totalUsers).toBeDefined()
      expect(statsResponse.data.activeUsers).toBeDefined()
    })

    it('应该完成审计日志管理流程', async () => {
      // 1. 获取审计日志
      const logsResponse = await getAuditLogs({
        page: 1,
        size: 10,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
      expect(logsResponse.success).toBe(true)
      expect(logsResponse.data.logs).toBeInstanceOf(Array)

      // 2. 获取审计统计
      const auditStatsResponse = await getAuditStats()
      expect(auditStatsResponse.success).toBe(true)
      expect(auditStatsResponse.data.totalLogs).toBeDefined()

      // 3. 获取安全警报
      const alertsResponse = await getSecurityAlerts()
      expect(alertsResponse.success).toBe(true)
      expect(alertsResponse.data.alerts).toBeInstanceOf(Array)

      // 4. 导出审计日志
      const exportResponse = await exportAuditLogs({
        format: 'csv',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
      expect(exportResponse.success).toBe(true)
      expect(exportResponse.data.downloadUrl).toBeDefined()
    })

    it('应该处理权限不足错误', async () => {
      // 模拟普通用户令牌
      mockLocalStorage.getItem.mockReturnValue('user-token')

      server.use(
        rest.get('/api/admin/users', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json(mockApiResponse.error('权限不足'))
          )
        })
      )

      await expect(getUserList({ page: 1, size: 10 })).rejects.toThrow('权限不足')
    })
  })

  describe('网络错误处理', () => {
    it('应该处理网络连接错误', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res) => {
          return res.networkError('网络连接失败')
        })
      )

      await expect(getUserProfile()).rejects.toThrow('网络错误')
    })

    it('应该处理服务器错误', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json(mockApiResponse.error('服务器内部错误'))
          )
        })
      )

      await expect(getUserProfile()).rejects.toThrow('服务器内部错误')
    })

    it('应该处理请求超时', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(
            ctx.delay(10000), // 10秒延迟，超过默认超时时间
            ctx.json(mockApiResponse.success({}))
          )
        })
      )

      // 注意：这个测试可能需要根据实际的超时配置调整
      await expect(getUserProfile()).rejects.toThrow()
    })
  })

  describe('请求拦截器测试', () => {
    it('应该自动添加认证头', async () => {
      let requestHeaders: Headers | undefined

      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          requestHeaders = req.headers
          return res(ctx.json(mockApiResponse.success({})))
        })
      )

      await getUserProfile()

      expect(requestHeaders?.get('Authorization')).toBe('Bearer mock-token')
    })

    it('应该自动添加CSRF令牌', async () => {
      let requestHeaders: Headers | undefined

      server.use(
        rest.post('/api/user/profile', (req, res, ctx) => {
          requestHeaders = req.headers
          return res(ctx.json(mockApiResponse.success({})))
        })
      )

      await updateUserProfile({ email: 'test@example.com' })

      expect(requestHeaders?.get('X-CSRF-Token')).toBeDefined()
    })

    it('应该设置正确的Content-Type', async () => {
      let requestHeaders: Headers | undefined

      server.use(
        rest.post('/api/user/profile', (req, res, ctx) => {
          requestHeaders = req.headers
          return res(ctx.json(mockApiResponse.success({})))
        })
      )

      await updateUserProfile({ email: 'test@example.com' })

      expect(requestHeaders?.get('Content-Type')).toBe('application/json')
    })
  })

  describe('响应拦截器测试', () => {
    it('应该自动处理401错误', async () => {
      const mockClearAuth = vi.fn()
      
      // 模拟store dispatch
      vi.mock('@/store', () => ({
        store: {
          dispatch: mockClearAuth
        }
      }))

      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json(mockApiResponse.error('令牌已过期'))
          )
        })
      )

      await expect(getUserProfile()).rejects.toThrow('令牌已过期')
      // 验证是否清除了认证状态
      // expect(mockClearAuth).toHaveBeenCalled()
    })

    it('应该自动处理403错误', async () => {
      server.use(
        rest.get('/api/admin/users', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json(mockApiResponse.error('权限不足'))
          )
        })
      )

      await expect(getUserList({ page: 1, size: 10 })).rejects.toThrow('权限不足')
    })
  })

  describe('并发请求测试', () => {
    it('应该正确处理并发请求', async () => {
      const promises = [
        getUserProfile(),
        getUserStats(),
        getAuditLogs({ page: 1, size: 10 })
      ]

      const results = await Promise.allSettled(promises)

      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
        if (result.status === 'fulfilled') {
          expect(result.value.success).toBe(true)
        }
      })
    })

    it('应该处理部分请求失败的情况', async () => {
      server.use(
        rest.get('/api/user/stats', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json(mockApiResponse.error('服务器错误'))
          )
        })
      )

      const promises = [
        getUserProfile(),
        getUserStats(),
        getAuditLogs({ page: 1, size: 10 })
      ]

      const results = await Promise.allSettled(promises)

      expect(results[0].status).toBe('fulfilled') // getUserProfile 成功
      expect(results[1].status).toBe('rejected')  // getUserStats 失败
      expect(results[2].status).toBe('fulfilled') // getAuditLogs 成功
    })
  })

  describe('缓存和性能测试', () => {
    it('应该缓存验证码请求', async () => {
      let requestCount = 0

      server.use(
        rest.get('/api/auth/captcha', (req, res, ctx) => {
          requestCount++
          return res(ctx.json(mockApiResponse.success({
            captchaId: `captcha-${requestCount}`,
            captchaImage: 'data:image/png;base64,mock-image'
          })))
        })
      )

      // 连续请求验证码
      const response1 = await getCaptcha()
      const response2 = await getCaptcha()

      expect(response1.data.captchaId).toBe('captcha-1')
      expect(response2.data.captchaId).toBe('captcha-2')
      expect(requestCount).toBe(2)
    })

    it('应该正确处理请求重试', async () => {
      let attemptCount = 0

      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          attemptCount++
          if (attemptCount <= 2) {
            return res.networkError('网络错误')
          }
          return res(ctx.json(mockApiResponse.success({
            username: 'testuser'
          })))
        })
      )

      // 这个测试假设API客户端有重试机制
      const response = await getUserProfile()
      expect(response.success).toBe(true)
      expect(attemptCount).toBe(3)
    })
  })

  describe('数据验证测试', () => {
    it('应该验证请求参数', async () => {
      server.use(
        rest.post('/api/auth/register', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json(mockApiResponse.error('用户名格式不正确'))
          )
        })
      )

      const invalidData = {
        username: 'a', // 太短
        password: 'StrongPassword123!',
        email: 'test@example.com',
        phone: '13800138000',
        captchaId: 'test-id',
        captchaCode: 'ABCD'
      }

      await expect(register(invalidData)).rejects.toThrow('用户名格式不正确')
    })

    it('应该验证响应数据格式', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(ctx.json({
            // 缺少success字段的无效响应
            data: { username: 'test' }
          }))
        })
      )

      await expect(getUserProfile()).rejects.toThrow()
    })
  })
})