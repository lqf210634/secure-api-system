import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createAuthenticatedStore, mockFormData, mockApiResponse, createMockImageFile } from '@/test/utils'
import UserProfile from '@/components/UserProfile'
import * as userAPI from '@/api/user'

// Mock API
vi.mock('@/api/user')
const mockUserAPI = vi.mocked(userAPI)

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

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('UserProfile', () => {
  const user = userEvent.setup()
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phone: '13800138000',
    nickname: '测试用户',
    avatar: 'https://example.com/avatar.jpg',
    roles: ['USER'],
    createdAt: '2023-01-01T00:00:00Z',
    lastLoginAt: '2023-12-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserAPI.getUserProfile.mockResolvedValue({
      success: true,
      data: mockUser
    })
  })

  it('应该正确渲染用户资料', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUser.username)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.phone)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.nickname)).toBeInTheDocument()
    })
  })

  it('应该在组件挂载时获取用户资料', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
  })

  it('应该显示用户头像', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      const avatar = screen.getByRole('img', { name: /用户头像/ })
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', mockUser.avatar)
    })
  })

  it('应该验证邮箱格式', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    const emailInput = screen.getByDisplayValue(mockUser.email)
    await user.clear(emailInput)
    await user.type(emailInput, 'invalid-email')
    
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument()
    })
  })

  it('应该验证手机号格式', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    const phoneInput = screen.getByDisplayValue(mockUser.phone)
    await user.clear(phoneInput)
    await user.type(phoneInput, '123456')
    
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的手机号/)).toBeInTheDocument()
    })
  })

  it('应该成功更新用户资料', async () => {
    mockUserAPI.updateUserProfile.mockResolvedValue(mockApiResponse.success())
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 修改资料
    const emailInput = screen.getByDisplayValue(mockUser.email)
    const nicknameInput = screen.getByDisplayValue(mockUser.nickname)
    
    await user.clear(emailInput)
    await user.type(emailInput, mockFormData.profile.email)
    
    await user.clear(nicknameInput)
    await user.type(nicknameInput, mockFormData.profile.nickname)
    
    // 保存
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockUserAPI.updateUserProfile).toHaveBeenCalledWith({
        email: mockFormData.profile.email,
        phone: mockUser.phone,
        nickname: mockFormData.profile.nickname
      })
    })
    
    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith('资料更新成功')
    })
  })

  it('应该处理更新失败', async () => {
    mockUserAPI.updateUserProfile.mockResolvedValue(mockApiResponse.error('更新失败'))
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 修改资料
    const emailInput = screen.getByDisplayValue(mockUser.email)
    await user.clear(emailInput)
    await user.type(emailInput, 'newemail@example.com')
    
    // 保存
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('更新失败')
    })
  })

  it('应该支持头像上传', async () => {
    mockUserAPI.uploadAvatar.mockResolvedValue({
      success: true,
      data: { avatarUrl: 'https://example.com/new-avatar.jpg' }
    })
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 模拟文件上传
    const fileInput = screen.getByLabelText(/上传头像/)
    const file = createMockImageFile('avatar.jpg', 1024)
    
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(mockUserAPI.uploadAvatar).toHaveBeenCalled()
    })
    
    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith('头像上传成功')
    })
  })

  it('应该验证头像文件大小', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 模拟大文件上传
    const fileInput = screen.getByLabelText(/上传头像/)
    const largeFile = createMockImageFile('large-avatar.jpg', 5 * 1024 * 1024) // 5MB
    
    await user.upload(fileInput, largeFile)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('文件大小不能超过2MB')
    })
  })

  it('应该验证头像文件类型', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 模拟错误文件类型
    const fileInput = screen.getByLabelText(/上传头像/)
    const textFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    
    await user.upload(fileInput, textFile)
    
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('只支持JPG、PNG格式的图片')
    })
  })

  it('应该显示加载状态', async () => {
    // 模拟延迟响应
    mockUserAPI.getUserProfile.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ success: true, data: mockUser }), 1000)
      )
    )
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('应该处理获取资料失败', async () => {
    mockUserAPI.getUserProfile.mockResolvedValue(mockApiResponse.error('获取资料失败'))
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/获取资料失败/)).toBeInTheDocument()
    })
  })

  it('应该支持重置表单', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 修改资料
    const emailInput = screen.getByDisplayValue(mockUser.email)
    await user.clear(emailInput)
    await user.type(emailInput, 'modified@example.com')
    
    // 重置
    const resetButton = screen.getByRole('button', { name: /重置/ })
    await user.click(resetButton)
    
    // 验证重置后的值
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument()
  })

  it('应该显示用户统计信息', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/注册时间/)).toBeInTheDocument()
      expect(screen.getByText(/最后登录/)).toBeInTheDocument()
      expect(screen.getByText(/用户角色/)).toBeInTheDocument()
    })
  })

  it('应该处理网络错误', async () => {
    mockUserAPI.getUserProfile.mockRejectedValue(new Error('网络错误'))
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/网络错误，请稍后重试/)).toBeInTheDocument()
    })
  })

  it('应该在保存时显示加载状态', async () => {
    // 模拟延迟响应
    mockUserAPI.updateUserProfile.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve(mockApiResponse.success()), 1000)
      )
    )
    
    const store = createAuthenticatedStore()
    renderWithProviders(<UserProfile />, { store })
    
    await waitFor(() => {
      expect(mockUserAPI.getUserProfile).toHaveBeenCalled()
    })
    
    // 修改资料
    const emailInput = screen.getByDisplayValue(mockUser.email)
    await user.clear(emailInput)
    await user.type(emailInput, 'newemail@example.com')
    
    // 保存
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)
    
    // 检查加载状态
    expect(screen.getByRole('button', { name: /保存中/ })).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })
})