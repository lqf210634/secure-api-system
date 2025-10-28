import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import * as auditAPI from '@/api/audit'
import { mockApiResponse } from '@/test/utils'

describe('Audit API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('getAuditLogs', () => {
    const queryParams = {
      page: 1,
      pageSize: 10,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      eventType: 'LOGIN',
      userId: 123,
      ipAddress: '192.168.1.1',
      level: 'INFO'
    }

    it('应该成功获取审计日志（管理员）', async () => {
      const result = await auditAPI.getAuditLogs(queryParams)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('logs')
      expect(result.data).toHaveProperty('total')
      expect(result.data).toHaveProperty('page')
      expect(result.data).toHaveProperty('pageSize')
      expect(Array.isArray(result.data.logs)).toBe(true)
      expect(result.data.logs.length).toBeGreaterThan(0)
      
      // 验证日志条目结构
      const log = result.data.logs[0]
      expect(log).toHaveProperty('id')
      expect(log).toHaveProperty('eventType')
      expect(log).toHaveProperty('userId')
      expect(log).toHaveProperty('username')
      expect(log).toHaveProperty('ipAddress')
      expect(log).toHaveProperty('userAgent')
      expect(log).toHaveProperty('timestamp')
      expect(log).toHaveProperty('level')
      expect(log).toHaveProperty('message')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.get('/api/audit/logs', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.getAuditLogs(queryParams)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该正确传递查询参数', async () => {
      server.use(
        rest.get('/api/audit/logs', (req, res, ctx) => {
          const url = new URL(req.url)
          expect(url.searchParams.get('page')).toBe('1')
          expect(url.searchParams.get('pageSize')).toBe('10')
          expect(url.searchParams.get('startDate')).toBe('2024-01-01')
          expect(url.searchParams.get('endDate')).toBe('2024-01-31')
          expect(url.searchParams.get('eventType')).toBe('LOGIN')
          expect(url.searchParams.get('userId')).toBe('123')
          expect(url.searchParams.get('ipAddress')).toBe('192.168.1.1')
          expect(url.searchParams.get('level')).toBe('INFO')
          
          return res(ctx.json(mockApiResponse.success({
            logs: [],
            total: 0,
            page: 1,
            pageSize: 10
          })))
        })
      )

      await auditAPI.getAuditLogs(queryParams)
    })

    it('应该处理空查询参数', async () => {
      const result = await auditAPI.getAuditLogs()

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('logs')
    })

    it('应该处理无效的日期范围', async () => {
      server.use(
        rest.get('/api/audit/logs', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('无效的日期范围')))
        })
      )

      const result = await auditAPI.getAuditLogs({
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('无效的日期范围')
    })
  })

  describe('getAuditStats', () => {
    it('应该成功获取审计统计信息（管理员）', async () => {
      const result = await auditAPI.getAuditStats()

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('totalEvents')
      expect(result.data).toHaveProperty('todayEvents')
      expect(result.data).toHaveProperty('eventTypeDistribution')
      expect(result.data).toHaveProperty('levelDistribution')
      expect(result.data).toHaveProperty('topUsers')
      expect(result.data).toHaveProperty('topIpAddresses')
      expect(result.data).toHaveProperty('recentTrends')
      expect(typeof result.data.totalEvents).toBe('number')
      expect(typeof result.data.todayEvents).toBe('number')
      expect(Array.isArray(result.data.eventTypeDistribution)).toBe(true)
      expect(Array.isArray(result.data.topUsers)).toBe(true)
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.get('/api/audit/stats', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.getAuditStats()

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该支持时间范围参数', async () => {
      const timeRange = '7d'
      
      server.use(
        rest.get('/api/audit/stats', (req, res, ctx) => {
          const url = new URL(req.url)
          expect(url.searchParams.get('timeRange')).toBe(timeRange)
          
          return res(ctx.json(mockApiResponse.success({
            totalEvents: 100,
            todayEvents: 10
          })))
        })
      )

      await auditAPI.getAuditStats(timeRange)
    })
  })

  describe('getSecurityAlerts', () => {
    const queryParams = {
      page: 1,
      pageSize: 10,
      status: 'unhandled',
      level: 'HIGH'
    }

    it('应该成功获取安全警报（管理员）', async () => {
      const result = await auditAPI.getSecurityAlerts(queryParams)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('alerts')
      expect(result.data).toHaveProperty('total')
      expect(Array.isArray(result.data.alerts)).toBe(true)
      
      if (result.data.alerts.length > 0) {
        const alert = result.data.alerts[0]
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('level')
        expect(alert).toHaveProperty('message')
        expect(alert).toHaveProperty('status')
        expect(alert).toHaveProperty('createdAt')
        expect(alert).toHaveProperty('handledAt')
        expect(alert).toHaveProperty('handledBy')
      }
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.get('/api/audit/alerts', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.getSecurityAlerts(queryParams)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该正确传递查询参数', async () => {
      server.use(
        rest.get('/api/audit/alerts', (req, res, ctx) => {
          const url = new URL(req.url)
          expect(url.searchParams.get('page')).toBe('1')
          expect(url.searchParams.get('pageSize')).toBe('10')
          expect(url.searchParams.get('status')).toBe('unhandled')
          expect(url.searchParams.get('level')).toBe('HIGH')
          
          return res(ctx.json(mockApiResponse.success({
            alerts: [],
            total: 0
          })))
        })
      )

      await auditAPI.getSecurityAlerts(queryParams)
    })
  })

  describe('handleSecurityAlert', () => {
    it('应该成功处理安全警报', async () => {
      const alertId = 123
      const action = 'resolved'
      const comment = '已处理此警报'
      
      const result = await auditAPI.handleSecurityAlert(alertId, action, comment)

      expect(result.success).toBe(true)
      expect(result.message).toBe('警报处理成功')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.put('/api/audit/alerts/:id/handle', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.handleSecurityAlert(123, 'resolved')

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理警报不存在', async () => {
      server.use(
        rest.put('/api/audit/alerts/:id/handle', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json(mockApiResponse.error('警报不存在')))
        })
      )

      const result = await auditAPI.handleSecurityAlert(999, 'resolved')

      expect(result.success).toBe(false)
      expect(result.message).toBe('警报不存在')
    })

    it('应该发送正确的参数', async () => {
      const alertId = 456
      const action = 'dismissed'
      const comment = '误报'
      
      server.use(
        rest.put('/api/audit/alerts/:id/handle', async (req, res, ctx) => {
          expect(req.params.id).toBe(alertId.toString())
          const body = await req.json()
          expect(body.action).toBe(action)
          expect(body.comment).toBe(comment)
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await auditAPI.handleSecurityAlert(alertId, action, comment)
    })
  })

  describe('exportAuditLogs', () => {
    const exportParams = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'csv',
      eventType: 'LOGIN'
    }

    it('应该成功导出审计日志', async () => {
      const result = await auditAPI.exportAuditLogs(exportParams)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('downloadUrl')
      expect(result.data).toHaveProperty('filename')
      expect(result.data.downloadUrl).toMatch(/^https?:\/\//)
      expect(result.data.filename).toMatch(/\.csv$/)
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.post('/api/audit/export', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.exportAuditLogs(exportParams)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理无效的导出格式', async () => {
      server.use(
        rest.post('/api/audit/export', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('不支持的导出格式')))
        })
      )

      const result = await auditAPI.exportAuditLogs({
        ...exportParams,
        format: 'invalid'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('不支持的导出格式')
    })

    it('应该处理日期范围过大', async () => {
      server.use(
        rest.post('/api/audit/export', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('导出日期范围过大')))
        })
      )

      const result = await auditAPI.exportAuditLogs({
        startDate: '2020-01-01',
        endDate: '2024-12-31',
        format: 'csv'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('导出日期范围过大')
    })

    it('应该发送正确的参数', async () => {
      server.use(
        rest.post('/api/audit/export', async (req, res, ctx) => {
          const body = await req.json()
          expect(body).toEqual(exportParams)
          
          return res(ctx.json(mockApiResponse.success({
            downloadUrl: 'https://example.com/export.csv',
            filename: 'audit_logs_2024-01-01_2024-01-31.csv'
          })))
        })
      )

      await auditAPI.exportAuditLogs(exportParams)
    })
  })

  describe('getSystemConfig', () => {
    it('应该成功获取系统安全配置（管理员）', async () => {
      const result = await auditAPI.getSystemConfig()

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('auditEnabled')
      expect(result.data).toHaveProperty('logRetentionDays')
      expect(result.data).toHaveProperty('alertThresholds')
      expect(result.data).toHaveProperty('securityPolicies')
      expect(result.data).toHaveProperty('encryptionSettings')
      expect(typeof result.data.auditEnabled).toBe('boolean')
      expect(typeof result.data.logRetentionDays).toBe('number')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.get('/api/audit/config', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.getSystemConfig()

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })
  })

  describe('updateSystemConfig', () => {
    const configData = {
      auditEnabled: true,
      logRetentionDays: 90,
      alertThresholds: {
        failedLoginAttempts: 5,
        suspiciousActivity: 10
      },
      securityPolicies: {
        passwordPolicy: {
          minLength: 8,
          requireSpecialChars: true
        }
      }
    }

    it('应该成功更新系统安全配置', async () => {
      const result = await auditAPI.updateSystemConfig(configData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('配置更新成功')
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.put('/api/audit/config', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.updateSystemConfig(configData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理无效的配置参数', async () => {
      server.use(
        rest.put('/api/audit/config', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('无效的配置参数')))
        })
      )

      const result = await auditAPI.updateSystemConfig({
        logRetentionDays: -1
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('无效的配置参数')
    })

    it('应该发送正确的参数', async () => {
      server.use(
        rest.put('/api/audit/config', async (req, res, ctx) => {
          const body = await req.json()
          expect(body).toEqual(configData)
          
          return res(ctx.json(mockApiResponse.success()))
        })
      )

      await auditAPI.updateSystemConfig(configData)
    })
  })

  describe('generateSecurityReport', () => {
    const reportParams = {
      type: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      includeCharts: true,
      format: 'pdf'
    }

    it('应该成功生成安全报告', async () => {
      const result = await auditAPI.generateSecurityReport(reportParams)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('reportId')
      expect(result.data).toHaveProperty('downloadUrl')
      expect(result.data).toHaveProperty('filename')
      expect(result.data.downloadUrl).toMatch(/^https?:\/\//)
    })

    it('应该处理非管理员访问', async () => {
      server.use(
        rest.post('/api/audit/report', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json(mockApiResponse.error('权限不足')))
        })
      )

      const result = await auditAPI.generateSecurityReport(reportParams)

      expect(result.success).toBe(false)
      expect(result.message).toBe('权限不足')
    })

    it('应该处理报告生成失败', async () => {
      server.use(
        rest.post('/api/audit/report', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('报告生成失败')))
        })
      )

      const result = await auditAPI.generateSecurityReport(reportParams)

      expect(result.success).toBe(false)
      expect(result.message).toBe('报告生成失败')
    })

    it('应该发送正确的参数', async () => {
      server.use(
        rest.post('/api/audit/report', async (req, res, ctx) => {
          const body = await req.json()
          expect(body).toEqual(reportParams)
          
          return res(ctx.json(mockApiResponse.success({
            reportId: 'report-123',
            downloadUrl: 'https://example.com/report.pdf',
            filename: 'security_report_2024-01.pdf'
          })))
        })
      )

      await auditAPI.generateSecurityReport(reportParams)
    })
  })

  describe('searchAuditLogs', () => {
    const searchParams = {
      query: 'failed login',
      page: 1,
      pageSize: 10,
      filters: {
        eventType: 'LOGIN',
        level: 'ERROR'
      }
    }

    it('应该成功搜索审计日志', async () => {
      const result = await auditAPI.searchAuditLogs(searchParams)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('logs')
      expect(result.data).toHaveProperty('total')
      expect(result.data).toHaveProperty('highlights')
      expect(Array.isArray(result.data.logs)).toBe(true)
    })

    it('应该处理空搜索结果', async () => {
      server.use(
        rest.post('/api/audit/search', (req, res, ctx) => {
          return res(ctx.json(mockApiResponse.success({
            logs: [],
            total: 0,
            highlights: []
          })))
        })
      )

      const result = await auditAPI.searchAuditLogs({
        query: 'nonexistent'
      })

      expect(result.success).toBe(true)
      expect(result.data.logs).toHaveLength(0)
      expect(result.data.total).toBe(0)
    })

    it('应该处理无效的搜索查询', async () => {
      server.use(
        rest.post('/api/audit/search', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json(mockApiResponse.error('无效的搜索查询')))
        })
      )

      const result = await auditAPI.searchAuditLogs({
        query: ''
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('无效的搜索查询')
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      server.use(
        rest.get('/api/audit/logs', (req, res, ctx) => {
          return res.networkError('网络连接失败')
        })
      )

      await expect(auditAPI.getAuditLogs()).rejects.toThrow()
    })

    it('应该处理服务器错误', async () => {
      server.use(
        rest.get('/api/audit/stats', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockApiResponse.error('服务器内部错误')))
        })
      )

      const result = await auditAPI.getAuditStats()

      expect(result.success).toBe(false)
      expect(result.message).toBe('服务器内部错误')
    })

    it('应该处理请求超时', async () => {
      server.use(
        rest.get('/api/audit/logs', (req, res, ctx) => {
          return res(ctx.delay(10000)) // 10秒延迟
        })
      )

      // 模拟超时
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockImplementation(() => 
        Promise.reject(new Error('Request timeout'))
      )

      await expect(auditAPI.getAuditLogs()).rejects.toThrow()

      global.fetch = originalFetch
    })

    it('应该处理JSON解析错误', async () => {
      server.use(
        rest.get('/api/audit/stats', (req, res, ctx) => {
          return res(ctx.text('Invalid JSON'))
        })
      )

      await expect(auditAPI.getAuditStats()).rejects.toThrow()
    })
  })
})