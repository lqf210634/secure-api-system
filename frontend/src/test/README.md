# 前端测试文档

## 测试概述

本项目采用 Vitest 作为主要测试框架，配合 React Testing Library 进行组件测试。测试覆盖了单元测试、集成测试、端到端测试和性能测试。

## 测试结构

```
src/test/
├── __tests__/              # 单元测试
│   ├── components/         # 组件测试
│   ├── pages/             # 页面测试
│   ├── store/             # Redux store测试
│   └── api/               # API测试
├── integration/           # 集成测试
│   ├── auth.integration.test.tsx
│   └── api.integration.test.ts
├── e2e/                   # 端到端测试
│   └── user-journey.e2e.test.tsx
├── performance/           # 性能测试
│   └── performance.test.ts
├── mocks/                 # 模拟数据和服务
│   ├── server.ts          # MSW服务器
│   ├── handlers.ts        # API处理器
│   └── fileMock.js        # 文件模拟
├── utils.tsx              # 测试工具函数
├── setup.ts               # 测试环境设置
└── README.md              # 本文档
```

## 测试类型

### 1. 单元测试 (Unit Tests)

测试单个组件、函数或模块的功能。

**位置**: `src/**/__tests__/**/*.test.{ts,tsx}`

**运行命令**:
```bash
npm run test:unit
```

**示例**:
- 组件渲染测试
- 用户交互测试
- 表单验证测试
- Redux action/reducer测试

### 2. 集成测试 (Integration Tests)

测试多个组件或模块之间的交互。

**位置**: `src/test/integration/**/*.test.{ts,tsx}`

**运行命令**:
```bash
npm run test:integration
```

**示例**:
- 认证流程测试
- API集成测试
- 组件间通信测试

### 3. 端到端测试 (E2E Tests)

测试完整的用户流程和应用功能。

**位置**: `src/test/e2e/**/*.test.{ts,tsx}`

**运行命令**:
```bash
npm run test:e2e
```

**示例**:
- 用户注册登录流程
- 管理员操作流程
- 错误处理和恢复

### 4. 性能测试 (Performance Tests)

测试应用的性能指标。

**位置**: `src/test/performance/**/*.test.{ts,tsx}`

**运行命令**:
```bash
npm run test:performance
```

**示例**:
- 组件渲染性能
- 内存使用测试
- 大数据量处理

## 测试命令

### 基本命令

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试UI界面
npm run test:ui

# 监听模式运行测试
npm run test:watch
```

### 分类测试命令

```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e

# 性能测试
npm run test:performance

# CI环境测试（包含覆盖率和JUnit报告）
npm run test:ci
```

### 特定测试

```bash
# 运行特定文件的测试
npx vitest run src/components/__tests__/LoginForm.test.tsx

# 运行匹配模式的测试
npx vitest run --grep "登录"

# 运行特定目录的测试
npx vitest run src/components/__tests__/
```

## 测试配置

### Vitest 配置

主要配置在 `vitest.config.ts` 中：

- **环境**: jsdom (模拟浏览器环境)
- **设置文件**: `src/test/setup.ts`
- **路径别名**: 支持 `@/` 别名
- **覆盖率**: v8 提供商，支持多种报告格式

### 测试环境设置

`src/test/setup.ts` 包含：

- Mock Service Worker (MSW) 设置
- 全局模拟 (localStorage, sessionStorage等)
- 测试清理配置
- 浏览器API模拟

## 模拟服务 (Mocking)

### API 模拟

使用 MSW (Mock Service Worker) 模拟API请求：

```typescript
// 在测试中使用
import { server } from '@/test/mocks/server'
import { rest } from 'msw'

// 覆盖默认处理器
server.use(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.status(401), ctx.json({ error: '登录失败' }))
  })
)
```

### 组件模拟

```typescript
// 模拟第三方组件
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn()
    }
  }
})
```

## 测试工具函数

`src/test/utils.tsx` 提供了常用的测试工具：

### 渲染工具

```typescript
import { renderWithProviders } from '@/test/utils'

// 使用Redux和Router渲染组件
const { getByText } = renderWithProviders(<MyComponent />)
```

### 模拟数据

```typescript
import { 
  mockUser, 
  mockApiResponse, 
  createTestStore 
} from '@/test/utils'

