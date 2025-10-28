import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFormData, mockApiResponse } from '@/test/utils'
import LoginForm from '@/components/LoginForm'
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
    useNavigate: () => mockNavigate
  }
})

describe('LoginForm', () => {
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

  it('应该正确渲染登录表单', async () => {
    renderWithProviders(<LoginForm />)
    
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument()
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument()
    expect(screen.getByLabelText(/验证码/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /刷新验证码/ })).toBeInTheDocument()
  })

  it('应该在组件挂载时获取验证码', async () => {
    renderWithProviders(<LoginForm />)
    
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
  })

  it('应该能够刷新验证码', async () => {
    renderWithProviders(<LoginForm />)
    
    const refreshButton = screen.getByRole('button', { name: /刷新验证码/ })
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalledTimes(2)
    })
  })

  it('应该验证必填字段', async () => {
    renderWithProviders(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/请输入用户名/)).toBeInTheDocument()
      expect(screen.getByText(/请输入密码/)).toBeInTheDocument()
      expect(screen.getByText(/请输入验证码/)).toBeInTheDocument()
    })
  })

  it('应该验证用户名格式', async () => {
    renderWithProviders(<LoginForm />)
    
    const usernameInput = screen.getByLabelText(/用户名/)
    await user.type(usernameInput, 'a')
    
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/用户名长度必须在3-20个字符之间/)).toBeInTheDocument()
    })
  })

  it('应该验证密码格式', async () => {
    renderWithProviders(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/密码/)
    await user.type(passwordInput, '123')
    
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/密码长度必须在6-20个字符之间/)).toBeInTheDocument()
    })
  })

  it('应该成功提交登录表单', async () => {
    mockAuthAPI.login.mockResolvedValue(mockApiResponse.success({
      token: 'test-token',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER']
      }
    }))

    renderWithProviders(<LoginForm />)
    
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
      expect(mockAuthAPI.login).toHaveBeenCalledWith({
        username: mockFormData.login.username,
        password: mockFormData.login.password,
        captcha: mockFormData.login.captcha,
        sessionId: 'test-session'
      })
    })
    
    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith('登录成功')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('应该处理登录失败', async () => {
    mockAuthAPI.login.mockResolvedValue(mockApiResponse.error('用户名或密码错误'))

    renderWithProviders(<LoginForm />)
    
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

  it('应该处理验证码错误', async () => {
    mockAuthAPI.login.mockResolvedValue(mockApiResponse.error('验证码错误'))

    renderWithProviders(<LoginForm />)
    
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
    await user.type(captchaInput, 'wrong')
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('验证码错误')
      // 验证码错误后应该自动刷新验证码
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalledTimes(2)
    })
  })

  it('应该在提交时显示加载状态', async () => {
    // 模拟延迟响应
    mockAuthAPI.login.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve(mockApiResponse.success()), 1000)
      )
    )

    renderWithProviders(<LoginForm />)
    
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
    
    // 检查加载状态
    expect(screen.getByRole('button', { name: /登录中/ })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('应该支持键盘导航', async () => {
    renderWithProviders(<LoginForm />)
    
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/密码/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    // Tab键导航
    await user.tab()
    expect(usernameInput).toHaveFocus()
    
    await user.tab()
    expect(passwordInput).toHaveFocus()
    
    await user.tab()
    expect(captchaInput).toHaveFocus()
  })

  it('应该处理网络错误', async () => {
    mockAuthAPI.login.mockRejectedValue(new Error('网络错误'))

    renderWithProviders(<LoginForm />)
    
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
      expect(mockMessage.error).toHaveBeenCalledWith('网络错误，请稍后重试')
    })
  })
})