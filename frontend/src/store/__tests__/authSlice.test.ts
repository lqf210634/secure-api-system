import { describe, it, expect, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
  setToken
} from '@/store/slices/authSlice'
import type { AuthState } from '@/store/slices/authSlice'

// 创建测试store
const createTestStore = (preloadedState?: Partial<AuthState>) => {
  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        ...preloadedState
      }
    }
  })
}

describe('authSlice', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['USER'],
    avatar: 'https://example.com/avatar.jpg',
    nickname: '测试用户'
  }

  const mockToken = 'mock-jwt-token'

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const store = createTestStore()
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('登录流程', () => {
    it('应该处理登录开始', () => {
      const store = createTestStore()
      
      store.dispatch(loginStart())
      const state = store.getState().auth

      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('应该处理登录成功', () => {
      const store = createTestStore({ loading: true })
      
      store.dispatch(loginSuccess({ user: mockUser, token: mockToken }))
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('应该处理登录失败', () => {
      const errorMessage = '用户名或密码错误'
      const store = createTestStore({ loading: true })
      
      store.dispatch(loginFailure(errorMessage))
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('登出', () => {
    it('应该处理登出', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken
      })
      
      store.dispatch(logout())
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('错误处理', () => {
    it('应该清除错误', () => {
      const store = createTestStore({ error: '网络错误' })
      
      store.dispatch(clearError())
      const state = store.getState().auth

      expect(state.error).toBeNull()
    })
  })

  describe('用户信息更新', () => {
    it('应该更新用户信息', () => {
      const updatedUser = {
        ...mockUser,
        email: 'newemail@example.com',
        nickname: '新昵称'
      }
      
      const store = createTestStore({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken
      })
      
      store.dispatch(updateUser(updatedUser))
      const state = store.getState().auth

      expect(state.user).toEqual(updatedUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.token).toBe(mockToken)
    })

    it('应该在未登录时忽略用户更新', () => {
      const store = createTestStore()
      
      store.dispatch(updateUser(mockUser))
      const state = store.getState().auth

      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('令牌管理', () => {
    it('应该设置令牌', () => {
      const store = createTestStore()
      
      store.dispatch(setToken(mockToken))
      const state = store.getState().auth

      expect(state.token).toBe(mockToken)
    })

    it('应该清除令牌', () => {
      const store = createTestStore({ token: mockToken })
      
      store.dispatch(setToken(null))
      const state = store.getState().auth

      expect(state.token).toBeNull()
    })
  })

  describe('状态持久化', () => {
    it('应该从localStorage恢复状态', () => {
      // 模拟localStorage
      const mockLocalStorage = {
        getItem: vi.fn((key: string) => {
          if (key === 'auth_token') return mockToken
          if (key === 'auth_user') return JSON.stringify(mockUser)
          return null
        })
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      const store = createTestStore()
      
      // 触发状态恢复
      store.dispatch({ type: 'auth/restoreFromStorage' })
      const state = store.getState().auth

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_user')
    })

    it('应该处理无效的localStorage数据', () => {
      const mockLocalStorage = {
        getItem: vi.fn((key: string) => {
          if (key === 'auth_token') return 'invalid-token'
          if (key === 'auth_user') return 'invalid-json'
          return null
        })
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      const store = createTestStore()
      
      // 触发状态恢复
      store.dispatch({ type: 'auth/restoreFromStorage' })
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  })

  describe('选择器', () => {
    it('应该正确选择认证状态', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken
      })
      
      const state = store.getState()
      
      expect(state.auth.isAuthenticated).toBe(true)
      expect(state.auth.user).toEqual(mockUser)
      expect(state.auth.token).toBe(mockToken)
    })

    it('应该正确选择加载状态', () => {
      const store = createTestStore({ loading: true })
      
      const state = store.getState()
      
      expect(state.auth.loading).toBe(true)
    })

    it('应该正确选择错误状态', () => {
      const errorMessage = '网络错误'
      const store = createTestStore({ error: errorMessage })
      
      const state = store.getState()
      
      expect(state.auth.error).toBe(errorMessage)
    })
  })

  describe('用户角色检查', () => {
    it('应该检查用户是否为管理员', () => {
      const adminUser = { ...mockUser, roles: ['ADMIN', 'USER'] }
      const store = createTestStore({
        isAuthenticated: true,
        user: adminUser,
        token: mockToken
      })
      
      const state = store.getState()
      const isAdmin = state.auth.user?.roles.includes('ADMIN')
      
      expect(isAdmin).toBe(true)
    })

    it('应该检查普通用户权限', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken
      })
      
      const state = store.getState()
      const isAdmin = state.auth.user?.roles.includes('ADMIN')
      const isUser = state.auth.user?.roles.includes('USER')
      
      expect(isAdmin).toBe(false)
      expect(isUser).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('应该处理空用户数据', () => {
      const store = createTestStore()
      
      store.dispatch(loginSuccess({ user: null as any, token: mockToken }))
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toBeNull()
      expect(state.token).toBe(mockToken)
    })

    it('应该处理空令牌', () => {
      const store = createTestStore()
      
      store.dispatch(loginSuccess({ user: mockUser, token: '' }))
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('')
    })

    it('应该处理重复登录', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken
      })
      
      const newUser = { ...mockUser, username: 'newuser' }
      const newToken = 'new-token'
      
      store.dispatch(loginSuccess({ user: newUser, token: newToken }))
      const state = store.getState().auth

      expect(state.user).toEqual(newUser)
      expect(state.token).toBe(newToken)
    })

    it('应该处理重复登出', () => {
      const store = createTestStore()
      
      store.dispatch(logout())
      store.dispatch(logout())
      
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  })
})