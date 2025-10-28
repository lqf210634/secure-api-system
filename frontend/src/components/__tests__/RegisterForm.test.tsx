import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFormData, mockApiResponse } from '@/test/utils'
import RegisterForm from '@/components/RegisterForm'
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

describe('RegisterForm', () => {
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

  it('应该正确渲染注册表单', async () => {
    renderWithProviders(<RegisterForm />)
    
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument()
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument()
    expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument()
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument()
    expect(screen.getByLabelText(/手机号/)).toBeInTheDocument()
    expect(screen.getByLabelText(/验证码/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /注册/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /刷新验证码/ })).toBeInTheDocument()
  })

  it('应该在组件挂载时获取验证码', async () => {
    renderWithProviders(<RegisterForm />)
    
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
  })

  it('应该验证必填字段', async () => {
    renderWithProviders(<RegisterForm />)
    
    const submitButton = screen.getByRole('button', { name: /注册/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/请输入用户名/)).toBeInTheDocument()
      expect(screen.getByText(/请输入密码/)).toBeInTheDocument()
      expect(screen.getByText(/请确认密码/)).toBeInTheDocument()
      expect(screen.getByText(/请输入邮箱/)).toBeInTheDocument()
      expect(screen.getByText(/请输入验证码/)).toBeInTheDocument()
    })
  })

  it('应该验证用户名格式', async () => {
    renderWithProviders(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText(/用户名/)
    
    // 测试过短用户名
    await user.type(usernameInput, 'ab')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/用户名长度必须在3-20个字符之间/)).toBeInTheDocument()
    })
    
    // 测试包含特殊字符
    await user.clear(usernameInput)
    await user.type(usernameInput, 'user@name')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/用户名只能包含字母、数字和下划线/)).toBeInTheDocument()
    })
  })

  it('应该验证密码强度', async () => {
    renderWithProviders(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^密码/)
    
    // 测试弱密码
    await user.type(passwordInput, '123456')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/密码必须包含字母和数字/)).toBeInTheDocument()
    })
  })

  it('应该验证密码确认', async () => {
    renderWithProviders(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^密码/)
    const confirmPasswordInput = screen.getByLabelText(/确认密码/)
    
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password456')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/两次输入的密码不一致/)).toBeInTheDocument()
    })
  })

  it('应该验证邮箱格式', async () => {
    renderWithProviders(<RegisterForm />)
    
    const emailInput = screen.getByLabelText(/邮箱/)
    
    await user.type(emailInput, 'invalid-email')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument()
    })
  })

  it('应该验证手机号格式', async () => {
    renderWithProviders(<RegisterForm />)
    
    const phoneInput = screen.getByLabelText(/手机号/)
    
    await user.type(phoneInput, '123456')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的手机号/)).toBeInTheDocument()
    })
  })

  it('应该成功提交注册表单', async () => {
    mockAuthAPI.register.mockResolvedValue(mockApiResponse.success())

    renderWithProviders(<RegisterForm />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/^密码/)
    const confirmPasswordInput = screen.getByLabelText(/确认密码/)
    const emailInput = screen.getByLabelText(/邮箱/)
    const phoneInput = screen.getByLabelText(/手机号/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.register.username)
    await user.type(passwordInput, mockFormData.register.password)
    await user.type(confirmPasswordInput, mockFormData.register.password)
    await user.type(emailInput, mockFormData.register.email)
    await user.type(phoneInput, mockFormData.register.phone)
    await user.type(captchaInput, mockFormData.register.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /注册/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuthAPI.register).toHaveBeenCalledWith({
        username: mockFormData.register.username,
        password: mockFormData.register.password,
        email: mockFormData.register.email,
        phone: mockFormData.register.phone,
        captcha: mockFormData.register.captcha,
        sessionId: 'test-session'
      })
    })
    
    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith('注册成功，请登录')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('应该处理用户名已存在错误', async () => {
    mockAuthAPI.register.mockResolvedValue(mockApiResponse.error('用户名已存在'))

    renderWithProviders(<RegisterForm />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/^密码/)
    const confirmPasswordInput = screen.getByLabelText(/确认密码/)
    const emailInput = screen.getByLabelText(/邮箱/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, 'existinguser')
    await user.type(passwordInput, mockFormData.register.password)
    await user.type(confirmPasswordInput, mockFormData.register.password)
    await user.type(emailInput, mockFormData.register.email)
    await user.type(captchaInput, mockFormData.register.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /注册/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('用户名已存在')
    })
  })

  it('应该处理邮箱已存在错误', async () => {
    mockAuthAPI.register.mockResolvedValue(mockApiResponse.error('邮箱已被注册'))

    renderWithProviders(<RegisterForm />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/^密码/)
    const confirmPasswordInput = screen.getByLabelText(/确认密码/)
    const emailInput = screen.getByLabelText(/邮箱/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.register.username)
    await user.type(passwordInput, mockFormData.register.password)
    await user.type(confirmPasswordInput, mockFormData.register.password)
    await user.type(emailInput, 'existing@example.com')
    await user.type(captchaInput, mockFormData.register.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /注册/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('邮箱已被注册')
    })
  })

  it('应该在提交时显示加载状态', async () => {
    // 模拟延迟响应
    mockAuthAPI.register.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve(mockApiResponse.success()), 1000)
      )
    )

    renderWithProviders(<RegisterForm />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/^密码/)
    const confirmPasswordInput = screen.getByLabelText(/确认密码/)
    const emailInput = screen.getByLabelText(/邮箱/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.register.username)
    await user.type(passwordInput, mockFormData.register.password)
    await user.type(confirmPasswordInput, mockFormData.register.password)
    await user.type(emailInput, mockFormData.register.email)
    await user.type(captchaInput, mockFormData.register.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /注册/ })
    await user.click(submitButton)
    
    // 检查加载状态
    expect(screen.getByRole('button', { name: /注册中/ })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('应该支持密码强度指示器', async () => {
    renderWithProviders(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^密码/)
    
    // 弱密码
    await user.type(passwordInput, '123')
    expect(screen.getByText(/弱/)).toBeInTheDocument()
    
    // 中等密码
    await user.clear(passwordInput)
    await user.type(passwordInput, 'password')
    expect(screen.getByText(/中/)).toBeInTheDocument()
    
    // 强密码
    await user.clear(passwordInput)
    await user.type(passwordInput, 'Password123!')
    expect(screen.getByText(/强/)).toBeInTheDocument()
  })

  it('应该处理验证码刷新', async () => {
    renderWithProviders(<RegisterForm />)
    
    const refreshButton = screen.getByRole('button', { name: /刷新验证码/ })
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalledTimes(2)
    })
  })

  it('应该处理网络错误', async () => {
    mockAuthAPI.register.mockRejectedValue(new Error('网络错误'))

    renderWithProviders(<RegisterForm />)
    
    // 等待验证码加载
    await waitFor(() => {
      expect(mockAuthAPI.getCaptcha).toHaveBeenCalled()
    })
    
    // 填写表单
    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/^密码/)
    const confirmPasswordInput = screen.getByLabelText(/确认密码/)
    const emailInput = screen.getByLabelText(/邮箱/)
    const captchaInput = screen.getByLabelText(/验证码/)
    
    await user.type(usernameInput, mockFormData.register.username)
    await user.type(passwordInput, mockFormData.register.password)
    await user.type(confirmPasswordInput, mockFormData.register.password)
    await user.type(emailInput, mockFormData.register.email)
    await user.type(captchaInput, mockFormData.register.captcha)
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: /注册/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('网络错误，请稍后重试')
    })
  })
})