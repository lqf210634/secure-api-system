import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { store } from '@/store'
import type { RootState } from '@/store'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/store/slices/authSlice'
import userReducer from '@/store/slices/userSlice'

// 创建测试用的store
export const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      user: userReducer,
    },
    preloadedState,
  })
}

// 自定义渲染函数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>
  store?: ReturnType<typeof createTestStore>
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ConfigProvider locale={zhCN}>
            {children}
          </ConfigProvider>
        </BrowserRouter>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// 模拟用户认证状态
export const mockAuthenticatedUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  roles: ['USER'],
  token: 'mock-jwt-token'
}

export const mockAdminUser = {
  id: 2,
  username: 'admin',
  email: 'admin@example.com',
  roles: ['ADMIN', 'USER'],
  token: 'mock-admin-token'
}

// 创建已认证状态的store
export const createAuthenticatedStore = (user = mockAuthenticatedUser) => {
  return createTestStore({
    auth: {
      isAuthenticated: true,
      user,
      token: user.token,
      loading: false,
      error: null
    }
  })
}

// 创建管理员状态的store
export const createAdminStore = () => {
  return createAuthenticatedStore(mockAdminUser)
}

// 等待异步操作完成
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// 模拟文件对象
export const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  })
  return file
}

// 模拟图片文件
export const createMockImageFile = (name = 'test.jpg', size = 1024) => {
  return createMockFile(name, size, 'image/jpeg')
}

// 模拟表单数据
export const mockFormData = {
  login: {
    username: 'testuser',
    password: 'password123',
    captcha: '1234',
    sessionId: 'test-session'
  },
  register: {
    username: 'newuser',
    password: 'newpassword123',
    email: 'newuser@example.com',
    phone: '13800138000',
    captcha: '1234',
    sessionId: 'test-session'
  },
  profile: {
    email: 'newemail@example.com',
    phone: '13900139000',
    nickname: '新昵称'
  },
  changePassword: {
    oldPassword: 'password123',
    newPassword: 'newpassword123',
    confirmPassword: 'newpassword123'
  }
}

// 模拟API响应
export const mockApiResponse = {
  success: (data?: any, message = '操作成功') => ({
    success: true,
    message,
    data
  }),
  error: (message = '操作失败', code = 400) => ({
    success: false,
    message,
    code
  })
}

// 模拟localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// 模拟sessionStorage
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// 重置所有mock
export const resetAllMocks = () => {
  vi.clearAllMocks()
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
  mockLocalStorage.clear.mockClear()
  
  mockSessionStorage.getItem.mockClear()
  mockSessionStorage.setItem.mockClear()
  mockSessionStorage.removeItem.mockClear()
  mockSessionStorage.clear.mockClear()
}

// 模拟路由导航
export const mockNavigate = vi.fn()

// 模拟antd的message
export const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn()
}

// 模拟antd的notification
export const mockNotification = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  open: vi.fn()
}