# API 文档

## 概述

本系统提供完整的 RESTful API，支持用户管理、权限控制、安全监控等功能。所有API都采用统一的响应格式和错误处理机制。

## 基础信息

- **Base URL**: `http://localhost:8080/api`
- **API版本**: v1.0
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证机制

### JWT Token
系统使用JWT Token进行身份认证，Token需要在请求头中携带：

```http
Authorization: Bearer <your-jwt-token>
```

### Token获取
通过登录接口获取Token：

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "roles": ["ADMIN"]
    }
  }
}
```

## 统一响应格式

所有API响应都遵循统一格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T12:00:00Z",
  "traceId": "trace-id-here"
}
```

### 响应字段说明
- `code`: 状态码，200表示成功
- `message`: 响应消息
- `data`: 响应数据，可能为对象、数组或null
- `timestamp`: 响应时间戳
- `traceId`: 请求追踪ID

### 状态码说明
- `200`: 操作成功
- `400`: 请求参数错误
- `401`: 未认证或Token过期
- `403`: 权限不足
- `404`: 资源不存在
- `429`: 请求频率过高
- `500`: 服务器内部错误

## API 端点分组

### 1. 认证相关 (`/api/auth`)
- `POST /login` - 用户登录
- `POST /register` - 用户注册
- `POST /logout` - 用户登出
- `POST /refresh` - 刷新Token
- `GET /captcha` - 获取验证码
- `POST /verify-captcha` - 验证验证码
- `POST /send-email-code` - 发送邮箱验证码
- `POST /send-sms-code` - 发送短信验证码
- `POST /verify-email-code` - 验证邮箱验证码
- `POST /verify-sms-code` - 验证短信验证码
- `POST /reset-password` - 重置密码
- `GET /status` - 获取认证状态

### 2. 用户管理 (`/api/users`)
- `GET /me` - 获取当前用户信息
- `PUT /me` - 更新当前用户信息
- `PUT /me/password` - 修改密码
- `GET /` - 获取用户列表（管理员）
- `GET /{id}` - 获取用户详情（管理员）
- `POST /` - 创建用户（管理员）
- `PUT /{id}` - 更新用户信息（管理员）
- `PUT /{id}/enable` - 启用用户（管理员）
- `PUT /{id}/disable` - 禁用用户（管理员）
- `PUT /{id}/reset-password` - 重置用户密码（管理员）
- `PUT /{id}/unlock` - 解锁用户账户（管理员）
- `DELETE /{id}` - 删除用户（管理员）
- `DELETE /batch` - 批量删除用户（管理员）
- `GET /check-username` - 检查用户名可用性
- `GET /check-email` - 检查邮箱可用性
- `GET /check-phone` - 检查手机号可用性

### 3. 安全审计 (`/api/security`)
- `GET /audit-logs` - 获取审计日志列表
- `GET /audit-logs/{id}` - 获取审计日志详情
- `GET /audit-logs/stats` - 获取安全统计信息
- `POST /audit-logs` - 手动记录安全事件
- `DELETE /audit-logs/cleanup` - 清理过期日志
- `GET /audit-logs/export` - 导出审计日志
- `GET /audit-logs/event-types` - 获取事件类型列表
- `GET /audit-logs/event-levels` - 获取事件级别列表

## 请求示例

### 获取用户列表
```http
GET /api/users?page=1&size=10&keyword=admin
Authorization: Bearer <your-jwt-token>
```

响应：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "records": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": "ACTIVE",
        "roles": ["ADMIN"],
        "lastLoginTime": "2024-01-01T12:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

### 创建用户
```http
POST /api/users
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "Password123!",
  "email": "newuser@example.com",
  "phone": "13900139000",
  "nickname": "新用户",
  "roles": ["USER"]
}
```

### 获取审计日志
```http
GET /api/security/audit-logs?page=1&size=20&eventType=LOGIN&startTime=2024-01-01&endTime=2024-01-31
Authorization: Bearer <your-jwt-token>
```

## 错误处理

### 常见错误响应

#### 参数验证错误
```json
{
  "code": 400,
  "message": "参数验证失败",
  "data": {
    "errors": [
      {
        "field": "username",
        "message": "用户名不能为空"
      },
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

#### 认证失败
```json
{
  "code": 401,
  "message": "Token已过期，请重新登录"
}
```

#### 权限不足
```json
{
  "code": 403,
  "message": "权限不足，无法访问该资源"
}
```

#### 资源不存在
```json
{
  "code": 404,
  "message": "用户不存在"
}
```

## 安全注意事项

1. **Token安全**: 
   - Token应安全存储，避免在URL中传递
   - 定期刷新Token，避免长期使用
   - 登出时应清除本地Token

2. **请求安全**:
   - 使用HTTPS协议传输敏感数据
   - 对敏感操作进行二次验证
   - 遵循最小权限原则

3. **数据验证**:
   - 所有输入数据都会进行服务端验证
   - 防止XSS和SQL注入攻击
   - 敏感信息会进行脱敏处理

## 限流规则

系统对API调用实施限流保护：

- **登录接口**: 每分钟最多5次尝试
- **注册接口**: 每小时最多3次注册
- **验证码接口**: 每分钟最多1次获取
- **一般接口**: 每分钟最多100次请求

超出限制时返回429状态码。

## 版本更新

API版本通过URL路径进行管理，当前版本为v1。重大更新时会发布新版本，旧版本会保持一段时间的兼容性。

## 联系支持

如有API使用问题，请联系：
- 技术支持邮箱: api-support@siku.com
- 文档反馈: docs@siku.com