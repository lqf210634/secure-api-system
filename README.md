# Secure API System

[![CI/CD](https://github.com/your-org/secure-api-system/workflows/CI/badge.svg)](https://github.com/your-org/secure-api-system/actions)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=secure-api-system&metric=security_rating)](https://sonarcloud.io/dashboard?id=secure-api-system)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=secure-api-system&metric=coverage)](https://sonarcloud.io/dashboard?id=secure-api-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个现代化的、安全的 API 系统，采用 Spring Boot 后端和 React 前端，具备完整的用户认证、授权、数据加密和监控功能。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Spring Boot) │◄──►│   (MySQL)       │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Redis         │    │   Monitoring    │
│   (Reverse      │    │   (Cache)       │    │   (Prometheus   │
│    Proxy)       │    │   Port: 6379    │    │    Grafana)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ 技术栈

### 前端技术
- **React 18** + TypeScript
- **Vite** 构建工具
- **Tailwind CSS** 样式框架
- **React Query** 状态管理
- **React Router** 路由管理
- **Axios** HTTP 客户端
- **React Hook Form** 表单处理
- **Playwright** E2E 测试

### 后端技术
- **Spring Boot 3** + Java 17
- **Spring Security** 安全框架
- **Spring Data JPA** 数据访问
- **Spring Cache** + Redis 缓存
- **Maven** 依赖管理
- **JUnit 5** + Testcontainers 测试

### 数据库与缓存
- **MySQL 8** 主数据库
- **Redis 7** 缓存和会话
- **Flyway** 数据库迁移

### DevOps 与基础设施
- **Docker** 容器化
- **Kubernetes** 容器编排
- **GitHub Actions** CI/CD
- **Prometheus** + **Grafana** 监控
- **Nginx** 反向代理

## ✨ 特性

### 🔐 安全特性
- **JWT 认证**: 基于 JSON Web Token 的无状态认证
- **角色权限控制**: 细粒度的 RBAC 权限管理
- **数据加密**: AES-256 敏感数据加密
- **API 限流**: 防止 API 滥用和 DDoS 攻击
- **输入验证**: 全面的数据验证和清理
- **安全头**: 完整的 HTTP 安全头配置
- **审计日志**: 详细的操作审计和安全事件记录

### 🚀 技术特性
- **微服务架构**: 模块化设计，易于扩展
- **容器化部署**: Docker 和 Kubernetes 支持
- **自动化 CI/CD**: GitHub Actions 持续集成和部署
- **监控告警**: Prometheus + Grafana 监控体系
- **缓存优化**: Redis 多级缓存策略
- **数据库优化**: MySQL 读写分离和连接池
- **API 文档**: Swagger/OpenAPI 自动生成文档

### 🎨 用户体验
- **响应式设计**: 支持桌面和移动设备
- **现代化 UI**: Material Design 设计语言
- **国际化支持**: 多语言界面
- **实时通知**: WebSocket 实时消息推送
- **离线支持**: PWA 离线功能
- **无障碍访问**: WCAG 2.1 AA 级别支持

## 项目概述

这是一个基于混合加密技术的前后端分离系统，采用 **RSA + AES + JWT** 的安全架构，确保API通信的机密性、完整性和真实性。系统提供完整的用户管理、权限控制、安全监控和审计日志功能，适用于企业级应用的安全管理需求。

## 🚀 核心特性

### 安全特性
- **混合加密**: RSA + AES 双重加密保护
- **身份认证**: JWT Token + Session 双重认证
- **权限控制**: 基于角色的访问控制 (RBAC)
- **安全审计**: 全面的操作日志和安全事件记录
- **威胁防护**: XSS、SQL注入、CSRF等攻击防护
- **验证码系统**: 图形验证码和短信验证码

### 功能特性
- **用户管理**: 完整的用户生命周期管理
- **安全监控**: 实时安全状态监控和告警
- **审计日志**: 详细的操作记录和分析
- **邮件服务**: 邮件通知和验证码发送
- **短信服务**: 支持多种短信服务商
- **API文档**: 自动生成的API文档

## 技术栈

### 后端技术栈
- **框架**: Spring Boot 2.7.x
- **安全**: Spring Security + JWT
- **数据库**: MySQL 8.0 + MyBatis Plus
- **缓存**: Redis
- **文档**: Swagger/OpenAPI 3
- **测试**: JUnit 5 + Mockito
- **构建**: Maven

### 前端技术栈
- **框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit
- **路由**: React Router v6
- **UI组件**: Ant Design
- **HTTP客户端**: Axios
- **构建**: Vite

## 安全特性

### 混合加密架构
1. **RSA非对称加密**: 安全交换AES会话密钥
2. **AES对称加密**: 高效加密API报文数据
3. **HMAC-SHA256**: 数据完整性验证
4. **JWT Token**: 用户身份认证和授权

### 安全流程
```
客户端生成AES会话密钥 → RSA加密会话密钥 → AES加密业务数据 → 
HMAC签名 → 发送加密请求 → 服务端验证和解密 → 加密响应返回
```

## 项目结构

```
secure-api-system/
├── backend/                 # Spring Boot后端
│   ├── src/main/java/
│   │   └── com/siku/
│   │       ├── config/      # 配置类
│   │       ├── controller/  # 控制器
│   │       ├── service/     # 业务服务
│   │       ├── entity/      # 实体类
│   │       ├── dto/         # 数据传输对象
│   │       ├── utils/       # 工具类
│   │       └── security/    # 安全组件
│   ├── src/main/resources/
│   └── src/test/
├── frontend/                # React前端
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API服务
│   │   ├── utils/          # 工具函数
│   │   ├── store/          # 状态管理
│   │   └── types/          # TypeScript类型
│   ├── public/
│   └── package.json
├── docs/                   # 项目文档
├── docker/                 # Docker配置
└── scripts/               # 部署脚本
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- Git

### 1. 克隆项目
```bash
git clone https://github.com/your-username/secure-api-system.git
cd secure-api-system
```

### 2. 环境设置
```bash
# 使脚本可执行
chmod +x scripts/*.sh

# 运行设置脚本（安装依赖并配置环境）
./scripts/setup.sh
```

### 3. 启动开发环境
```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 或者分别启动服务：

# 启动后端
cd backend
mvn spring-boot:run

# 启动前端（在另一个终端）
cd frontend
npm run dev
```

### 4. 访问应用
- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **API 文档**: http://localhost:8080/swagger-ui.html
- **Grafana 监控**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## 📋 可用脚本

### 设置与开发
```bash
# 完整环境设置
./scripts/setup.sh

# 构建所有组件
./scripts/build.sh

# 部署到 Kubernetes
./scripts/deploy.sh

# 运行所有测试
./scripts/test.sh
```

### 前端脚本
```bash
cd frontend

# 开发服务器
npm run dev

# 生产构建
npm run build

# 运行测试
npm test

# 运行 E2E 测试
npm run test:e2e

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 后端脚本
```bash
cd backend

# 运行应用
mvn spring-boot:run

# 运行测试
mvn test

# 运行集成测试
mvn verify -Pintegration-tests

# 构建 JAR
mvn clean package

# 生成文档
mvn javadoc:javadoc
```

## 🧪 测试

### 运行所有测试
```bash
./scripts/test.sh
```

### 运行特定类型的测试
```bash
# 仅单元测试
./scripts/test.sh unit

# 集成测试
./scripts/test.sh integration

# E2E 测试
./scripts/test.sh e2e

# 性能测试
./scripts/test.sh performance

# 安全测试
./scripts/test.sh security
```

### 测试覆盖率
- **前端**: Jest + React Testing Library
- **后端**: JUnit 5 + Mockito + Testcontainers
- **E2E**: Playwright
- **性能**: k6
- **安全**: OWASP ZAP

## 🚀 部署

### Docker 部署
```bash
# 构建并启动所有服务
docker-compose up -d

# 扩展服务
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Kubernetes 部署
```bash
# 部署到 Kubernetes
./scripts/deploy.sh -e production

# 或手动部署：
kubectl apply -f k8s/
```

### 环境配置
创建特定环境的 `.env` 文件：

```bash
# 开发环境
cp .env.example .env

# 预发布环境
cp .env.example .env.staging

# 生产环境
cp .env.example .env.production
```

## 📊 监控

### 指标与仪表板
- **应用指标**: 自定义业务指标
- **系统指标**: CPU、内存、磁盘、网络
- **数据库指标**: 连接池、查询性能
- **缓存指标**: 命中率、内存使用
- **安全指标**: 登录失败次数、限流统计

### 告警规则
- **高错误率**: 5分钟内错误率 > 5%
- **高响应时间**: 5分钟内平均响应时间 > 500ms
- **服务宕机**: 1分钟内服务不可用
- **高 CPU 使用**: 10分钟内 CPU > 80%
- **高内存使用**: 10分钟内内存 > 85%

## 🔒 安全

### 认证与授权
- JWT 令牌与刷新机制
- 基于角色的访问控制 (RBAC)
- bcrypt 密码哈希
- Redis 会话管理

### 安全头
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

### 数据保护
- 输入验证和清理
- SQL 注入防护
- XSS 防护
- CSRF 防护
- 限流保护
- 敏感数据加密

## 📚 API 文档

### Swagger/OpenAPI
访问 http://localhost:8080/swagger-ui.html 查看交互式 API 文档。

### 主要端点
```
POST   /api/auth/login          # 用户登录
POST   /api/auth/refresh        # 刷新令牌
POST   /api/auth/logout         # 用户登出
GET    /api/users/profile       # 获取用户资料
PUT    /api/users/profile       # 更新用户资料
GET    /api/users               # 用户列表（管理员）
POST   /api/users               # 创建用户（管理员）
GET    /actuator/health         # 健康检查
GET    /actuator/metrics        # 应用指标
```

## 🤝 贡献

### 开发流程
1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

### 代码规范
- **前端**: ESLint + Prettier
- **后端**: Checkstyle + SpotBugs
- **提交信息**: Conventional Commits
- **测试**: 最低 80% 覆盖率
- **文档**: 公共 API 需要 JSDoc/Javadoc

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

### 文档
- [API 文档](docs/api.md)
- [部署指南](docs/deployment.md)
- [安全指南](docs/security.md)
- [监控指南](docs/monitoring.md)

### 获取帮助
- 📧 邮箱: support@example.com
- 💬 Slack: #secure-api-system
- 🐛 问题: [GitHub Issues](https://github.com/your-username/secure-api-system/issues)

### 常见问题
**Q: 如何重置数据库？**
A: 运行 `docker-compose down -v && docker-compose up -d`

**Q: 如何添加新的用户角色？**
A: 更新后端的 `Role` 枚举并运行数据库迁移。

**Q: 如何配置 HTTPS？**
A: 更新 Nginx 配置并添加 SSL 证书。

---

**由 Secure API System 团队用 ❤️ 构建**

### 环境要求
- Java 11+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 后端启动
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

## API文档

启动后端服务后，访问 Swagger UI：
- 开发环境: http://localhost:8080/swagger-ui.html
- API文档: http://localhost:8080/v3/api-docs

## 部署指南

### Docker部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 生产部署
详见 [部署指南](docs/deployment.md)

## 开发指南

- [后端开发指南](docs/backend-development.md)
- [前端开发指南](docs/frontend-development.md)
- [API安全规范](docs/api-security.md)
- [测试指南](docs/testing.md)

## 许可证

MIT License