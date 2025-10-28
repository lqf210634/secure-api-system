# 安全API系统 - 前端

企业级安全管理平台的现代化前端应用，基于 React 18 + TypeScript + Vite 构建。

## 🚀 技术栈

### 核心框架
- **React 18** - 现代化React框架，支持并发特性
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具

### UI组件库
- **Ant Design 5** - 企业级UI设计语言和组件库
- **Ant Design Icons** - 丰富的图标库
- **@ant-design/colors** - 官方色彩系统

### 状态管理
- **Redux Toolkit** - 现代化的Redux状态管理
- **Redux Persist** - 状态持久化
- **React Redux** - React与Redux的绑定

### 路由管理
- **React Router DOM** - 声明式路由管理

### 网络请求
- **Axios** - HTTP客户端库

### 工具库
- **Day.js** - 轻量级日期处理库
- **Lodash** - 实用工具库
- **Crypto-JS** - 加密解密库
- **js-cookie** - Cookie操作库

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Husky** - Git钩子管理
- **Lint-staged** - 暂存文件检查

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
│   ├── favicon.ico        # 网站图标
│   ├── logo.svg          # 应用Logo
│   ├── manifest.json     # PWA清单
│   ├── robots.txt        # 搜索引擎配置
│   └── sw.js            # Service Worker
├── src/                   # 源代码
│   ├── assets/           # 静态资源
│   ├── components/       # 通用组件
│   │   ├── Layout/      # 布局组件
│   │   └── ProtectedRoute.tsx # 路由保护
│   ├── hooks/           # 自定义Hooks
│   │   ├── useApi.ts    # API请求Hook
│   │   ├── useAuth.ts   # 认证Hook
│   │   └── useLocalStorage.ts # 本地存储Hook
│   ├── pages/           # 页面组件
│   │   ├── Dashboard/   # 仪表板
│   │   ├── Login/       # 登录页
│   │   └── Register/    # 注册页
│   ├── services/        # 服务层
│   │   ├── api.ts       # API配置
│   │   ├── auth.ts      # 认证服务
│   │   └── request.ts   # 请求拦截器
│   ├── store/           # 状态管理
│   │   ├── slices/      # Redux切片
│   │   └── index.ts     # Store配置
│   ├── styles/          # 样式文件
│   │   ├── global.css   # 全局样式
│   │   ├── variables.css # CSS变量
│   │   └── index.ts     # 样式导出
│   ├── types/           # 类型定义
│   ├── utils/           # 工具函数
│   ├── App.tsx          # 应用根组件
│   ├── main.tsx         # 应用入口
│   └── index.css        # 基础样式
├── .env.example         # 环境变量示例
├── .env.development     # 开发环境配置
├── .eslintrc.cjs       # ESLint配置
├── .gitignore          # Git忽略文件
├── .prettierrc         # Prettier配置
├── index.html          # HTML模板
├── package.json        # 项目依赖
├── tsconfig.json       # TypeScript配置
├── tsconfig.node.json  # Node.js TypeScript配置
└── vite.config.ts      # Vite配置
```

## 🛠️ 开发指南

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发服务器
```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或
yarn preview
```

### 代码检查
```bash
npm run lint
# 或
yarn lint
```

### 代码格式化
```bash
npm run format
# 或
yarn format
```

### 类型检查
```bash
npm run type-check
# 或
yarn type-check
```

## 🔧 配置说明

### 环境变量
复制 `.env.example` 为 `.env.development` 并配置相应的环境变量：

```bash
cp .env.example .env.development
```

主要配置项：
- `VITE_API_BASE_URL` - API基础URL
- `VITE_APP_TITLE` - 应用标题
- `VITE_JWT_SECRET_KEY` - JWT密钥
- `VITE_ENABLE_MOCK` - 是否启用Mock数据

### Vite配置
- 开发服务器端口：3000
- API代理：http://localhost:8080
- 路径别名：支持 `@/` 等别名
- 构建优化：代码分割、压缩、Tree Shaking

### TypeScript配置
- 严格模式：启用所有严格检查
- 路径映射：支持绝对路径导入
- 目标版本：ES2020

## 🎨 UI设计

### 设计系统
- 主色调：#1890ff (蓝色)
- 辅助色：#722ed1 (紫色)、#eb2f96 (粉色)
- 成功色：#52c41a (绿色)
- 警告色：#faad14 (橙色)
- 错误色：#ff4d4f (红色)

### 响应式设计
- 移动端：< 768px
- 平板端：768px - 1024px
- 桌面端：> 1024px

### 主题支持
- 浅色主题（默认）
- 深色主题
- 自动切换（跟随系统）

## 🔐 安全特性

### 认证授权
- JWT Token认证
- 刷新Token机制
- 角色权限控制
- 路由级别保护

### 数据安全
- 请求/响应加密
- 敏感数据脱敏
- XSS防护
- CSRF防护

### 输入验证
- 表单验证
- 参数校验
- 文件上传限制
- SQL注入防护

## 📱 PWA支持

### 功能特性
- 离线访问
- 应用安装
- 推送通知
- 后台同步

### Service Worker
- 缓存策略
- 版本管理
- 更新机制
- 降级处理

## 🧪 测试

### 单元测试
```bash
npm run test
# 或
yarn test
```

### 端到端测试
```bash
npm run test:e2e
# 或
yarn test:e2e
```

### 测试覆盖率
```bash
npm run test:coverage
# 或
yarn test:coverage
```

## 📊 性能优化

### 构建优化
- 代码分割
- Tree Shaking
- 资源压缩
- 缓存策略

### 运行时优化
- 懒加载
- 虚拟滚动
- 防抖节流
- 内存管理

### 监控指标
- 首屏加载时间
- 交互响应时间
- 资源加载大小
- 错误率统计

## 🚀 部署

### 构建命令
```bash
npm run build
```

### 部署文件
构建后的文件位于 `dist/` 目录，包含：
- HTML、CSS、JS文件
- 静态资源
- Service Worker
- 配置文件

### 服务器配置
- 支持History路由
- 启用Gzip压缩
- 设置缓存策略
- 配置HTTPS

### Docker部署
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码规范
- 遵循ESLint规则
- 使用Prettier格式化
- 编写TypeScript类型
- 添加单元测试

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具
```

## 📄 许可证

MIT License

## 🆘 支持

如有问题，请提交Issue或联系开发团队。

---

**安全API系统前端** - 企业级安全管理平台