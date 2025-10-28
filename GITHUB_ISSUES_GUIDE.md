# GitHub Issues 管理指南

## 📋 概述

本指南详细说明了如何在 `secure-api-system` 项目中有效使用 GitHub Issues 进行项目管理、Bug 跟踪和功能规划。

## 🏷️ Issue 类型和标签系统

### 1. Issue 类型

我们使用以下 Issue 模板：

#### 🐛 Bug Report (`bug_report.yml`)
用于报告系统缺陷和错误

**使用场景：**
- 应用程序崩溃或异常
- 功能不按预期工作
- 性能问题
- 安全漏洞（非关键）

**示例标题：**
- `🐛 用户登录时 JWT Token 过期处理异常`
- `🐛 前端页面在移动设备上显示错误`
- `🐛 数据库连接池配置导致性能下降`

#### 🚀 Feature Request (`feature_request.yml`)
用于提出新功能需求

**使用场景：**
- 新功能开发
- 现有功能增强
- 用户体验改进
- 性能优化

**示例标题：**
- `🚀 添加双因素认证 (2FA) 功能`
- `🚀 实现 API 请求限流机制`
- `🚀 支持 OAuth2 第三方登录`

#### 🔒 Security Report (`security_report.yml`)
用于报告安全相关问题

**使用场景：**
- 安全漏洞报告
- 安全配置改进
- 合规性要求
- 安全最佳实践

**示例标题：**
- `🔒 API 端点缺少权限验证`
- `🔒 敏感数据日志泄露风险`
- `🔒 HTTPS 配置安全加固`

### 2. 标签分类系统

#### 类型标签 (Type)
- `type: bug` 🐛 - 缺陷修复
- `type: feature` 🚀 - 新功能
- `type: enhancement` ✨ - 功能增强
- `type: documentation` 📚 - 文档改进
- `type: refactor` 🔧 - 代码重构
- `type: security` 🔒 - 安全相关
- `type: performance` ⚡ - 性能优化

#### 优先级标签 (Priority)
- `priority: critical` 🔴 - 关键（影响生产环境）
- `priority: high` 🟠 - 高优先级（重要功能）
- `priority: medium` 🟡 - 中等优先级（常规需求）
- `priority: low` 🟢 - 低优先级（优化改进）

#### 状态标签 (Status)
- `status: triage` 🔍 - 待分类
- `status: in-progress` 🔄 - 进行中
- `status: blocked` 🚫 - 被阻塞
- `status: review-needed` 👀 - 需要审查
- `status: testing` 🧪 - 测试中
- `status: ready-for-release` 🚀 - 准备发布

#### 组件标签 (Component)
- `component: backend` 🖥️ - 后端相关
- `component: frontend` 🎨 - 前端相关
- `component: database` 🗄️ - 数据库相关
- `component: security` 🛡️ - 安全相关
- `component: devops` ⚙️ - DevOps 相关
- `component: api` 🔌 - API 相关
- `component: ui/ux` 🎭 - 用户界面/体验

#### 难度标签 (Difficulty)
- `difficulty: beginner` 🟢 - 适合新手
- `difficulty: intermediate` 🟡 - 中等难度
- `difficulty: advanced` 🔴 - 高难度
- `difficulty: expert` ⚫ - 专家级

## 📝 Issue 创建最佳实践

### 1. 标题规范

```markdown
格式: [类型图标] 简洁描述问题或需求

好的示例:
✅ 🐛 用户注册时邮箱验证码发送失败
✅ 🚀 添加 API 请求日志记录功能
✅ 🔒 升级 Spring Security 到最新版本

不好的示例:
❌ 有个 bug
❌ 需要新功能
❌ 系统有问题
```

### 2. 描述内容要求

#### Bug Report 必须包含：
- **环境信息**: 操作系统、浏览器、版本等
- **重现步骤**: 详细的操作步骤
- **预期行为**: 应该发生什么
- **实际行为**: 实际发生了什么
- **错误信息**: 完整的错误日志
- **截图/视频**: 如果适用

#### Feature Request 必须包含：
- **问题陈述**: 要解决什么问题
- **建议解决方案**: 具体的实现建议
- **用例场景**: 使用场景和用户故事
- **验收标准**: 如何验证功能完成
- **优先级说明**: 为什么需要这个功能

### 3. 分配和跟踪

```yaml
Issue 生命周期:
  1. 创建 → 自动标记为 'status: triage'
  2. 分类 → 添加类型、优先级、组件标签
  3. 分配 → 指定负责人和里程碑
  4. 开发 → 标记为 'status: in-progress'
  5. 审查 → 标记为 'status: review-needed'
  6. 测试 → 标记为 'status: testing'
  7. 完成 → 关闭 Issue 并关联 PR
```

## 🎯 项目管理工作流

### 1. Sprint 规划

#### 每两周进行一次 Sprint 规划：

