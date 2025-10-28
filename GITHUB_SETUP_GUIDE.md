# GitHub 仓库设置指南

## 📋 概述

本指南将帮助您为 `secure-api-system` 项目设置一个完整的 GitHub 仓库，包含最佳实践的配置、安全设置和协作流程。

## 🚀 快速开始

### 1. 创建 GitHub 仓库

```bash
# 方法一：通过 GitHub CLI
gh repo create secure-api-system --public --description "🔐 企业级安全 API 系统 - 基于 Spring Boot + React + Docker + Kubernetes 的全栈安全解决方案"

# 方法二：通过 GitHub 网页界面
# 访问 https://github.com/new
# 仓库名称: secure-api-system
# 描述: 🔐 企业级安全 API 系统 - 基于 Spring Boot + React + Docker + Kubernetes 的全栈安全解决方案
# 可见性: Public
# 不要初始化 README（因为本地已有）
```

### 2. 连接本地仓库到 GitHub

```bash
# 在项目根目录执行
cd d:/wook/secure-api-system

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/secure-api-system.git

# 推送代码到 GitHub
git add .
git commit -m "feat: initial project setup with comprehensive security features"
git branch -M main
git push -u origin main
```

## ⚙️ 仓库设置配置

### 1. 基本设置 (Settings > General)

#### 仓库信息
- **Description**: 🔐 企业级安全 API 系统 - 基于 Spring Boot + React + Docker + Kubernetes 的全栈安全解决方案
- **Website**: https://your-domain.com (可选)
- **Topics**: 
  - `spring-boot`
  - `react`
  - `security`
  - `jwt`
  - `docker`
  - `kubernetes`
  - `api`
  - `microservices`
  - `enterprise`

#### 功能设置
- ✅ **Issues**: 启用问题跟踪
- ✅ **Projects**: 启用项目管理
- ✅ **Wiki**: 启用文档 Wiki
- ✅ **Discussions**: 启用社区讨论
- ✅ **Sponsorships**: 启用赞助（可选）

#### Pull Requests 设置
- ✅ **Allow merge commits**: 允许合并提交
- ✅ **Allow squash merging**: 允许压缩合并（推荐）
- ✅ **Allow rebase merging**: 允许变基合并
- ✅ **Always suggest updating pull request branches**: 建议更新 PR 分支
- ✅ **Allow auto-merge**: 允许自动合并
- ✅ **Automatically delete head branches**: 自动删除已合并的分支

### 2. 分支保护规则 (Settings > Branches)

#### 保护 `main` 分支
```yaml
分支名称模式: main
保护规则:
  ✅ Require a pull request before merging
    ✅ Require approvals (至少 2 个审批)
    ✅ Dismiss stale reviews when new commits are pushed
    ✅ Require review from code owners
  ✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging
    必需的状态检查:
      - backend-test
      - frontend-test
      - security-scan
      - build
  ✅ Require conversation resolution before merging
  ✅ Require signed commits
  ✅ Require linear history
  ✅ Include administrators
  ✅ Restrict pushes that create files larger than 100MB
```

#### 保护 `develop` 分支
```yaml
分支名称模式: develop
保护规则:
  ✅ Require a pull request before merging
    ✅ Require approvals (至少 1 个审批)
  ✅ Require status checks to pass before merging
    必需的状态检查:
      - backend-test
      - frontend-test
  ✅ Require conversation resolution before merging
```

### 3. 安全设置 (Settings > Security)

#### 安全策略
- ✅ **Security policy**: 创建 SECURITY.md 文件
- ✅ **Security advisories**: 启用安全公告
- ✅ **Dependabot alerts**: 启用依赖项安全警报
- ✅ **Dependabot security updates**: 启用自动安全更新
- ✅ **Dependabot version updates**: 启用版本更新

#### 代码扫描
- ✅ **Code scanning**: 启用 CodeQL 分析
- ✅ **Secret scanning**: 启用密钥扫描
- ✅ **Push protection**: 启用推送保护

### 4. 访问权限 (Settings > Manage access)

#### 团队权限设置
```yaml
管理员 (Admin):
  - 项目负责人
  - DevOps 工程师

维护者 (Maintain):
  - 技术负责人
  - 高级开发工程师

写入权限 (Write):
  - 开发工程师
  - 测试工程师

读取权限 (Read):
  - 产品经理
  - 设计师
  - 实习生
```

