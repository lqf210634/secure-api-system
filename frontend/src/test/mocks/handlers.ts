import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:8080/api'

export const handlers = [
  // 认证相关API
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.username === 'testuser' && body.password === 'password123' && body.captcha === '1234') {
      return HttpResponse.json({
        success: true,
        message: '登录成功',
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            roles: ['USER']
          }
        }
      })
    }
    
    if (body.captcha !== '1234') {
      return HttpResponse.json({
        success: false,
        message: '验证码错误'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: false,
      message: '用户名或密码错误'
    }, { status: 401 })
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.username === 'existinguser') {
      return HttpResponse.json({
        success: false,
        message: '用户名已存在'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: true,
      message: '注册成功'
    })
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: '登出成功'
    })
  }),

  http.get(`${API_BASE_URL}/auth/captcha`, () => {
    // 返回模拟的验证码图片
    const canvas = new ArrayBuffer(100)
    return new HttpResponse(canvas, {
      headers: {
        'Content-Type': 'image/png'
      }
    })
  }),

  http.post(`${API_BASE_URL}/auth/captcha/refresh`, () => {
    const canvas = new ArrayBuffer(100)
    return new HttpResponse(canvas, {
      headers: {
        'Content-Type': 'image/png'
      }
    })
  }),

  http.get(`${API_BASE_URL}/auth/verify`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        username: 'testuser',
        roles: ['USER']
      }
    })
  }),

  // 用户相关API
  http.get(`${API_BASE_URL}/user/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        phone: '13800138000',
        nickname: '测试用户',
        avatar: '/avatars/default.png',
        createTime: '2024-01-01T00:00:00Z'
      }
    })
  }),

  http.put(`${API_BASE_URL}/user/profile`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    const body = await request.json() as any
    
    if (body.email && !body.email.includes('@')) {
      return HttpResponse.json({
        success: false,
        message: '邮箱格式错误'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: true,
      message: '资料更新成功'
    })
  }),

  http.post(`${API_BASE_URL}/user/change-password`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    const body = await request.json() as any
    
    if (body.oldPassword !== 'password123') {
      return HttpResponse.json({
        success: false,
        message: '原密码错误'
      }, { status: 400 })
    }
    
    if (body.newPassword !== body.confirmPassword) {
      return HttpResponse.json({
        success: false,
        message: '确认密码不匹配'
      }, { status: 400 })
    }
    
    return HttpResponse.json({
      success: true,
      message: '密码修改成功'
    })
  }),

  http.get(`${API_BASE_URL}/user/list`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const size = parseInt(url.searchParams.get('size') || '10')
    
    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    // 模拟管理员权限检查
    if (!authHeader.includes('admin-token')) {
      return HttpResponse.json({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        records: [
          {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            status: 1,
            createTime: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            username: 'admin',
            email: 'admin@example.com',
            status: 1,
            createTime: '2024-01-01T00:00:00Z'
          }
        ],
        total: 2,
        current: page,
        size: size
      }
    })
  }),

  // 安全审计相关API
  http.get(`${API_BASE_URL}/audit/logs`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const size = parseInt(url.searchParams.get('size') || '10')
    
    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    if (!authHeader.includes('admin-token')) {
      return HttpResponse.json({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        records: [
          {
            id: 1,
            eventType: 'LOGIN',
            username: 'testuser',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            createTime: '2024-01-01T00:00:00Z',
            details: '用户登录成功'
          }
        ],
        total: 1,
        current: page,
        size: size
      }
    })
  }),

  http.get(`${API_BASE_URL}/audit/statistics`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 })
    }
    
    if (!authHeader.includes('admin-token')) {
      return HttpResponse.json({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        totalEvents: 100,
        loginAttempts: 50,
        failedLogins: 5,
        securityViolations: 2
      }
    })
  }),

  // 错误处理
  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }),

  http.get(`${API_BASE_URL}/error/404`, () => {
    return HttpResponse.json({
      success: false,
      message: '资源不存在'
    }, { status: 404 })
  })
]