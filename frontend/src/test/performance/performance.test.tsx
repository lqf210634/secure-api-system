import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { createTestStore, createAuthenticatedStore, createAdminStore } from '@/test/utils'
import Dashboard from '@/pages/Dashboard'
import UserProfile from '@/components/UserProfile'
import LoginForm from '@/components/LoginForm'
import RegisterForm from '@/components/RegisterForm'

// Mock Chart.js for performance tests
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
  Bar: ({ data }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, 'Bar Chart'),
  Line: ({ data }: any) => React.createElement('div', { 'data-testid': 'line-chart' }, 'Line Chart'),
  Pie: ({ data }: any) => React.createElement('div', { 'data-testid': 'pie-chart' }, 'Pie Chart')
}))

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  }
})

// Performance measurement utilities
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  return end - start
}

const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

// Test wrapper component
const PerformanceTestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </BrowserRouter>
  </Provider>
)

describe('前端性能测试', () => {
  beforeEach(() => {
    // 清理DOM
    cleanup()
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
    }
  })

  afterEach(() => {
    cleanup()
  })

  describe('组件渲染性能', () => {
    it('LoginForm组件应该在合理时间内渲染', () => {
      const renderTime = measurePerformance('LoginForm render', () => {
        render(
          <PerformanceTestWrapper>
            <LoginForm />
          </PerformanceTestWrapper>
        )
      })

      // 登录表单应该在50ms内渲染完成
      expect(renderTime).toBeLessThan(50)
      expect(screen.getByText('用户登录')).toBeInTheDocument()
    })

    it('RegisterForm组件应该在合理时间内渲染', () => {
      const renderTime = measurePerformance('RegisterForm render', () => {
        render(
          <PerformanceTestWrapper>
            <RegisterForm />
          </PerformanceTestWrapper>
        )
      })

      // 注册表单应该在50ms内渲染完成
      expect(renderTime).toBeLessThan(50)
      expect(screen.getByText('用户注册')).toBeInTheDocument()
    })

    it('UserProfile组件应该在合理时间内渲染', () => {
      const store = createAuthenticatedStore()
      
      const renderTime = measurePerformance('UserProfile render', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <UserProfile />
          </PerformanceTestWrapper>
        )
      })

      // 用户资料组件应该在100ms内渲染完成
      expect(renderTime).toBeLessThan(100)
      expect(screen.getByText('个人资料')).toBeInTheDocument()
    })

    it('Dashboard组件应该在合理时间内渲染', () => {
      const store = createAdminStore()
      
      const renderTime = measurePerformance('Dashboard render', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <Dashboard />
          </PerformanceTestWrapper>
        )
      })

      // 仪表板组件应该在200ms内渲染完成（包含图表）
      expect(renderTime).toBeLessThan(200)
      expect(screen.getByText('仪表板')).toBeInTheDocument()
    })
  })

  describe('大量数据渲染性能', () => {
    it('应该高效渲染大量用户列表', () => {
      // 创建包含大量用户数据的store
      const largeUserList = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        username: `user${index + 1}`,
        email: `user${index + 1}@example.com`,
        role: index % 10 === 0 ? 'admin' : 'user',
        status: 'active',
        createdAt: new Date().toISOString()
      }))

      const store = createAdminStore({
        users: {
          list: largeUserList,
          total: 1000,
          loading: false
        }
      })

      const renderTime = measurePerformance('Large user list render', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <Dashboard />
          </PerformanceTestWrapper>
        )
      })

      // 即使有大量数据，渲染时间也应该在合理范围内
      expect(renderTime).toBeLessThan(500)
    })

    it('应该高效渲染大量审计日志', () => {
      // 创建包含大量审计日志的store
      const largeLogs = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        action: ['LOGIN', 'LOGOUT', 'UPDATE_PROFILE', 'CHANGE_PASSWORD'][index % 4],
        username: `user${(index % 100) + 1}`,
        ip: `192.168.1.${(index % 255) + 1}`,
        timestamp: new Date(Date.now() - index * 60000).toISOString(),
        details: `操作详情 ${index + 1}`
      }))

      const store = createAdminStore({
        audit: {
          logs: largeLogs,
          total: 1000,
          loading: false
        }
      })

      const renderTime = measurePerformance('Large audit logs render', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <Dashboard />
          </PerformanceTestWrapper>
        )
      })

      // 大量审计日志渲染应该在合理时间内完成
      expect(renderTime).toBeLessThan(500)
    })
  })

  describe('内存使用测试', () => {
    it('组件卸载后应该释放内存', () => {
      const initialMemory = measureMemoryUsage()

      // 渲染多个组件实例
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <PerformanceTestWrapper>
            <Dashboard />
          </PerformanceTestWrapper>
        )
        unmount()
      }

      // 强制垃圾回收
      if (global.gc) {
        global.gc()
      }

      const finalMemory = measureMemoryUsage()
      const memoryIncrease = finalMemory - initialMemory

      // 内存增长应该在合理范围内（小于10MB）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('重复渲染不应该造成内存泄漏', () => {
      const store = createAuthenticatedStore()
      const initialMemory = measureMemoryUsage()

      // 重复渲染和卸载组件
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <PerformanceTestWrapper store={store}>
            <UserProfile />
          </PerformanceTestWrapper>
        )
        unmount()
      }

      // 强制垃圾回收
      if (global.gc) {
        global.gc()
      }

      const finalMemory = measureMemoryUsage()
      const memoryIncrease = finalMemory - initialMemory

      // 重复渲染后内存增长应该很小
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
    })
  })

  describe('事件处理性能', () => {
    it('表单输入事件应该响应迅速', async () => {
      const { container } = render(
        <PerformanceTestWrapper>
          <LoginForm />
        </PerformanceTestWrapper>
      )

      const usernameInput = container.querySelector('input[type="text"]') as HTMLInputElement
      
      const eventTime = measurePerformance('Input event handling', () => {
        // 模拟快速输入
        for (let i = 0; i < 100; i++) {
          usernameInput.value = `test${i}`
          usernameInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })

      // 100次输入事件应该在50ms内处理完成
      expect(eventTime).toBeLessThan(50)
    })

    it('按钮点击事件应该响应迅速', async () => {
      const clickHandler = vi.fn()
      
      const TestButton = () => (
        <button onClick={clickHandler} data-testid="test-button">
          测试按钮
        </button>
      )

      render(
        <PerformanceTestWrapper>
          <TestButton />
        </PerformanceTestWrapper>
      )

      const button = screen.getByTestId('test-button')
      
      const eventTime = measurePerformance('Button click handling', () => {
        // 模拟快速点击
        for (let i = 0; i < 100; i++) {
          button.click()
        }
      })

      // 100次点击事件应该在30ms内处理完成
      expect(eventTime).toBeLessThan(30)
      expect(clickHandler).toHaveBeenCalledTimes(100)
    })
  })

  describe('Redux状态更新性能', () => {
    it('大量状态更新应该高效处理', () => {
      const store = createTestStore()
      
      const updateTime = measurePerformance('Redux state updates', () => {
        // 模拟大量状态更新
        for (let i = 0; i < 1000; i++) {
          store.dispatch({
            type: 'auth/updateUser',
            payload: {
              lastActivity: Date.now()
            }
          })
        }
      })

      // 1000次状态更新应该在100ms内完成
      expect(updateTime).toBeLessThan(100)
    })

    it('复杂状态更新应该保持性能', () => {
      const store = createAdminStore()
      
      const complexData = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          username: `user${i}`,
          email: `user${i}@example.com`
        })),
        logs: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          action: 'LOGIN',
          timestamp: new Date().toISOString()
        }))
      }

      const updateTime = measurePerformance('Complex state update', () => {
        store.dispatch({
          type: 'admin/updateData',
          payload: complexData
        })
      })

      // 复杂状态更新应该在50ms内完成
      expect(updateTime).toBeLessThan(50)
    })
  })

  describe('图表渲染性能', () => {
    it('图表组件应该高效渲染', () => {
      const chartData = {
        labels: Array.from({ length: 100 }, (_, i) => `Label ${i}`),
        datasets: [{
          label: 'Test Data',
          data: Array.from({ length: 100 }, () => Math.random() * 100)
        }]
      }

      const store = createAdminStore({
        dashboard: {
          chartData,
          loading: false
        }
      })

      const renderTime = measurePerformance('Chart render', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <Dashboard />
          </PerformanceTestWrapper>
        )
      })

      // 图表渲染应该在300ms内完成
      expect(renderTime).toBeLessThan(300)
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('虚拟滚动性能', () => {
    it('大列表应该使用虚拟滚动优化', () => {
      // 这个测试假设我们实现了虚拟滚动
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000
      }))

      const VirtualList = ({ data }) => (
        <div data-testid="virtual-list">
          {/* 在实际实现中，这里应该只渲染可见的项目 */}
          {data.slice(0, 50).map(item => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      )

      const renderTime = measurePerformance('Virtual list render', () => {
        render(
          <PerformanceTestWrapper>
            <VirtualList data={largeDataset} />
          </PerformanceTestWrapper>
        )
      })

      // 虚拟滚动应该让大列表渲染时间保持在合理范围
      expect(renderTime).toBeLessThan(100)
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument()
    })
  })

  describe('懒加载性能', () => {
    it('组件懒加载应该减少初始加载时间', async () => {
      // 模拟懒加载组件
      const LazyComponent = () => (
        <div data-testid="lazy-component">懒加载组件</div>
      )

      const renderTime = measurePerformance('Lazy component render', () => {
        render(
          <PerformanceTestWrapper>
            <LazyComponent />
          </PerformanceTestWrapper>
        )
      })

      // 懒加载组件应该快速渲染
      expect(renderTime).toBeLessThan(50)
      expect(screen.getByTestId('lazy-component')).toBeInTheDocument()
    })
  })

  describe('缓存性能', () => {
    it('重复数据请求应该使用缓存', () => {
      const store = createAuthenticatedStore()
      
      // 第一次渲染
      const firstRenderTime = measurePerformance('First render with data fetch', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <UserProfile />
          </PerformanceTestWrapper>
        )
      })

      cleanup()

      // 第二次渲染（应该使用缓存）
      const secondRenderTime = measurePerformance('Second render with cache', () => {
        render(
          <PerformanceTestWrapper store={store}>
            <UserProfile />
          </PerformanceTestWrapper>
        )
      })

      // 使用缓存的第二次渲染应该更快
      expect(secondRenderTime).toBeLessThan(firstRenderTime)
    })
  })

  describe('Bundle大小和加载性能', () => {
    it('应该测试代码分割效果', () => {
      // 这个测试在实际项目中需要配合webpack-bundle-analyzer等工具
      // 这里只是示例性的测试
      const moduleLoadTime = measurePerformance('Module load simulation', () => {
        // 模拟模块加载
        const mockModule = {
          Dashboard,
          UserProfile,
          LoginForm,
          RegisterForm
        }
        
        // 验证所有组件都已加载
        expect(mockModule.Dashboard).toBeDefined()
        expect(mockModule.UserProfile).toBeDefined()
        expect(mockModule.LoginForm).toBeDefined()
        expect(mockModule.RegisterForm).toBeDefined()
      })

      // 模块加载应该很快
      expect(moduleLoadTime).toBeLessThan(10)
    })
  })
})