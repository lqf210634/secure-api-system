import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import * as authAPI from '@/api/auth'
import { mockFormData, mockApiResponse } from '@/test/utils'

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

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('getCaptcha', () => {
    it('应该成功获取验证码', async () => {
      const result = await authAPI.getCaptcha()

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('sessionId')
      expect(result.data).toHaveProperty('captchaImage')
      expect(result.data.sessionId).toBe('test-session-id')
      expect(result.data.captchaImage).toMatch(/^data:image\/png;base64,/)
    })

    it('应该处理获取验证码失败', async () => {
      server.use(
        rest.get('/api/auth/captcha', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('服务器错误')))
        })
      )

      const result = await authAPI.getCaptcha()

      expect(result.success).toBe(false)
      expect(result.message).toBe('服务器错误')
    })

    it('应该处理网络错误', async () => {
      server.use(
        rest.get('/api/auth/captcha', (req, res, ctx) => {
          return res.networkError('网络连接失败')
        })
      )

      await expect(authAPI.getCaptcha()).rejects.toThrow()
    })
  })

  describe('login', () => {
    const loginData = {
      username: mockFormData.login.username,
      password: mockFormData.login.password,
      captcha: mockFormData.login.captcha,
      sessionId: mockFormData.login.sessionId
    }

    it('应该成功登录', async () => {
      const result = await authAPI.login(loginData)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('token')
      expect(result.data).toHaveProperty('user')
      expect(result.data.user.username).toBe('testuser')
      expect(result.data.token).toBe('mock-jwt-token')
    })

    it('应该处理登录失败 - 用户名或密码错误', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('用户名或密码错误')))
        })
      )

      const result = await authAPI.login({
        ...loginData,
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户名或密码错误')
    })

    it('应该处理验证码错误', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('验证码错误')))
        })
      )

      const result = await authAPI.login({
        ...loginData,
        captcha: 'wrong'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('验证码错误')
    })

    it('应该处理账户被锁定', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(423), ctx.json(mockApiResponse.error('账户已被锁定')))
        })
      )

      const result = await authAPI.login(loginData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('账户已被锁定')
    })

    it('应该验证请求参数', async () => {
      server.use(
        rest.post('/api/auth/login', async (req, res, ctx) => {
          const body = await req.json()
          
          expect(body).toEqual(loginData)
          
          return res(ctx.json(mockApiResponse.success({
            token: 'mock-jwt-token',
            user: { username: 'testuser' }
          })))
        })
      )

      await authAPI.login(loginData)
    })
  })

  describe('register', () => {
    const registerData = {
      username: mockFormData.register.username,
      password: mockFormData.register.password,
      email: mockFormData.register.email,
      phone: mockFormData.register.phone,
      captcha: mockFormData.register.captcha,
      sessionId: mockFormData.register.sessionId
    }

    it('应该成功注册', async () => {
      const result = await authAPI.register(registerData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('注册成功')
    })

    it('应该处理用户名已存在', async () => {
      server.use(
        rest.post('/api/auth/register', (req, res, ctx) => {
          return res(ctx.status(409), ctx.json(mockApiResponse.error('用户名已存在')))
        })
      )

      const result = await authAPI.register({
        ...registerData,
        username: 'existinguser'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户名已存在')
    })

    it('应该处理邮箱已存在', async () => {
      server.use(
        rest.post('/api/auth/register', (req, res, ctx) => {
          return res(ctx.status(409), ctx.json(mockApiResponse.error('邮箱已被注册')))
        })
      )

      const result = await authAPI.register({
        ...registerData,
        email: 'existing@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱已被注册')
    })

    it('应该验证请求参数', async () => {
      server.use(
        rest.post('/api/auth/register', async (req, res, ctx) => {
          const body = await req.json()
          
          expect(body).toEqual(registerData)
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await authAPI.register(registerData)
    })
  })

  describe('logout', () => {
    it('应该成功登出', async () => {
      const result = await authAPI.logout()

      expect(result.success).toBe(true)
      expect(result.message).toBe('登出成功')
    })

    it('应该处理登出失败', async () => {
      server.use(
        rest.post('/api/auth/logout', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('登出失败')))
        })
      )

      const result = await authAPI.logout()

      expect(result.success).toBe(false)
      expect(result.message).toBe('登出失败')
    })

    it('应该在登出时清除本地存储', async () => {
      await authAPI.logout()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
    })
  })

  describe('verifyToken', () => {
    it('应该成功验证令牌', async () => {
      const result = await authAPI.verifyToken('valid-token')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('user')
      expect(result.data.user.username).toBe('testuser')
    })

    it('应该处理无效令牌', async () => {
      server.use(
        rest.post('/api/auth/verify', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('令牌无效')))
        })
      )

      const result = await authAPI.verifyToken('invalid-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('令牌无效')
    })

    it('应该处理过期令牌', async () => {
      server.use(
        rest.post('/api/auth/verify', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('令牌已过期')))
        })
      )

      const result = await authAPI.verifyToken('expired-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('令牌已过期')
    })

    it('应该发送正确的Authorization头', async () => {
      server.use(
        rest.post('/api/auth/verify', (req, res, ctx) => {
          const authHeader = req.headers.get('Authorization')
          expect(authHeader).toBe('Bearer test-token')
          
          return res(ctx.json(mockApiResponse.success({
            user: { username: 'testuser' }
          })))
        })
      )

      await authAPI.verifyToken('test-token')
    })
  })

  describe('refreshCaptcha', () => {
    it('应该成功刷新验证码', async () => {
      const result = await authAPI.refreshCaptcha('old-session-id')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('sessionId')
      expect(result.data).toHaveProperty('captchaImage')
      expect(result.data.sessionId).not.toBe('old-session-id')
    })

    it('应该处理刷新失败', async () => {
      server.use(
        rest.post('/api/auth/captcha/refresh', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('刷新失败')))
        })
      )

      const result = await authAPI.refreshCaptcha('session-id')

      expect(result.success).toBe(false)
      expect(result.message).toBe('刷新失败')
    })
  })

  describe('错误处理', () => {
    it('应该处理网络超时', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.delay(10000)) // 10秒延迟
        })
      )

      // 设置较短的超时时间
      const originalTimeout = global.fetch
      global.fetch = vi.fn().mockImplementation(() => 
        Promise.reject(new Error('Request timeout'))
      )

      await expect(authAPI.login(mockFormData.login)).rejects.toThrow()

      global.fetch = originalTimeout
    })

    it('应该处理JSON解析错误', async () => {
      server.use(
        rest.get('/api/auth/captcha', (req, res, ctx) => {
          return res(ctx.text('Invalid JSON'))
        })
      )

      await expect(authAPI.getCaptcha()).rejects.toThrow()
    })

    it('应该处理空响应', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(200))
        })
      )

      await expect(authAPI.login(mockFormData.login)).rejects.toThrow()
    })
  })

  describe('请求拦截器', () => {
    it('应该自动添加Content-Type头', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          const contentType = req.headers.get('Content-Type')
          expect(contentType).toBe('application/json')
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await authAPI.login(mockFormData.login)
    })

    it('应该自动添加CSRF令牌', async () => {
      // 模拟CSRF令牌
      const csrfToken = 'csrf-token-123'
      document.querySelector = vi.fn().mockReturnValue({
        getAttribute: () => csrfToken
      })

      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          const csrfHeader = req.headers.get('X-CSRF-Token')
          expect(csrfHeader).toBe(csrfToken)
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await authAPI.login(mockFormData.login)
    })
  })

  describe('响应拦截器', () => {
    it('应该自动处理401错误', async () => {
      server.use(
        rest.post('/api/auth/verify', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('未授权')))
        })
      )

      const result = await authAPI.verifyToken('invalid-token')

      expect(result.success).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('应该自动处理403错误', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('禁止访问')))
        })
      )

      const result = await authAPI.login(mockFormData.login)

      expect(result.success).toBe(false)
      expect(result.message).toBe('禁止访问')
    })
  })
})