import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createAuthenticatedStore, createAdminStore, mockApiResponse } from '@/test/utils'
import Dashboard from '@/pages/Dashboard'
import * as userAPI from '@/api/user'
import * as securityAPI from '@/api/security'

// Mock API
vi.mock('@/api/user')
vi.mock('@/api/security')
const mockUserAPI = vi.mocked(userAPI)
const mockSecurityAPI = vi.mocked(securityAPI)

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => <div data-testid="line-chart">{JSON.stringify(data)}</div>,
  Doughnut: ({ data }: any) => <div data-testid="doughnut-chart">{JSON.stringify(data)}</div>,
  Bar: ({ data }: any) => <div data-testid="bar-chart">{JSON.stringify(data)}</div>
}))

describe('Dashboard Page', () => {
  const user = userEvent.setup()
  
  const mockStats = {
    totalUsers: 1250,
    activeUsers: 890,
    totalRequests: 45678,
    securityEvents: 23,
    systemHealth: 98.5,
    responseTime: 125
  }

  const mockSecurityStats = {
    loginAttempts: 1234,
    failedLogins: 45,
    securityAlerts: 12,
    blockedIPs: 8
  }

  const mockChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [{
      label: 'API请求',
      data: [120, 190, 300, 500, 200, 300],
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.1)'
    }]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserAPI.getUserStats.mockResolvedValue({
      success: true,
      data: mockStats
    })
    mockSecurityAPI.getSecurityStats.mockResolvedValue({
      success: true,
      data: mockSecurityStats
    })
    mockSecurityAPI.getApiUsageChart.mockResolvedValue({
      success: true,
      data: mockChartData
    })
  })

  it('应该正确渲染仪表板页面', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    expect(screen.getByText(/系统概览/)).toBeInTheDocument()
    expect(screen.getByText(/欢迎回来/)).toBeInTheDocument()
  })

  it('应该显示用户统计信息', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/总用户数/)).toBeInTheDocument()
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText(/活跃用户/)).toBeInTheDocument()
      expect(screen.getByText('890')).toBeInTheDocument()
    })
  })

  it('应该显示API统计信息', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/API请求总数/)).toBeInTheDocument()
      expect(screen.getByText('45,678')).toBeInTheDocument()
      expect(screen.getByText(/安全事件/)).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
    })
  })

  it('应该显示系统健康状态', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/系统健康度/)).toBeInTheDocument()
      expect(screen.getByText('98.5%')).toBeInTheDocument()
      expect(screen.getByText(/响应时间/)).toBeInTheDocument()
      expect(screen.getByText('125ms')).toBeInTheDocument()
    })
  })

  it('应该为管理员显示安全统计', async () => {
    const store = createAdminStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/安全概览/)).toBeInTheDocument()
      expect(screen.getByText(/登录尝试/)).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText(/失败登录/)).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
    })
  })

  it('应该显示API使用趋势图表', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/API使用趋势/)).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('应该显示用户分布图表', async () => {
    const store = createAdminStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/用户分布/)).toBeInTheDocument()
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    })
  })

  it('应该显示最近活动列表', async () => {
    const mockActivities = [
      { id: 1, type: 'login', user: 'testuser', time: '2023-12-01 10:00:00', description: '用户登录' },
      { id: 2, type: 'api', user: 'testuser', time: '2023-12-01 10:05:00', description: 'API调用' }
    ]
    
    mockUserAPI.getRecentActivities.mockResolvedValue({
      success: true,
      data: mockActivities
    })
    
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/最近活动/)).toBeInTheDocument()
      expect(screen.getByText(/用户登录/)).toBeInTheDocument()
      expect(screen.getByText(/API调用/)).toBeInTheDocument()
    })
  })

  it('应该显示系统公告', async () => {
    const mockAnnouncements = [
      { id: 1, title: '系统维护通知', content: '系统将于今晚进行维护', type: 'info', createdAt: '2023-12-01' },
      { id: 2, title: '安全更新', content: '请及时更新密码', type: 'warning', createdAt: '2023-11-30' }
    ]
    
    mockUserAPI.getAnnouncements.mockResolvedValue({
      success: true,
      data: mockAnnouncements
    })
    
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/系统公告/)).toBeInTheDocument()
      expect(screen.getByText(/系统维护通知/)).toBeInTheDocument()
      expect(screen.getByText(/安全更新/)).toBeInTheDocument()
    })
  })

  it('应该支持刷新数据', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    const refreshButton = screen.getByRole('button', { name: /刷新/ })
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(mockUserAPI.getUserStats).toHaveBeenCalledTimes(2)
    })
  })

  it('应该显示快捷操作', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    expect(screen.getByText(/快捷操作/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /个人资料/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /修改密码/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /API文档/ })).toBeInTheDocument()
  })

  it('应该为管理员显示管理操作', async () => {
    const store = createAdminStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/管理操作/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /用户管理/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /安全审计/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /系统设置/ })).toBeInTheDocument()
    })
  })

  it('应该显示实时通知', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    expect(screen.getByText(/实时通知/)).toBeInTheDocument()
    
    // 模拟WebSocket消息
    const mockNotification = {
      type: 'security',
      title: '安全警告',
      message: '检测到异常登录',
      timestamp: new Date().toISOString()
    }
    
    // 触发通知
    window.dispatchEvent(new CustomEvent('notification', { detail: mockNotification }))
    
    await waitFor(() => {
      expect(screen.getByText(/安全警告/)).toBeInTheDocument()
      expect(screen.getByText(/检测到异常登录/)).toBeInTheDocument()
    })
  })

  it('应该处理数据加载失败', async () => {
    mockUserAPI.getUserStats.mockRejectedValue(new Error('加载失败'))
    
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/数据加载失败/)).toBeInTheDocument()
    })
  })

  it('应该显示加载状态', async () => {
    // 模拟延迟响应
    mockUserAPI.getUserStats.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ success: true, data: mockStats }), 1000)
      )
    )
    
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('应该支持时间范围选择', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    const timeRangeSelect = screen.getByLabelText(/时间范围/)
    await user.selectOptions(timeRangeSelect, '7d')
    
    await waitFor(() => {
      expect(mockUserAPI.getUserStats).toHaveBeenCalledWith({ timeRange: '7d' })
    })
  })

  it('应该显示性能指标', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    await waitFor(() => {
      expect(screen.getByText(/性能指标/)).toBeInTheDocument()
      expect(screen.getByText(/CPU使用率/)).toBeInTheDocument()
      expect(screen.getByText(/内存使用率/)).toBeInTheDocument()
      expect(screen.getByText(/磁盘使用率/)).toBeInTheDocument()
    })
  })

  it('应该支持导出报告', async () => {
    const store = createAdminStore()
    renderWithProviders(<Dashboard />, { store })
    
    const exportButton = screen.getByRole('button', { name: /导出报告/ })
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(mockUserAPI.exportReport).toHaveBeenCalled()
    })
  })

  it('应该在移动端正确显示', () => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    // 验证响应式布局
    const container = screen.getByTestId('dashboard-container')
    expect(container).toHaveClass('mobile-layout')
  })

  it('应该支持自动刷新', async () => {
    const store = createAuthenticatedStore()
    renderWithProviders(<Dashboard />, { store })
    
    // 启用自动刷新
    const autoRefreshToggle = screen.getByLabelText(/自动刷新/)
    await user.click(autoRefreshToggle)
    
    // 等待自动刷新触发
    await waitFor(() => {
      expect(mockUserAPI.getUserStats).toHaveBeenCalledTimes(2)
    }, { timeout: 35000 }) // 30秒自动刷新间隔
  })
})