```markdown
## Sprint Planning Checklist

### 准备阶段
- [ ] 回顾上个 Sprint 的完成情况
- [ ] 整理 Product Backlog
- [ ] 评估团队可用时间

### 规划阶段
- [ ] 选择本 Sprint 的 Issues
- [ ] 估算工作量（使用 Story Points）
- [ ] 分配负责人
- [ ] 设置 Sprint 里程碑

### 确认阶段
- [ ] 团队确认 Sprint 目标
- [ ] 更新项目看板
- [ ] 通知相关干系人
```

#### Sprint 里程碑命名规范：
- `Sprint 2024.01` - 2024年第1个Sprint
- `Release v1.2.0` - 版本发布里程碑
- `Security Audit Q1` - 季度安全审计

### 2. 每日站会跟踪

使用 GitHub Projects 看板跟踪进度：

```yaml
看板列配置:
  📋 Backlog:
    - 新创建的 Issues
    - 待分类的问题
    
  🔄 Sprint Backlog:
    - 当前 Sprint 计划的 Issues
    - 已分配但未开始的任务
    
  🚧 In Progress:
    - 正在开发的 Issues
    - 每人最多 2-3 个
    
  👀 Review:
    - 等待代码审查的 Issues
    - 等待测试的功能
    
  ✅ Done:
    - 已完成的 Issues
    - 已合并的 PR
```

### 3. 发布管理

#### 版本发布流程：

```markdown
## Release Process

### 1. 发布准备 (Release Preparation)
- [ ] 创建 Release 里程碑
- [ ] 整理发布说明
- [ ] 完成所有计划功能
- [ ] 通过所有测试

### 2. 发布候选 (Release Candidate)
- [ ] 创建 release/* 分支
- [ ] 部署到预生产环境
- [ ] 执行回归测试
- [ ] 安全扫描通过

### 3. 正式发布 (Production Release)
- [ ] 合并到 main 分支
- [ ] 创建 Git Tag
- [ ] 部署到生产环境
- [ ] 发布公告

### 4. 发布后 (Post Release)
- [ ] 监控系统状态
- [ ] 收集用户反馈
- [ ] 关闭相关 Issues
- [ ] 更新文档
```

## 📊 Issue 模板示例

### 1. 功能开发 Issue 示例

```markdown
# 🚀 实现用户权限管理系统

## 📝 需求描述

作为系统管理员，我希望能够管理用户权限，以便控制不同用户对系统功能的访问。

## 🎯 验收标准

- [ ] 用户可以被分配到不同的角色
- [ ] 角色可以配置不同的权限
- [ ] 权限检查在 API 层面生效
- [ ] 提供权限管理的 Web 界面
- [ ] 支持权限的批量操作

## 🔧 技术要求

- [ ] 后端实现 RBAC 权限模型
- [ ] 前端实现权限管理页面
- [ ] 添加权限相关的单元测试
- [ ] 更新 API 文档

## 📋 子任务

- [ ] #123 设计权限数据模型
- [ ] #124 实现权限检查中间件
- [ ] #125 开发权限管理 API
- [ ] #126 实现前端权限管理界面
- [ ] #127 添加权限相关测试

## 🔗 相关链接

- 设计文档: [权限系统设计](link-to-design-doc)
- API 规范: [权限 API](link-to-api-spec)
- 原型设计: [UI 原型](link-to-prototype)

## 📅 时间安排

- 开始时间: 2024-01-15
- 预计完成: 2024-01-29
- 里程碑: Sprint 2024.02
```

### 2. Bug 修复 Issue 示例

```markdown
# 🐛 用户登录后 Session 异常过期

## 🔍 问题描述

用户在正常使用过程中，Session 会异常过期，导致需要频繁重新登录。

## 🌍 环境信息

- **操作系统**: Windows 10, macOS 12
- **浏览器**: Chrome 120, Firefox 121
- **应用版本**: v1.1.0
- **部署环境**: 生产环境

## 🔄 重现步骤

1. 用户正常登录系统
2. 在系统中进行常规操作（浏览页面、提交表单等）
3. 约 15-20 分钟后，系统提示 Session 过期
4. 用户被强制退出到登录页面

## 🎯 预期行为

Session 应该在配置的超时时间（30分钟）后才过期。

## 🚨 实际行为

Session 在 15-20 分钟后异常过期。

## 📋 错误信息

```
2024-01-10 14:30:25 ERROR [http-nio-8080-exec-5] c.s.s.SessionManager - Session expired: session-id-12345
2024-01-10 14:30:25 WARN  [http-nio-8080-exec-5] c.s.s.AuthFilter - Unauthorized access attempt
```

## 🔧 可能原因

- [ ] Redis Session 存储配置问题
- [ ] Session 超时配置不正确
- [ ] 负载均衡器 Session 粘性问题
- [ ] 时区设置问题

## 📊 影响范围

- **用户影响**: 所有登录用户
- **业务影响**: 用户体验下降，工作效率降低
- **优先级**: High

## 🔗 相关链接

- 相关配置: `application.yml` Session 配置
- 监控数据: [Grafana Dashboard](link-to-dashboard)
- 用户反馈: #120, #118, #115
```

