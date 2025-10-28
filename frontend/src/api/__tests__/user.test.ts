import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import * as userAPI from '@/api/user'
import { mockFormData, mockApiResponse, mockFileObject } from '@/test/utils'

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('getUserProfile', () => {
    it('应该成功获取用户资料', async () => {
      const result = await userAPI.getUserProfile()

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
      expect(result.data).toHaveProperty('username')
      expect(result.data).toHaveProperty('email')
      expect(result.data).toHaveProperty('phone')
      expect(result.data).toHaveProperty('avatar')
      expect(result.data).toHaveProperty('role')
      expect(result.data).toHaveProperty('createdAt')
      expect(result.data).toHaveProperty('lastLoginAt')
      expect(result.data).toHaveProperty('loginCount')
    })

    it('应该处理未授权访问', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('未授权访问')))
        })
      )

      const result = await userAPI.getUserProfile()

      expect(result.success).toBe(false)
      expect(result.message).toBe('未授权访问')
    })

    it('应该处理用户不存在', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json(mockApiResponse.error('用户不存在')))
        })
      )

      const result = await userAPI.getUserProfile()

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })

    it('应该发送正确的Authorization头', async () => {
      const token = 'test-token'
      localStorage.setItem('auth_token', token)

      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          const authHeader = req.headers.get('Authorization')
          expect(authHeader).toBe(`Bearer ${token}`)
          
          return res(ctx.json(mockApiResponse.success({
            id: 1,
            username: 'testuser'
          })))
        })
      )

      await userAPI.getUserProfile()
    })
  })

  describe('updateUserProfile', () => {
    const updateData = {
      email: mockFormData.profileUpdate.email,
      phone: mockFormData.profileUpdate.phone,
      nickname: mockFormData.profileUpdate.nickname
    }

    it('应该成功更新用户资料', async () => {
      const result = await userAPI.updateUserProfile(updateData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('更新成功')
      expect(result.data).toHaveProperty('id')
      expect(result.data).toHaveProperty('username')
      expect(result.data.email).toBe(updateData.email)
      expect(result.data.phone).toBe(updateData.phone)
    })

    it('应该处理邮箱已被使用', async () => {
      server.use(
        rest.put('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(409), ctx.json(mockApiResponse.error('邮箱已被使用')))
        })
      )

      const result = await userAPI.updateUserProfile({
        ...updateData,
        email: 'existing@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱已被使用')
    })

    it('应该处理手机号已被使用', async () => {
      server.use(
        rest.put('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(409), ctx.json(mockApiResponse.error('手机号已被使用')))
        })
      )

      const result = await userAPI.updateUserProfile({
        ...updateData,
        phone: '13800000000'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('手机号已被使用')
    })

    it('应该验证请求参数', async () => {
      server.use(
        rest.put('/api/user/profile', async (req, res, ctx) => {
          const body = await req.json()
          
          expect(body).toEqual(updateData)
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await userAPI.updateUserProfile(updateData)
    })

    it('应该处理无效的邮箱格式', async () => {
      server.use(
        rest.put('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('邮箱格式无效')))
        })
      )

      const result = await userAPI.updateUserProfile({
        ...updateData,
        email: 'invalid-email'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱格式无效')
    })

    it('应该处理无效的手机号格式', async () => {
      server.use(
        rest.put('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('手机号格式无效')))
        })
      )

      const result = await userAPI.updateUserProfile({
        ...updateData,
        phone: '123'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('手机号格式无效')
    })
  })

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: mockFormData.passwordChange.currentPassword,
      newPassword: mockFormData.passwordChange.newPassword,
      confirmPassword: mockFormData.passwordChange.confirmPassword
    }

    it('应该成功修改密码', async () => {
      const result = await userAPI.changePassword(passwordData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('密码修改成功')
    })

    it('应该处理当前密码错误', async () => {
      server.use(
        rest.put('/api/user/password', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('当前密码错误')))
        })
      )

      const result = await userAPI.changePassword({
        ...passwordData,
        currentPassword: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('当前密码错误')
    })

    it('应该处理新密码强度不足', async () => {
      server.use(
        rest.put('/api/user/password', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('密码强度不足')))
        })
      )

      const result = await userAPI.changePassword({
        ...passwordData,
        newPassword: '123'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('密码强度不足')
    })

    it('应该处理密码确认不匹配', async () => {
      server.use(
        rest.put('/api/user/password', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('密码确认不匹配')))
        })
      )

      const result = await userAPI.changePassword({
        ...passwordData,
        confirmPassword: 'different'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('密码确认不匹配')
    })

    it('应该验证请求参数', async () => {
      server.use(
        rest.put('/api/user/password', async (req, res, ctx) => {
          const body = await req.json()
          
          expect(body).toEqual({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await userAPI.changePassword(passwordData)
    })
  })

  describe('uploadAvatar', () => {
    it('应该成功上传头像', async () => {
      const file = mockFileObject.image()
      const result = await userAPI.uploadAvatar(file)

      expect(result.success).toBe(true)
      expect(result.message).toBe('头像上传成功')
      expect(result.data).toHaveProperty('avatarUrl')
      expect(result.data.avatarUrl).toMatch(/^https?:\/\//)
    })

    it('应该处理文件大小超限', async () => {
      server.use(
        rest.post('/api/user/avatar', (req, res, ctx) => {
          return res(ctx.status(413), ctx.json(mockApiResponse.error('文件大小超过限制')))
        })
      )

      const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      })

      const result = await userAPI.uploadAvatar(largeFile)

      expect(result.success).toBe(false)
      expect(result.message).toBe('文件大小超过限制')
    })

    it('应该处理不支持的文件类型', async () => {
      server.use(
        rest.post('/api/user/avatar', (req, res, ctx) => {
          return res(ctx.status(415), ctx.json(mockApiResponse.error('不支持的文件类型')))
        })
      )

      const textFile = new File(['text'], 'file.txt', {
        type: 'text/plain'
      })

      const result = await userAPI.uploadAvatar(textFile)

      expect(result.success).toBe(false)
      expect(result.message).toBe('不支持的文件类型')
    })

    it('应该发送FormData格式的请求', async () => {
      server.use(
        rest.post('/api/user/avatar', async (req, res, ctx) => {
          const contentType = req.headers.get('Content-Type')
          expect(contentType).toMatch(/^multipart\/form-data/)
          
          return res(ctx.json(mockApiResponse.success({
            avatarUrl: 'https://example.com/avatar.jpg'
          })))
        })
      )

      const file = mockFileObject.image()
      await userAPI.uploadAvatar(file)
    })

    it('应该处理上传失败', async () => {
      server.use(
        rest.post('/api/user/avatar', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('上传失败')))
        })
      )

      const file = mockFileObject.image()
      const result = await userAPI.uploadAvatar(file)

      expect(result.success).toBe(false)
      expect(result.message).toBe('上传失败')
    })
  })

  describe('getUserList', () => {
    const queryParams = {
      page: 1,
      pageSize: 10,
      username: 'test',
      role: 'user',
      status: 'active'
    }

    it('应该成功获取用户列表（管理员）', async () => {
      const result = await userAPI.getUserList(queryParams)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('users')
      expect(result.data).toHaveProperty('total')
      expect(result.data).toHaveProperty('page')
      expect(result.data).toHaveProperty('pageSize')
      expect(Array.isArray(result.data.users)).toBe(true)
      expect(result.data.users.length).toBeGreaterThan(0)
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.get('/api/user/list', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await userAPI.getUserList(queryParams)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该正确传递查询参数', async () => {
      server.use(
        rest.get('/api/user/list', (req, res, ctx) => {
          const url = new URL(req.url)
          expect(url.searchParams.get('page')).toBe('1')
          expect(url.searchParams.get('pageSize')).toBe('10')
          expect(url.searchParams.get('username')).toBe('test')
          expect(url.searchParams.get('role')).toBe('user')
          expect(url.searchParams.get('status')).toBe('active')
          
          return res(ctx.json(mockApiResponse.success({
            users: [],
            total: 0,
            page: 1,
            pageSize: 10
          })))
        })
      )

      await userAPI.getUserList(queryParams)
    })

    it('应该处理空查询参数', async () => {
      server.use(
        rest.get('/api/user/list', (req, res, ctx) => {
          const url = new URL(req.url)
          expect(url.searchParams.get('page')).toBe('1')
          expect(url.searchParams.get('pageSize')).toBe('10')
          
          return res(ctx.json(mockApiResponse.success({
            users: [],
            total: 0,
            page: 1,
            pageSize: 10
          })))
        })
      )

      await userAPI.getUserList()
    })

    it('应该处理无效的分页参数', async () => {
      server.use(
        rest.get('/api/user/list', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('无效的分页参数')))
        })
      )

      const result = await userAPI.getUserList({
        page: -1,
        pageSize: 0
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('无效的分页参数')
    })
  })

  describe('getUserStats', () => {
    it('应该成功获取用户统计信息', async () => {
      const result = await userAPI.getUserStats()

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('totalUsers')
      expect(result.data).toHaveProperty('activeUsers')
      expect(result.data).toHaveProperty('newUsersToday')
      expect(result.data).toHaveProperty('userGrowthRate')
      expect(result.data).toHaveProperty('roleDistribution')
      expect(result.data).toHaveProperty('loginStats')
      expect(typeof result.data.totalUsers).toBe('number')
      expect(typeof result.data.activeUsers).toBe('number')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.get('/api/user/stats', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await userAPI.getUserStats()

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理统计数据获取失败', async () => {
      server.use(
        rest.get('/api/user/stats', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('统计数据获取失败')))
        })
      )

      const result = await userAPI.getUserStats()

      expect(result.success).toBe(false)
      expect(result.message).toBe('统计数据获取失败')
    })
  })

  describe('deleteUser', () => {
    it('应该成功删除用户（管理员）', async () => {
      const userId = 123
      const result = await userAPI.deleteUser(userId)

      expect(result.success).toBe(true)
      expect(result.message).toBe('用户删除成功')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.delete('/api/user/:id', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await userAPI.deleteUser(123)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理用户不存在', async () => {
      server.use(
        rest.delete('/api/user/:id', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json(mockApiResponse.error('用户不存在')))
        })
      )

      const result = await userAPI.deleteUser(999)

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })

    it('应该处理删除自己的账户', async () => {
      server.use(
        rest.delete('/api/user/:id', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('不能删除自己的账户')))
        })
      )

      const result = await userAPI.deleteUser(1) // 假设当前用户ID为1

      expect(result.success).toBe(false)
      expect(result.message).toBe('不能删除自己的账户')
    })

    it('应该发送正确的用户ID', async () => {
      const userId = 456
      server.use(
        rest.delete('/api/user/:id', (req, res, ctx) => {
          expect(req.params.id).toBe(userId.toString())
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await userAPI.deleteUser(userId)
    })
  })

  describe('updateUserStatus', () => {
    it('应该成功更新用户状态', async () => {
      const userId = 123
      const status = 'inactive'
      const result = await userAPI.updateUserStatus(userId, status)

      expect(result.success).toBe(true)
      expect(result.message).toBe('用户状态更新成功')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.put('/api/user/:id/status', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await userAPI.updateUserStatus(123, 'inactive')

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理无效的状态值', async () => {
      server.use(
        rest.put('/api/user/:id/status', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('无效的状态值')))
        })
      )

      const result = await userAPI.updateUserStatus(123, 'invalid')

      expect(result.success).toBe(false)
      expect(result.message).toBe('无效的状态值')
    })

    it('应该发送正确的参数', async () => {
      const userId = 789
      const status = 'active'
      
      server.use(
        rest.put('/api/user/:id/status', async (req, res, ctx) => {
          expect(req.params.id).toBe(userId.toString())
          const body = await req.json()
          expect(body.status).toBe(status)
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await userAPI.updateUserStatus(userId, status)
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res.networkError('网络连接失败')
        })
      )

      await expect(userAPI.getUserProfile()).rejects.toThrow()
    })

    it('应该处理服务器错误', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('服务器内部错误')))
        })
      )

      const result = await userAPI.getUserProfile()

      expect(result.success).toBe(false)
      expect(result.message).toBe('服务器内部错误')
    })

    it('应该处理请求超时', async () => {
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(ctx.delay(10000)) // 10秒延迟
        })
      )

      // 模拟超时
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockImplementation(() => 
        Promise.reject(new Error('Request timeout'))
      )

      await expect(userAPI.getUserProfile()).rejects.toThrow()

      global.fetch = originalFetch
    })
  })
})