// 创建测试store
const store = createTestStore({
  auth: { user: mockUser, isAuthenticated: true }
})
```

### 异步测试

```typescript
import { waitForAsync } from '@/test/utils'

// 等待异步操作完成
await waitForAsync(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument()
})
```

## 覆盖率要求

项目设置了以下覆盖率阈值：

- **分支覆盖率**: 80%
- **函数覆盖率**: 80%
- **行覆盖率**: 80%
- **语句覆盖率**: 80%

查看覆盖率报告：

```bash
npm run test:coverage
# 报告生成在 coverage/ 目录
# 打开 coverage/index.html 查看详细报告
```

## 最佳实践

### 1. 测试命名

```typescript
describe('LoginForm组件', () => {
  it('应该正确渲染登录表单', () => {
    // 测试实现
  })
  
  it('应该在用户名为空时显示错误信息', () => {
    // 测试实现
  })
})
```

### 2. 测试隔离

```typescript
beforeEach(() => {
  // 每个测试前重置状态
  resetAllMocks()
  localStorage.clear()
})

afterEach(() => {
  // 每个测试后清理
  cleanup()
})
```

### 3. 异步测试

```typescript
it('应该处理异步登录', async () => {
  const user = userEvent.setup()
  
  render(<LoginForm />)
  
  await user.type(screen.getByLabelText('用户名'), 'testuser')
  await user.click(screen.getByRole('button', { name: '登录' }))
  
  await waitFor(() => {
    expect(screen.getByText('登录成功')).toBeInTheDocument()
  })
})
```

### 4. 错误测试

```typescript
it('应该处理网络错误', async () => {
  server.use(
    rest.post('/api/auth/login', (req, res) => {
      return res.networkError('网络连接失败')
    })
  )
  
  // 测试错误处理
})
```

### 5. 可访问性测试

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('应该没有可访问性问题', async () => {
  const { container } = render(<LoginForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## 调试测试

### 1. 调试单个测试

```bash
# 使用调试模式运行特定测试
npx vitest run --inspect-brk src/components/__tests__/LoginForm.test.tsx
```

### 2. 查看渲染结果

```typescript
import { screen } from '@testing-library/react'

it('调试测试', () => {
  render(<MyComponent />)
  
  // 打印当前DOM结构
  screen.debug()
  
  // 打印特定元素
  screen.debug(screen.getByRole('button'))
})
```

### 3. 测试快照

```typescript
it('应该匹配快照', () => {
  const { container } = render(<MyComponent />)
  expect(container.firstChild).toMatchSnapshot()
})
```

## CI/CD 集成

### GitHub Actions 配置

```yaml
- name: 运行测试
  run: npm run test:ci

- name: 上传覆盖率报告
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### 测试报告

CI环境会生成：

- JUnit XML 报告 (`test-results/junit.xml`)
- 覆盖率报告 (`coverage/`)
- 测试结果摘要

## 故障排除

### 常见问题

1. **模块解析错误**
   - 检查 `vitest.config.ts` 中的路径别名配置
   - 确保 `tsconfig.json` 配置正确

2. **异步测试超时**
   - 增加测试超时时间
   - 使用 `waitFor` 等待异步操作

3. **模拟不生效**
   - 确保模拟在测试文件顶部
   - 检查模拟路径是否正确

4. **内存泄漏**
   - 在 `afterEach` 中清理组件
   - 取消未完成的异步操作

### 性能优化

1. **并行测试**
   ```bash
   npx vitest run --threads
   ```

2. **测试分片**
   ```bash
   npx vitest run --shard=1/4
   ```

3. **缓存优化**
   - 使用 Vitest 内置缓存
   - 避免重复的昂贵操作

## 贡献指南

### 添加新测试

1. 确定测试类型和位置
2. 使用适当的测试工具
3. 遵循命名约定
4. 添加必要的文档
5. 确保测试通过且覆盖率达标

### 更新测试

1. 保持测试与代码同步
2. 更新相关的模拟数据
3. 检查测试覆盖率
4. 更新文档

---

更多信息请参考：
- [Vitest 官方文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 文档](https://mswjs.io/docs/)