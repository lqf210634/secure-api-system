import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import { createTestStore, mockApiResponse, resetAllMocks } from '@/test/utils'
import LoginForm from '@/components/LoginForm'
import RegisterForm from '@/components/RegisterForm'
import UserProfile from '@/components/UserProfile'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock antd message
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: mockMessage
  }
})

// 测试包装器组件
const TestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </BrowserRouter>
  </Provider>
)

describe('认证功能集成测试', () => {
  beforeEach(() => {
    resetAllMocks()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('完整登录流程', () => {
    it('应该完成完整的登录流程', async () => {
      const user = userEvent.setup()
      const store = createTestStore()
      
      render(
        <TestWrapper store={store}>
          <Login />
        </TestWrapper>
      )

      // 1. 页面应该显示登录表单
      expect(screen.getByText('用户登录')).toBeInTheDocument()
      expect(screen.getByLabelText('用户名')).toBeInTheDocument()
      expect(screen.getByLabelText('密码')).toBeInTheDocument()

      // 2. 验证码应该自动加载
      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      // 3. 填写登录表单
      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 4. 提交登录表单
      await user.click(screen.getByRole('button', { name: '登录' }))

      // 5. 验证登录成功
      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })

      // 6. 验证Redux状态更新
      const state = store.getState()
      expect(state.auth.isAuthenticated).toBe(true)
      expect(state.auth.user).toBeTruthy()
      expect(state.auth.token).toBeTruthy()
    })

    it('应该处理登录失败', async () => {
      const user = userEvent.setup()
      
      // 模拟登录失败
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('用户名或密码错误')))
        })
      )

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      // 等待验证码加载
      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      // 填写错误的登录信息
      await user.type(screen.getByLabelText('用户名'), 'wronguser')
      await user.type(screen.getByLabelText('密码'), 'wrongpassword')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 提交表单
      await user.click(screen.getByRole('button', { name: '登录' }))

      // 验证错误消息
      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('用户名或密码错误')
      })
    })

    it('应该处理验证码错误', async () => {
      const user = userEvent.setup()
      
      // 模拟验证码错误
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('验证码错误')))
        })
      )

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      // 填写正确的用户名密码，错误的验证码
      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'WRONG')

      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('验证码错误')
      })

      // 验证码应该自动刷新
      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })
    })
  })

  describe('完整注册流程', () => {
    it('应该完成完整的注册流程', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      // 等待验证码加载
      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      // 填写注册表单
      await user.type(screen.getByLabelText('用户名'), 'newuser')
      await user.type(screen.getByLabelText('密码'), 'Password123!')
      await user.type(screen.getByLabelText('确认密码'), 'Password123!')
      await user.type(screen.getByLabelText('邮箱'), 'newuser@example.com')
      await user.type(screen.getByLabelText('手机号'), '13800138000')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 提交注册表单
      await user.click(screen.getByRole('button', { name: '注册' }))

      // 验证注册成功
      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('注册成功')
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('应该处理用户名已存在', async () => {
      const user = userEvent.setup()
      
      // 模拟用户名已存在
      server.use(
        rest.post('/api/auth/register', (req, res, ctx) => {
          return res(ctx.status(409), ctx.json(mockApiResponse.error('用户名已存在')))
        })
      )

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      // 填写已存在的用户名
      await user.type(screen.getByLabelText('用户名'), 'existinguser')
      await user.type(screen.getByLabelText('密码'), 'Password123!')
      await user.type(screen.getByLabelText('确认密码'), 'Password123!')
      await user.type(screen.getByLabelText('邮箱'), 'test@example.com')
      await user.type(screen.getByLabelText('手机号'), '13800138000')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      await user.click(screen.getByRole('button', { name: '注册' }))

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('用户名已存在')
      })
    })

    it('应该验证密码强度', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      )

      // 输入弱密码
      await user.type(screen.getByLabelText('密码'), '123')

      // 应该显示密码强度提示
      await waitFor(() => {
        expect(screen.getByText(/密码强度/)).toBeInTheDocument()
      })

      // 输入强密码
      await user.clear(screen.getByLabelText('密码'))
      await user.type(screen.getByLabelText('密码'), 'StrongPassword123!')

      await waitFor(() => {
        expect(screen.getByText(/强/)).toBeInTheDocument()
      })
    })
  })

  describe('用户资料管理流程', () => {
    it('应该完成用户资料更新流程', async () => {
      const user = userEvent.setup()
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            phone: '13800138000',
            avatar: null,
            role: 'user'
          },
          token: 'mock-token'
        }
      })

      render(
        <TestWrapper store={store}>
          <UserProfile />
        </TestWrapper>
      )

      // 等待用户数据加载
      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      })

      // 修改邮箱
      const emailInput = screen.getByLabelText('邮箱')
      await user.clear(emailInput)
      await user.type(emailInput, 'newemail@example.com')

      // 修改手机号
      const phoneInput = screen.getByLabelText('手机号')
      await user.clear(phoneInput)
      await user.type(phoneInput, '13900139000')

      // 保存更改
      await user.click(screen.getByRole('button', { name: '保存' }))

      // 验证更新成功
      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('更新成功')
      })
    })

    it('应该完成头像上传流程', async () => {
      const user = userEvent.setup()
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            avatar: null
          },
          token: 'mock-token'
        }
      })

      render(
        <TestWrapper store={store}>
          <UserProfile />
        </TestWrapper>
      )

      // 创建模拟文件
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

      // 找到文件上传组件
      const uploadInput = screen.getByLabelText(/上传头像/)
      
      // 模拟文件上传
      await user.upload(uploadInput, file)

      // 验证上传成功
      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('头像上传成功')
      })
    })
  })

  describe('认证状态管理', () => {
    it('应该正确处理令牌验证', async () => {
      const store = createTestStore()
      
      // 模拟本地存储中有令牌
      localStorage.setItem('auth_token', 'valid-token')
      localStorage.setItem('auth_user', JSON.stringify({
        id: 1,
        username: 'testuser'
      }))

      render(
        <TestWrapper store={store}>
          <Dashboard />
        </TestWrapper>
      )

      // 应该自动验证令牌并加载用户信息
      await waitFor(() => {
        const state = store.getState()
        expect(state.auth.isAuthenticated).toBe(true)
      })
    })

    it('应该处理令牌过期', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          token: 'expired-token'
        }
      })

      // 模拟令牌过期
      server.use(
        rest.post('/api/auth/verify', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('令牌已过期')))
        })
      )

      render(
        <TestWrapper store={store}>
          <Dashboard />
        </TestWrapper>
      )

      // 应该自动登出并跳转到登录页
      await waitFor(() => {
        const state = store.getState()
        expect(state.auth.isAuthenticated).toBe(false)
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('应该正确处理登出流程', async () => {
      const user = userEvent.setup()
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          token: 'valid-token'
        }
      })

      render(
        <TestWrapper store={store}>
          <Dashboard />
        </TestWrapper>
      )

      // 点击登出按钮
      const logoutButton = screen.getByRole('button', { name: /登出/ })
      await user.click(logoutButton)

      // 验证登出成功
      await waitFor(() => {
        const state = store.getState()
        expect(state.auth.isAuthenticated).toBe(false)
        expect(state.auth.user).toBeNull()
        expect(state.auth.token).toBeNull()
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('权限控制', () => {
    it('应该正确处理管理员权限', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'admin',
            role: 'admin'
          },
          token: 'admin-token'
        }
      })

      render(
        <TestWrapper store={store}>
          <Dashboard />
        </TestWrapper>
      )

      // 管理员应该能看到管理功能
      await waitFor(() => {
        expect(screen.getByText(/用户管理/)).toBeInTheDocument()
        expect(screen.getByText(/安全审计/)).toBeInTheDocument()
      })
    })

    it('应该正确处理普通用户权限', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 2,
            username: 'user',
            role: 'user'
          },
          token: 'user-token'
        }
      })

      render(
        <TestWrapper store={store}>
          <Dashboard />
        </TestWrapper>
      )

      // 普通用户不应该看到管理功能
      await waitFor(() => {
        expect(screen.queryByText(/用户管理/)).not.toBeInTheDocument()
        expect(screen.queryByText(/安全审计/)).not.toBeInTheDocument()
      })
    })

    it('应该处理未授权访问', async () => {
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <Dashboard />
        </TestWrapper>
      )

      // 未登录用户应该被重定向到登录页
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('错误处理和恢复', () => {
    it('应该处理网络错误', async () => {
      const user = userEvent.setup()

      // 模拟网络错误
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res.networkError('网络连接失败')
        })
      )

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      await user.click(screen.getByRole('button', { name: '登录' }))

      // 应该显示网络错误消息
      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith(expect.stringContaining('网络'))
      })
    })

    it('应该处理服务器错误', async () => {
      const user = userEvent.setup()

      // 模拟服务器错误
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('服务器内部错误')))
        })
      )

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('服务器内部错误')
      })
    })

    it('应该支持重试机制', async () => {
      const user = userEvent.setup()
      let attemptCount = 0

      // 第一次失败，第二次成功
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          attemptCount++
          if (attemptCount === 1) {
            return res(ctx.status(500), ctx.json(mockApiResponse.error('服务器错误')))
          }
          return res(ctx.json(mockApiResponse.success({
            token: 'mock-token',
            user: { username: 'testuser' }
          })))
        })
      )

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 第一次尝试
      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('服务器错误')
      })

      // 重试
      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      })
    })
  })
})