## 🔧 GitHub Actions 配置

### 1. 工作流文件优化

我们已经配置了以下工作流：

#### 主 CI/CD 工作流 (`.github/workflows/ci-cd.yml`)
- ✅ 多版本矩阵构建 (Java 17/21, Node.js 18/20/22)
- ✅ 跨平台测试 (Ubuntu/Windows)
- ✅ 缓存优化 (Maven/NPM)
- ✅ 代码覆盖率报告
- ✅ Docker 镜像构建和推送
- ✅ 自动部署到不同环境

#### 安全扫描工作流 (`.github/workflows/security-advanced.yml`)
- ✅ CodeQL 静态代码分析
- ✅ Semgrep SAST 扫描
- ✅ Trivy 容器安全扫描
- ✅ OWASP 依赖漏洞检查
- ✅ TruffleHog 密钥泄露检测

### 2. 环境变量和密钥配置

在 `Settings > Secrets and variables > Actions` 中配置：

#### Repository Secrets
```yaml
# Docker Registry
DOCKER_USERNAME: your-docker-username
DOCKER_PASSWORD: your-docker-password
REGISTRY_URL: your-registry-url

# 数据库配置
DB_PASSWORD: your-database-password
REDIS_PASSWORD: your-redis-password

# JWT 配置
JWT_SECRET: your-jwt-secret-key
JWT_REFRESH_SECRET: your-jwt-refresh-secret

# 第三方服务
CODECOV_TOKEN: your-codecov-token
SONAR_TOKEN: your-sonarcloud-token

# 部署配置
KUBE_CONFIG: your-kubernetes-config
SSH_PRIVATE_KEY: your-deployment-ssh-key
```

#### Environment Variables
```yaml
# 应用配置
APP_ENV: production
LOG_LEVEL: info
API_VERSION: v1

# 监控配置
MONITORING_ENABLED: true
METRICS_ENDPOINT: /actuator/metrics
```

## 📝 项目管理配置

### 1. Issues 模板

我们已经创建了以下 Issue 模板：
- 🐛 **Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.yml`)
- 🚀 **Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.yml`)
- 🔒 **Security Report** (`.github/ISSUE_TEMPLATE/security_report.yml`)

### 2. Pull Request 模板

- 📋 **PR Template** (`.github/pull_request_template.md`)
- 包含变更描述、测试清单、安全检查等

### 3. 代码所有者

- 👥 **CODEOWNERS** (`.github/CODEOWNERS`)
- 定义不同模块的代码审查责任人

## 🏷️ 标签管理

### 创建标准化标签

```bash
# 类型标签
gh label create "type: bug" --color "d73a4a" --description "Something isn't working"
gh label create "type: feature" --color "0075ca" --description "New feature or request"
gh label create "type: enhancement" --color "a2eeef" --description "Enhancement to existing feature"
gh label create "type: documentation" --color "0075ca" --description "Documentation improvements"

# 优先级标签
gh label create "priority: critical" --color "b60205" --description "Critical priority"
gh label create "priority: high" --color "d93f0b" --description "High priority"
gh label create "priority: medium" --color "fbca04" --description "Medium priority"
gh label create "priority: low" --color "0e8a16" --description "Low priority"

# 状态标签
gh label create "status: in-progress" --color "fbca04" --description "Work in progress"
gh label create "status: blocked" --color "d73a4a" --description "Blocked by dependencies"
gh label create "status: review-needed" --color "0075ca" --description "Needs review"

# 组件标签
gh label create "component: backend" --color "1d76db" --description "Backend related"
gh label create "component: frontend" --color "5319e7" --description "Frontend related"
gh label create "component: database" --color "006b75" --description "Database related"
gh label create "component: security" --color "b60205" --description "Security related"
gh label create "component: devops" --color "0e8a16" --description "DevOps related"
```

## 📊 项目看板配置

### 1. 创建项目看板

```bash
# 创建项目
gh project create --title "Secure API System Development" --body "Main development board for tracking features, bugs, and improvements"
```

### 2. 看板列配置

```yaml
列名称:
  - 📋 Backlog (待办)
  - 🔄 In Progress (进行中)
  - 👀 In Review (审查中)
  - ✅ Done (完成)
  - 🚀 Released (已发布)
```

## 🔍 监控和分析

### 1. GitHub Insights 配置

