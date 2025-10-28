# CI/CD 流程文档

## 概述

本文档描述了 Secure API System 的持续集成和持续部署（CI/CD）流程。我们使用 GitHub Actions 作为主要的 CI/CD 平台，结合 Docker 容器化技术实现自动化的构建、测试和部署。

## 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   开发者提交     │    │   GitHub Actions │    │   部署环境       │
│                │    │                │    │                │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Git Push    │ │───▶│ │ CI Pipeline │ │───▶│ │ Staging     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                │    │                │    │                │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Pull Request│ │───▶│ │ CD Pipeline │ │───▶│ │ Production  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## CI/CD 流程

### 1. 持续集成 (CI)

#### 触发条件
- 推送到 `main` 或 `develop` 分支
- 创建或更新 Pull Request

#### 流程步骤

1. **代码检出**
   - 使用 `actions/checkout@v4` 检出代码
   - 获取完整的 Git 历史记录

2. **环境设置**
   - 设置 Node.js 18 环境
   - 设置 Java 17 环境
   - 配置缓存策略

3. **依赖安装**
   - 前端：`npm ci`
   - 后端：Maven 依赖缓存和安装

4. **代码质量检查**
   - ESLint 代码风格检查
   - TypeScript 类型检查
   - SonarCloud 代码质量分析

5. **单元测试**
   - 前端：Vitest 单元测试
   - 后端：JUnit 单元测试
   - 生成测试覆盖率报告

6. **集成测试**
   - 启动测试数据库（MySQL、Redis）
   - 运行集成测试套件
   - API 端到端测试

7. **安全扫描**
   - Trivy 漏洞扫描
   - npm audit 依赖安全检查
   - OWASP 依赖检查

8. **构建应用**
   - 前端：生产构建
   - 后端：Maven 打包

### 2. 持续部署 (CD)

#### 触发条件
- CI 流程成功完成
- 推送到 `main` 分支（生产部署）
- 推送到 `develop` 分支（测试部署）

#### 流程步骤

1. **Docker 镜像构建**
   - 多阶段构建优化
   - 镜像安全扫描
   - 推送到 Docker Hub

2. **部署到测试环境**
   - 自动部署到 Staging 环境
   - 运行冒烟测试
   - 健康检查

3. **部署到生产环境**
   - 手动审批流程
   - 蓝绿部署策略
   - 回滚机制

## 环境配置

### 开发环境 (Development)
- **分支**: `feature/*`, `bugfix/*`
- **部署**: 本地开发环境
- **数据库**: 本地 MySQL/H2
- **特性**: 热重载、调试模式

### 测试环境 (Staging)
- **分支**: `develop`
- **部署**: 自动部署
- **数据库**: 测试数据库
- **特性**: 生产配置、测试数据

### 生产环境 (Production)
- **分支**: `main`
- **部署**: 手动审批
- **数据库**: 生产数据库
- **特性**: 高可用、监控告警

## Docker 配置

### 前端镜像
```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder
# ... 构建步骤

FROM nginx:1.25-alpine AS production
# ... 生产配置
```

### 后端镜像
```dockerfile
# 多阶段构建
FROM maven:3.9-openjdk-17-slim AS builder
# ... 构建步骤

FROM openjdk:17-jre-slim AS production
# ... 生产配置
```

### 镜像优化
- 多阶段构建减少镜像大小
- 非 root 用户运行
- 健康检查配置
- 安全扫描

## 部署策略

### 蓝绿部署
```yaml
# 蓝绿部署配置
deploy:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### 金丝雀部署
```yaml
# 金丝雀部署配置
canary:
  enabled: true
  steps:
    - setWeight: 10
    - pause: {duration: 5m}
    - setWeight: 50
    - pause: {duration: 10m}
    - setWeight: 100
```

## 监控和告警

### Prometheus 指标
- 应用性能指标
- 系统资源指标
- 业务指标

### Grafana 仪表板
- 系统监控仪表板
- 应用监控仪表板
- 安全监控仪表板

### 告警规则
- 服务不可用告警
- 性能异常告警
- 安全事件告警

## 环境变量管理

### GitHub Secrets
```yaml
# 必需的 Secrets
DOCKER_USERNAME: Docker Hub 用户名
DOCKER_PASSWORD: Docker Hub 密码
SONAR_TOKEN: SonarCloud 令牌
SLACK_WEBHOOK: Slack 通知 Webhook
```

### 环境变量
```bash
# 应用配置
APP_TITLE=Secure API System
API_BASE_URL=/api

# 数据库配置
DB_HOST=localhost
DB_USERNAME=apiuser
DB_PASSWORD=secure-password

# 安全配置
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

## 部署命令

### 本地部署
```bash
# 开发环境
./scripts/deploy.sh development

# 使用特定镜像标签
./scripts/deploy.sh development v1.2.3
```

### 生产部署
```bash
# 生产环境部署
./scripts/deploy.sh production v1.2.3

# 强制部署（跳过确认）
./scripts/deploy.sh production v1.2.3 --force

# 回滚部署
./scripts/deploy.sh --rollback
```

### Docker Compose
```bash
# 启动所有服务
docker-compose up -d

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 启动监控服务
docker-compose --profile monitoring up -d

# 查看日志
docker-compose logs -f backend frontend
```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查依赖版本兼容性
   - 验证环境变量配置
   - 查看构建日志

2. **测试失败**
   - 检查测试数据库连接
   - 验证测试环境配置
   - 查看测试报告

3. **部署失败**
   - 检查 Docker 镜像
   - 验证环境变量
   - 查看容器日志

### 调试命令
```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs <container-name>

# 进入容器调试
docker exec -it <container-name> /bin/bash

# 检查网络连接
docker network ls
docker network inspect <network-name>
```

## 性能优化

### 构建优化
- 使用 Docker 构建缓存
- 并行构建和测试
- 依赖缓存策略

### 部署优化
- 镜像分层优化
- 健康检查配置
- 资源限制设置

### 监控优化
- 指标采集频率调整
- 告警阈值优化
- 仪表板性能优化

## 安全最佳实践

### 镜像安全
- 定期更新基础镜像
- 漏洞扫描
- 最小权限原则

### 密钥管理
- 使用 GitHub Secrets
- 定期轮换密钥
- 环境隔离

### 网络安全
- 容器网络隔离
- TLS 加密
- 访问控制

## 备份和恢复

### 数据备份
```bash
# 数据库备份
docker exec mysql mysqldump -u root -p --all-databases > backup.sql

# 文件备份
docker run --rm -v volume_name:/source -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /source .
```

### 恢复流程
```bash
# 数据库恢复
docker exec -i mysql mysql -u root -p < backup.sql

# 文件恢复
docker run --rm -v volume_name:/target -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /target
```

## 版本管理

### 语义化版本
- `MAJOR.MINOR.PATCH`
- 主版本：不兼容的 API 修改
- 次版本：向后兼容的功能性新增
- 修订版本：向后兼容的问题修正

### 发布流程
1. 创建发布分支
2. 更新版本号
3. 生成变更日志
4. 创建 Git 标签
5. 部署到生产环境

## 团队协作

### 分支策略
- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支

### 代码审查
- 所有代码必须经过 PR 审查
- 自动化测试必须通过
- 代码质量检查必须通过

### 发布管理
- 定期发布计划
- 发布前测试
- 发布后监控

## 联系信息

如有问题或建议，请联系：
- 开发团队：dev-team@company.com
- 运维团队：ops-team@company.com
- 项目经理：pm@company.com