### 3. 安全问题 Issue 示例

```markdown
# 🔒 API 端点缺少速率限制保护

## 🛡️ 安全问题描述

部分 API 端点缺少速率限制保护，可能导致 DDoS 攻击或资源滥用。

## 🎯 受影响的端点

- `POST /api/auth/login`
- `POST /api/users/register`
- `POST /api/password/reset`
- `GET /api/data/export`

## 🚨 潜在风险

- **高**: 暴力破解攻击
- **中**: 资源耗尽攻击
- **中**: 服务可用性影响

## 🔧 建议解决方案

### 1. 实现速率限制
- [ ] 使用 Redis 实现分布式速率限制
- [ ] 配置不同端点的限制策略
- [ ] 实现 IP 和用户级别的限制

### 2. 限制策略建议
```yaml
登录端点: 5次/分钟/IP
注册端点: 3次/分钟/IP
密码重置: 2次/分钟/IP
数据导出: 10次/小时/用户
```

### 3. 监控和告警
- [ ] 添加速率限制监控指标
- [ ] 配置异常访问告警
- [ ] 记录被限制的请求日志

## 📋 实施计划

- [ ] #130 设计速率限制架构
- [ ] #131 实现 Redis 速率限制器
- [ ] #132 配置各端点限制策略
- [ ] #133 添加监控和告警
- [ ] #134 更新 API 文档

## 🔗 参考资料

- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Spring Boot Rate Limiting](https://spring.io/guides/gs/rate-limiting/)
- 内部安全规范: [API 安全标准](link-to-security-standard)

## 📅 时间要求

- **紧急程度**: 高
- **预计工作量**: 3-5 天
- **目标完成**: 2024-01-20
```

## 🤖 自动化和集成

### 1. Issue 自动化规则

```yaml
# .github/workflows/issue-automation.yml
自动化规则:
  新 Issue 创建:
    - 自动添加 'status: triage' 标签
    - 分配给项目负责人进行分类
    
  Bug Report:
    - 自动添加 'type: bug' 标签
    - 如果标记为 'priority: critical'，通知团队
    
  Security Report:
    - 自动添加 'type: security' 标签
    - 立即通知安全团队
    - 设置为私有（如果需要）
    
  Feature Request:
    - 自动添加 'type: feature' 标签
    - 添加到 Product Backlog 项目
```

### 2. 与 PR 的关联

```markdown
## PR 中关联 Issue 的方法

### 关键词关联
- `Fixes #123` - 修复 Issue
- `Closes #123` - 关闭 Issue  
- `Resolves #123` - 解决 Issue
- `Addresses #123` - 处理 Issue

### 部分完成
- `Partially addresses #123` - 部分解决
- `Related to #123` - 相关 Issue
- `See #123` - 参考 Issue
```

### 3. 通知和提醒

```yaml
通知设置:
  关键 Issue:
    - Slack 通知
    - 邮件提醒
    - 移动推送
    
  每日摘要:
    - 新创建的 Issues
    - 逾期的 Issues
    - 需要关注的 Issues
    
  周报统计:
    - Issues 创建/关闭统计
    - 团队成员工作量
    - 项目进度报告
```

## 📈 指标和分析

### 1. 关键指标

```yaml
效率指标:
  - Issue 平均解决时间
  - Bug 修复周期
  - 功能交付周期
  - 代码审查时间

质量指标:
  - Bug 重开率
  - 客户满意度
  - 代码覆盖率
  - 安全漏洞数量

团队指标:
  - 团队成员工作负载
  - 知识分布情况
  - 技能发展轨迹
  - 协作效率
```

### 2. 报告模板

```markdown
## 周度 Issue 报告

### 📊 统计数据
- 新建 Issues: 15
- 已关闭 Issues: 12
- 进行中 Issues: 23
- 逾期 Issues: 3

### 🎯 重点关注
- 高优先级 Bug: 2 个
- 安全相关 Issue: 1 个
- 阻塞性问题: 1 个

### 📈 趋势分析
- Bug 发现率: 下降 10%
- 修复效率: 提升 15%
- 用户反馈: 积极

### 🔄 下周计划
- 重点解决阻塞性问题
- 完成安全审计相关 Issues
- 开始新功能开发
```

---

## 📞 支持和帮助

如果您在使用 Issues 过程中遇到问题：

1. 📖 查看本指南相关章节
2. 🔍 搜索现有的类似 Issues
3. 💬 在团队 Slack 频道询问
4. 📧 联系项目管理员

**让我们一起高效协作！** 🚀