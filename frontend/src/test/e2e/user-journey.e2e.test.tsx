import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import { createTestStore, mockApiResponse, resetAllMocks } from '@/test/utils'
import App from '@/App'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'

// Mock react-router-dom navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock antd components
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

const mockNotification = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: mockMessage,
    notification: mockNotification
  }
})

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  LineElement: vi.fn(),
  PointElement: vi.fn(),
  ArcElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}))

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      Bar Chart
    </div>
  ),
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
  Pie: ({ data, options }) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      Pie Chart
    </div>
  )
}))

// 完整应用测试包装器
const E2ETestWrapper = ({ children, initialEntries = ['/'] }) => {
  const store = createTestStore()
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  )
}

describe('用户完整流程端到端测试', () => {
  beforeEach(() => {
    resetAllMocks()
    server.listen()
    // 清除本地存储
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('新用户注册到使用完整流程', () => {
    it('应该完成从注册到登录到使用的完整流程', async () => {
      const user = userEvent.setup()
      
      // 渲染应用，从登录页开始
      render(<E2ETestWrapper />)

      // 1. 在登录页点击注册链接
      expect(screen.getByText('用户登录')).toBeInTheDocument()
      const registerLink = screen.getByText('立即注册')
      await user.click(registerLink)

      // 应该导航到注册页
      expect(mockNavigate).toHaveBeenCalledWith('/register')

      // 重新渲染注册页
      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Register />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      // 2. 填写注册表单
      await waitFor(() => {
        expect(screen.getByText('用户注册')).toBeInTheDocument()
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'newuser123')
      await user.type(screen.getByLabelText('密码'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('确认密码'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('邮箱'), 'newuser@example.com')
      await user.type(screen.getByLabelText('手机号'), '13800138000')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 3. 提交注册
      await user.click(screen.getByRole('button', { name: '注册' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('注册成功')
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })

      // 4. 返回登录页并登录
      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByText('用户登录')).toBeInTheDocument()
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'newuser123')
      await user.type(screen.getByLabelText('密码'), 'StrongPassword123!')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 5. 登录成功
      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })

      // 6. 进入仪表板
      const authenticatedStore = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'newuser123',
            email: 'newuser@example.com',
            role: 'user'
          },
          token: 'mock-jwt-token'
        }
      })

      render(
        <Provider store={authenticatedStore}>
          <BrowserRouter>
            <ConfigProvider>
              <Dashboard />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      // 7. 验证仪表板内容
      await waitFor(() => {
        expect(screen.getByText('仪表板')).toBeInTheDocument()
        expect(screen.getByText('欢迎回来')).toBeInTheDocument()
      })

      // 8. 访问个人资料页面
      const profileLink = screen.getByText('个人资料')
      await user.click(profileLink)

      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    })
  })

  describe('管理员完整工作流程', () => {
    it('应该完成管理员登录到管理操作的完整流程', async () => {
      const user = userEvent.setup()

      // 1. 管理员登录
      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'admin')
      await user.type(screen.getByLabelText('密码'), 'admin123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 模拟管理员登录响应
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.json(mockApiResponse.success({
            token: 'admin-jwt-token',
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin'
            }
          })))
        })
      )

      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })

      // 2. 进入管理员仪表板
      const adminStore = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin'
          },
          token: 'admin-jwt-token'
        }
      })

      render(
        <Provider store={adminStore}>
          <BrowserRouter>
            <ConfigProvider>
              <Dashboard />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      // 3. 验证管理员功能可见
      await waitFor(() => {
        expect(screen.getByText('用户管理')).toBeInTheDocument()
        expect(screen.getByText('安全审计')).toBeInTheDocument()
        expect(screen.getByText('系统统计')).toBeInTheDocument()
      })

      // 4. 查看用户列表
      const userManagementButton = screen.getByText('用户管理')
      await user.click(userManagementButton)

      await waitFor(() => {
        expect(screen.getByText('用户列表')).toBeInTheDocument()
        expect(screen.getByText('testuser')).toBeInTheDocument()
      })

      // 5. 查看安全审计日志
      const auditButton = screen.getByText('安全审计')
      await user.click(auditButton)

      await waitFor(() => {
        expect(screen.getByText('审计日志')).toBeInTheDocument()
        expect(screen.getByText('LOGIN')).toBeInTheDocument()
      })

      // 6. 导出审计日志
      const exportButton = screen.getByText('导出日志')
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('导出成功')
      })
    })
  })

  describe('用户资料管理完整流程', () => {
    it('应该完成用户资料查看和更新的完整流程', async () => {
      const user = userEvent.setup()

      // 1. 已登录用户访问个人资料
      const userStore = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 2,
            username: 'testuser',
            email: 'test@example.com',
            phone: '13800138000',
            avatar: null,
            role: 'user'
          },
          token: 'user-jwt-token'
        }
      })

      render(
        <Provider store={userStore}>
          <BrowserRouter>
            <ConfigProvider>
              <Profile />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      // 2. 验证个人资料页面加载
      await waitFor(() => {
        expect(screen.getByText('个人资料')).toBeInTheDocument()
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('13800138000')).toBeInTheDocument()
      })

      // 3. 更新邮箱
      const emailInput = screen.getByLabelText('邮箱')
      await user.clear(emailInput)
      await user.type(emailInput, 'updated@example.com')

      // 4. 更新手机号
      const phoneInput = screen.getByLabelText('手机号')
      await user.clear(phoneInput)
      await user.type(phoneInput, '13900139000')

      // 5. 保存更改
      await user.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('更新成功')
      })

      // 6. 修改密码
      const changePasswordTab = screen.getByText('修改密码')
      await user.click(changePasswordTab)

      await user.type(screen.getByLabelText('当前密码'), 'oldpassword')
      await user.type(screen.getByLabelText('新密码'), 'NewPassword123!')
      await user.type(screen.getByLabelText('确认新密码'), 'NewPassword123!')

      await user.click(screen.getByRole('button', { name: '修改密码' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('密码修改成功')
      })

      // 7. 上传头像
      const avatarTab = screen.getByText('头像设置')
      await user.click(avatarTab)

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const uploadInput = screen.getByLabelText(/上传头像/)
      
      await user.upload(uploadInput, file)

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('头像上传成功')
      })
    })
  })

  describe('错误处理和恢复流程', () => {
    it('应该处理网络错误并允许重试', async () => {
      const user = userEvent.setup()
      let attemptCount = 0

      // 模拟网络不稳定
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          attemptCount++
          if (attemptCount <= 2) {
            return res.networkError('网络连接失败')
          }
          return res(ctx.json(mockApiResponse.success({
            token: 'mock-token',
            user: { username: 'testuser' }
          })))
        })
      )

      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 第一次尝试 - 失败
      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalled()
      })

      // 第二次尝试 - 失败
      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalled()
      })

      // 第三次尝试 - 成功
      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      })
    })

    it('应该处理会话过期并重新登录', async () => {
      const user = userEvent.setup()

      // 1. 用户已登录状态
      const expiredStore = createTestStore({
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'testuser'
          },
          token: 'expired-token'
        }
      })

      // 模拟令牌过期
      server.use(
        rest.get('/api/user/profile', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json(mockApiResponse.error('令牌已过期')))
        })
      )

      render(
        <Provider store={expiredStore}>
          <BrowserRouter>
            <ConfigProvider>
              <Profile />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      // 2. 访问需要认证的页面时，应该检测到令牌过期
      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('登录已过期，请重新登录')
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })

      // 3. 重新登录
      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByText('用户登录')).toBeInTheDocument()
      })

      // 用户重新输入凭据
      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      })
    })
  })

  describe('响应式设计测试', () => {
    it('应该在移动设备上正常工作', async () => {
      const user = userEvent.setup()

      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      })

      // 触发resize事件
      fireEvent(window, new Event('resize'))

      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      // 验证移动端布局
      await waitFor(() => {
        expect(screen.getByText('用户登录')).toBeInTheDocument()
        // 在移动端，某些元素可能会有不同的样式或布局
      })

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      // 测试移动端交互
      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      await user.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      })
    })
  })

  describe('性能和用户体验测试', () => {
    it('应该显示适当的加载状态', async () => {
      const user = userEvent.setup()

      // 模拟慢速网络
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.delay(2000), // 2秒延迟
            ctx.json(mockApiResponse.success({
              token: 'mock-token',
              user: { username: 'testuser' }
            }))
          )
        })
      )

      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      // 点击登录按钮
      const loginButton = screen.getByRole('button', { name: '登录' })
      await user.click(loginButton)

      // 验证加载状态
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /登录中/ })).toBeInTheDocument()
      })

      // 等待登录完成
      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      }, { timeout: 3000 })
    })

    it('应该正确处理并发请求', async () => {
      const user = userEvent.setup()

      render(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <ConfigProvider>
              <Login />
            </ConfigProvider>
          </BrowserRouter>
        </Provider>
      )

      await waitFor(() => {
        expect(screen.getByAltText('验证码')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('用户名'), 'testuser')
      await user.type(screen.getByLabelText('密码'), 'password123')
      await user.type(screen.getByLabelText('验证码'), 'ABCD')

      const loginButton = screen.getByRole('button', { name: '登录' })

      // 快速连续点击登录按钮
      await user.click(loginButton)
      await user.click(loginButton)
      await user.click(loginButton)

      // 应该只发送一个请求
      await waitFor(() => {
        expect(mockMessage.success).toHaveBeenCalledTimes(1)
      })
    })
  })
})