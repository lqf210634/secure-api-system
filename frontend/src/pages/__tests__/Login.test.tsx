import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFormData, mockApiResponse } from '@/test/utils'
import Login from '@/pages/Login'
import * as authAPI from '@/api/auth'

// Mock API
vi.mock('@/api/auth')
const mockAuthAPI = vi.mocked(authAPI)

// Mock antd message
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn()
}
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: mockMessage
  }
})

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
  }
})

describe('Login Page', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthAPI.getCaptcha.mockResolvedValue({
      success: true,
      data: {
        sessionId: 'test-session',
        captchaImage: 'data:image/png;base64,test'
      }
    })
  })

  it('应该正确渲染登录页面', async () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByText(/安全API系统/)).toBeInTheDocument()
    expect(screen.getByText(/欢迎回来/)).toBeInTheDocument()
    expect(screen.getByText(/请登录您的账户/)).toBeInTheDocument()
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument()
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument()
    expect(screen.getByLabelText(/验证码/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument()
    expect(screen.getByText(/还没有账户/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /立即注册/ })).toBeInTheDocument()
  })

  it('应该显示系统Logo和标题', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByAltText(/系统Logo/)).toBeInTheDocument()
    expect(screen.getByText(/安全API系统/)).toBeInTheDocument()
  })

  it('应该显示登录表单', async () => {
    renderWithProviders(<Login />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    expect(screen.getByRole('form')).toBeInTheDocument()
  })

  it('应该成功登录并跳转', async () => {
    mockAuthAPI.login.mockResolvedValue(mockApiResponse.success({
      token: 'test-token',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER']
      }
    }))

    renderWithProviders(<Login />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/密码/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.login.username)
    await user.type(passwordInput, mockFormData.login.password)
    await user.type(captchaInput, mockFormData.login.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('应该处理登录失败', async () => {
    mockAuthAPI.login.mockResolvedValue(mockApiResponse.error('用户名或密码错误'))

    renderWithProviders(<Login />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/密码/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.login.username)
    await user.type(passwordInput, 'wrongpassword')
    await user.type(captchaInput, mockFormData.login.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('用户名或密码错误')
    })
  })

  it('应该显示注册链接', () => {
    renderWithProviders(<Login />)
    
    const registerLink = screen.getByRole('link', { name: /立即注册/ })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('应该显示忘记密码链接', () => {
    renderWithProviders(<Login />)
    
    const forgotPasswordLink = screen.getByRole('link', { name: /忘记密码/ })
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
  })

  it('应该支持记住我功能', async () => {
    renderWithProviders(<Login />)
    
    const rememberCheckbox = screen.getByLabelText(/记住我/)
    expect(rememberCheckbox).toBeInTheDocument()
    
    await user.click(rememberCheckbox)
    expect(rememberCheckbox).toBeChecked()
  })

  it('应该显示验证码图片', async () => {
    renderWithProviders(<Login />)
    
    await waitFor(() => {
      const captchaImage = screen.getByAltText(/验证码/)
      expect(captchaImage).toBeInTheDocument()
      expect(captchaImage).toHaveAttribute('src', 'data:image/png;base64,test')
    })
  })

  it('应该支持刷新验证码', async () => {
    renderWithProviders(<Login />)
    
    // 等待初始验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalledTimes(1)
    })
    
    const refreshButton = screen.getByRole('button', { name: /刷新验证码/ })
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalledTimes(2)
    })
  })

  it('应该显示页面标题', () => {
    renderWithProviders(<Login />)
    
    expect(document.title).toBe('登录 - 安全API系统')
  })

  it('应该在移动端正确显示', () => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    renderWithProviders(<Login />)
    
    // 验证响应式布局
    const container = screen.getByTestId('login-container')
    expect(container).toHaveClass('mobile-layout')
  })

  it('应该处理键盘快捷键', async () => {
    renderWithProviders(<Login />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/密码/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.login.username)
    await user.type(passwordInput, mockFormData.login.password)
    await user.type(captchaInput, mockFormData.login.captcha)
    
    // 按Enter键提交
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockAuthAPI.login).toHaveBeenCalled()
    })
  })

  it('应该显示安全提示', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByText(/为了您的账户安全/)).toBeInTheDocument()
    expect(screen.getByText(/请不要在公共场所登录/)).toBeInTheDocument()
  })

  it('应该处理验证码加载失败', async () => {
    mockAuthAPI.getCaptcha.mockRejectedValue(new Error('验证码加载失败'))
    
    renderWithProviders(<Login />)
    
    await waitFor(() => {
      expect(screen.getByText(/验证码加载失败/)).toBeInTheDocument()
    })
  })

  it('应该支持社交登录', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByText(/其他登录方式/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /微信登录/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /QQ登录/ })).toBeInTheDocument()
  })
})