- ✅ **Pulse**: 查看项目活动概览
- ✅ **Contributors**: 查看贡献者统计
- ✅ **Community**: 查看社区健康评分
- ✅ **Traffic**: 查看访问统计
- ✅ **Commits**: 查看提交历史分析

### 2. 第三方集成

#### SonarCloud 代码质量
```yaml
# .sonarcloud.properties
sonar.projectKey=your-org_secure-api-system
sonar.organization=your-org
sonar.sources=backend/src/main,frontend/src
sonar.tests=backend/src/test,frontend/src/__tests__
sonar.java.binaries=backend/target/classes
sonar.coverage.jacoco.xmlReportPaths=backend/target/site/jacoco/jacoco.xml
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
```

#### Codecov 覆盖率
```yaml
# codecov.yml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 1%
    patch:
      default:
        target: 70%
```

## 📚 文档和 Wiki

### 1. Wiki 页面结构

```
Home
├── 🏠 项目概述
├── 🚀 快速开始
├── 📖 开发指南
│   ├── 环境搭建
│   ├── 代码规范
│   ├── 测试指南
│   └── 部署流程
├── 🔧 API 文档
├── 🛡️ 安全指南
├── 🐛 故障排除
└── 📝 更新日志
```

### 2. 必要文档文件

- ✅ `README.md` - 项目介绍和快速开始
- ✅ `CONTRIBUTING.md` - 贡献指南
- ✅ `CODE_OF_CONDUCT.md` - 行为准则
- ✅ `SECURITY.md` - 安全政策
- ✅ `CHANGELOG.md` - 更新日志
- ✅ `LICENSE` - 开源许可证

## 🎯 最佳实践建议

### 1. 提交规范

使用 Conventional Commits 规范：

```bash
# 格式: <type>(<scope>): <description>
feat(auth): add JWT token refresh mechanism
fix(api): resolve user registration validation issue
docs(readme): update installation instructions
style(frontend): improve responsive design
refactor(backend): optimize database queries
test(security): add integration tests for encryption
chore(deps): update dependencies to latest versions
```

### 2. 分支策略

```yaml
分支模型: GitFlow
主要分支:
  - main: 生产环境代码
  - develop: 开发环境代码
  
支持分支:
  - feature/*: 功能开发分支
  - release/*: 发布准备分支
  - hotfix/*: 紧急修复分支
  
命名规范:
  - feature/user-authentication
  - release/v1.2.0
  - hotfix/security-patch
```

### 3. 代码审查清单

```markdown
## 代码审查清单

### 功能性
- [ ] 功能是否按预期工作
- [ ] 边界条件是否处理正确
- [ ] 错误处理是否完善

### 安全性
- [ ] 输入验证是否充分
- [ ] 敏感数据是否正确处理
- [ ] 权限检查是否到位

### 性能
- [ ] 是否存在性能瓶颈
- [ ] 数据库查询是否优化
- [ ] 缓存策略是否合理

### 可维护性
- [ ] 代码是否清晰易读
- [ ] 是否遵循项目规范
- [ ] 文档是否完整
```

## 🚨 应急响应流程

### 1. 安全事件响应

```yaml
严重级别: Critical
响应时间: 1小时内
处理流程:
  1. 立即创建 Security Advisory
  2. 通知核心团队成员
  3. 创建 hotfix 分支修复
  4. 紧急发布补丁版本
  5. 更新安全文档
```

### 2. 生产环境故障

```yaml
严重级别: High
响应时间: 2小时内
处理流程:
  1. 创建 Critical Bug Issue
  2. 分配给相关负责人
  3. 实施临时解决方案
  4. 开发永久修复方案
  5. 更新监控和告警
```

## 📈 成功指标

### 1. 代码质量指标

- 🎯 **代码覆盖率**: > 80%
- 🎯 **安全评级**: A 级
- 🎯 **技术债务**: < 5%
- 🎯 **重复代码**: < 3%

### 2. 协作效率指标

- 🎯 **PR 平均审查时间**: < 24小时
- 🎯 **Issue 平均解决时间**: < 72小时
- 🎯 **CI/CD 成功率**: > 95%
- 🎯 **部署频率**: 每周至少 2 次

---

## 📞 支持和联系

如果您在设置过程中遇到任何问题，请：

1. 📖 查看本指南的相关章节
2. 🔍 搜索现有的 Issues
3. 💬 在 Discussions 中提问
4. 📧 联系项目维护者

**祝您使用愉快！** 🎉