# 开发指南

本文档为安全API系统的开发指南，包含代码规范、开发流程、测试指南和最佳实践。

## 目录
- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [开发流程](#开发流程)
- [后端开发指南](#后端开发指南)
- [前端开发指南](#前端开发指南)
- [API设计规范](#api设计规范)
- [数据库设计规范](#数据库设计规范)
- [安全开发规范](#安全开发规范)
- [测试指南](#测试指南)
- [性能优化](#性能优化)

## 开发环境搭建

### 必需工具
- **IDE**: IntelliJ IDEA (后端) + VS Code (前端)
- **版本控制**: Git
- **API测试**: Postman 或 Insomnia
- **数据库工具**: MySQL Workbench 或 DBeaver
- **Redis工具**: RedisInsight

### 推荐插件

#### IntelliJ IDEA插件
- Lombok
- MyBatis Log Plugin
- SonarLint
- CheckStyle-IDEA
- Spring Boot Helper

#### VS Code插件
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

### 环境配置

#### Git配置
```bash
# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# 配置编辑器
git config --global core.editor "code --wait"

# 配置换行符
git config --global core.autocrlf input  # Linux/Mac
git config --global core.autocrlf true   # Windows

# 配置别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

#### 代码格式化配置
```bash
# 安装pre-commit hooks
npm install -g husky lint-staged

# 项目根目录创建 .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

## 代码规范

### Java代码规范

#### 命名规范
```java
// 类名：大驼峰命名法
public class UserService {
    
    // 常量：全大写，下划线分隔
    private static final String DEFAULT_PASSWORD = "123456";
    
    // 变量和方法：小驼峰命名法
    private String userName;
    
    public void getUserInfo() {
        // 局部变量：小驼峰命名法
        String userEmail = "user@example.com";
    }
}

// 包名：全小写，点分隔
package com.siku.service.impl;
```

#### 注释规范
```java
/**
 * 用户服务接口
 * 
 * @author SiKu Team
 * @version 1.0
 * @since 2024-01-01
 */
public interface UserService {
    
    /**
     * 根据用户ID获取用户信息
     * 
     * @param userId 用户ID，不能为null
     * @return 用户信息，如果用户不存在返回null
     * @throws IllegalArgumentException 当userId为null时抛出
     */
    User getUserById(Long userId);
    
    /**
     * 创建新用户
     * 
     * @param userRequest 用户创建请求对象
     * @return 创建成功的用户信息
     * @throws UserAlreadyExistsException 当用户名已存在时抛出
     * @throws ValidationException 当请求参数验证失败时抛出
     */
    User createUser(UserCreateRequest userRequest);
}
```

#### 异常处理规范
```java
@Service
public class UserServiceImpl implements UserService {
    
    @Override
    public User getUserById(Long userId) {
        // 参数验证
        if (userId == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        
        try {
            User user = userMapper.selectById(userId);
            if (user == null) {
                throw new UserNotFoundException("用户不存在: " + userId);
            }
            return user;
        } catch (DataAccessException e) {
            log.error("查询用户信息失败, userId: {}", userId, e);
            throw new ServiceException("查询用户信息失败", e);
        }
    }
}
```

### TypeScript代码规范

#### 命名规范
```typescript
// 接口：大驼峰命名法，以I开头
interface IUserInfo {
  id: number;
  username: string;
  email: string;
}

// 类型：大驼峰命名法
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

// 枚举：大驼峰命名法
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

// 常量：全大写，下划线分隔
const API_BASE_URL = 'http://localhost:8080/api';

// 变量和函数：小驼峰命名法
const userName = 'admin';

function getUserInfo(userId: number): Promise<IUserInfo> {
  return apiClient.get(`/users/${userId}`);
}

// 组件：大驼峰命名法
const UserProfile: React.FC<IUserProfileProps> = ({ user }) => {
  return <div>{user.username}</div>;
};
```

#### 类型定义规范
```typescript
// API响应类型
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  traceId?: string;
}

// 请求参数类型
interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  phone?: string;
  nickname?: string;
  roles: UserRole[];
}

// 组件Props类型
interface UserListProps {
  users: IUserInfo[];
  loading?: boolean;
  onUserSelect?: (user: IUserInfo) => void;
  onUserDelete?: (userId: number) => void;
}

// Hook返回类型
interface UseUserListReturn {
  users: IUserInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  deleteUser: (userId: number) => Promise<void>;
}
```

## 开发流程

### Git工作流

#### 分支策略
```
main (生产分支)
├── develop (开发分支)
│   ├── feature/user-management (功能分支)
│   ├── feature/security-audit (功能分支)
│   └── bugfix/login-issue (修复分支)
├── release/v1.0.0 (发布分支)
└── hotfix/critical-security-fix (热修复分支)
```

#### 提交信息规范
```bash
# 格式：<type>(<scope>): <subject>

# 类型说明：
# feat: 新功能
# fix: 修复bug
# docs: 文档更新
# style: 代码格式调整
# refactor: 代码重构
# test: 测试相关
# chore: 构建过程或辅助工具的变动

# 示例：
git commit -m "feat(user): 添加用户管理功能"
git commit -m "fix(auth): 修复JWT token过期问题"
git commit -m "docs(api): 更新API文档"
git commit -m "refactor(security): 重构安全验证逻辑"
```

#### 代码审查清单
- [ ] 代码符合项目规范
- [ ] 功能实现正确
- [ ] 异常处理完善
- [ ] 单元测试覆盖
- [ ] 性能考虑
- [ ] 安全性检查
- [ ] 文档更新

## 后端开发指南

### 项目结构
```
src/main/java/com/siku/
├── SecureApiApplication.java          # 启动类
├── config/                           # 配置类
│   ├── SecurityConfig.java          # 安全配置
│   ├── RedisConfig.java             # Redis配置
│   └── SwaggerConfig.java           # API文档配置
├── controller/                       # 控制器层
│   ├── AuthController.java          # 认证控制器
│   ├── UserController.java          # 用户控制器
│   └── SecurityAuditController.java # 安全审计控制器
├── service/                          # 服务层
│   ├── UserService.java             # 用户服务接口
│   ├── impl/                        # 服务实现
│   │   └── UserServiceImpl.java     # 用户服务实现
│   ├── CaptchaService.java          # 验证码服务
│   ├── EmailService.java            # 邮件服务
│   └── SecurityAuditService.java    # 安全审计服务
├── entity/                           # 实体类
│   ├── User.java                    # 用户实体
│   └── SecurityAuditLog.java        # 安全审计日志实体
├── dto/                              # 数据传输对象
│   ├── request/                      # 请求DTO
│   └── response/                     # 响应DTO
├── mapper/                           # MyBatis映射器
│   ├── UserMapper.java              # 用户映射器
│   └── SecurityAuditLogMapper.java  # 审计日志映射器
├── security/                         # 安全组件
│   ├── JwtAuthenticationFilter.java # JWT认证过滤器
│   ├── JwtTokenProvider.java        # JWT工具类
│   └── CustomUserDetailsService.java # 用户详情服务
├── common/                           # 公共组件
│   ├── ApiResponse.java             # 统一响应格式
│   ├── ResponseCode.java            # 响应状态码
│   └── exception/                   # 异常定义
└── utils/                            # 工具类
    ├── SecurityUtils.java           # 安全工具类
    └── ValidationUtils.java         # 验证工具类
```

### 开发最佳实践

#### 1. 控制器层开发
```java
@RestController
@RequestMapping("/api/users")
@Api(tags = "用户管理")
@Validated
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/{id}")
    @ApiOperation("获取用户详情")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ApiResponse<UserResponse> getUserById(
            @PathVariable @Min(1) Long id) {
        
        UserResponse user = userService.getUserById(id);
        return ApiResponse.success(user);
    }
    
    @PostMapping
    @ApiOperation("创建用户")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> createUser(
            @RequestBody @Valid UserCreateRequest request) {
        
        UserResponse user = userService.createUser(request);
        return ApiResponse.success(user);
    }
}
```

#### 2. 服务层开发
```java
@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final SecurityAuditService auditService;
    
    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        // 1. 参数验证
        validateUserCreateRequest(request);
        
        // 2. 检查用户名是否已存在
        if (userMapper.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("用户名已存在");
        }
        
        // 3. 创建用户实体
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setStatus(UserStatus.ACTIVE);
        
        // 4. 保存用户
        userMapper.insert(user);
        
        // 5. 记录审计日志
        auditService.logUserCreation(user);
        
        // 6. 返回响应
        return UserResponse.from(user);
    }
    
    private void validateUserCreateRequest(UserCreateRequest request) {
        if (!ValidationUtils.isValidEmail(request.getEmail())) {
            throw new ValidationException("邮箱格式不正确");
        }
        
        if (!ValidationUtils.isStrongPassword(request.getPassword())) {
            throw new ValidationException("密码强度不足");
        }
    }
}
```

#### 3. 数据访问层开发
```java
@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * 根据用户名查询用户
     */
    @Select("SELECT * FROM users WHERE username = #{username} AND deleted = 0")
    User findByUsername(@Param("username") String username);
    
    /**
     * 检查用户名是否存在
     */
    @Select("SELECT COUNT(1) FROM users WHERE username = #{username} AND deleted = 0")
    boolean existsByUsername(@Param("username") String username);
    
    /**
     * 分页查询用户列表
     */
    IPage<User> selectUserPage(IPage<User> page, @Param("query") UserQueryRequest query);
    
    /**
     * 批量更新用户状态
     */
    @Update("UPDATE users SET status = #{status} WHERE id IN (${userIds})")
    int batchUpdateStatus(@Param("userIds") String userIds, @Param("status") UserStatus status);
}
```

## 前端开发指南

### 项目结构
```
src/
├── components/                    # 可复用组件
│   ├── common/                   # 通用组件
│   │   ├── Layout/              # 布局组件
│   │   ├── Loading/             # 加载组件
│   │   └── ErrorBoundary/       # 错误边界
│   ├── forms/                   # 表单组件
│   └── charts/                  # 图表组件
├── pages/                        # 页面组件
│   ├── auth/                    # 认证页面
│   │   ├── Login/              # 登录页面
│   │   └── Register/           # 注册页面
│   ├── user/                    # 用户管理页面
│   └── security/                # 安全管理页面
├── hooks/                        # 自定义Hooks
│   ├── useAuth.ts              # 认证Hook
│   ├── useApi.ts               # API调用Hook
│   └── useLocalStorage.ts      # 本地存储Hook
├── services/                     # API服务
│   ├── api.ts                  # API客户端配置
│   ├── auth.ts                 # 认证API
│   ├── user.ts                 # 用户API
│   └── security.ts             # 安全API
├── store/                        # 状态管理
│   ├── index.ts                # Store配置
│   ├── slices/                 # Redux Slices
│   │   ├── authSlice.ts        # 认证状态
│   │   ├── userSlice.ts        # 用户状态
│   │   └── uiSlice.ts          # UI状态
│   └── middleware/             # 中间件
├── utils/                        # 工具函数
│   ├── constants.ts            # 常量定义
│   ├── helpers.ts              # 辅助函数
│   ├── validation.ts           # 验证函数
│   └── encryption.ts           # 加密工具
├── types/                        # TypeScript类型定义
│   ├── api.ts                  # API类型
│   ├── user.ts                 # 用户类型
│   └── common.ts               # 通用类型
└── styles/                       # 样式文件
    ├── globals.css             # 全局样式
    ├── variables.css           # CSS变量
    └── components/             # 组件样式
```

### 开发最佳实践

#### 1. 组件开发
```typescript
// UserList.tsx
interface UserListProps {
  users: IUserInfo[];
  loading?: boolean;
  onUserSelect?: (user: IUserInfo) => void;
  onUserDelete?: (userId: number) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  loading = false,
  onUserSelect,
  onUserDelete
}) => {
  const handleUserClick = useCallback((user: IUserInfo) => {
    onUserSelect?.(user);
  }, [onUserSelect]);
  
  const handleDeleteClick = useCallback((userId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      onOk: () => onUserDelete?.(userId)
    });
  }, [onUserDelete]);
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <Table
      dataSource={users}
      rowKey="id"
      columns={[
        {
          title: '用户名',
          dataIndex: 'username',
          key: 'username'
        },
        {
          title: '邮箱',
          dataIndex: 'email',
          key: 'email'
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          render: (status: UserStatus) => (
            <Tag color={getStatusColor(status)}>
              {getStatusText(status)}
            </Tag>
          )
        },
        {
          title: '操作',
          key: 'actions',
          render: (_, user) => (
            <Space>
              <Button 
                type="link" 
                onClick={() => handleUserClick(user)}
              >
                查看
              </Button>
              <Button 
                type="link" 
                danger 
                onClick={() => handleDeleteClick(user.id)}
              >
                删除
              </Button>
            </Space>
          )
        }
      ]}
    />
  );
};

export default UserList;
```

#### 2. 自定义Hook开发
```typescript
// useUserList.ts
interface UseUserListOptions {
  pageSize?: number;
  autoRefresh?: boolean;
}

interface UseUserListReturn {
  users: IUserInfo[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    total: number;
    pageSize: number;
  };
  refresh: () => void;
  loadPage: (page: number) => void;
  deleteUser: (userId: number) => Promise<void>;
}

export const useUserList = (options: UseUserListOptions = {}): UseUserListReturn => {
  const { pageSize = 10, autoRefresh = false } = options;
  
  const [users, setUsers] = useState<IUserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pageSize
  });
  
  const loadUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userApi.getUserList({
        page,
        size: pageSize
      });
      
      setUsers(response.data.records);
      setPagination({
        current: page,
        total: response.data.total,
        pageSize
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);
  
  const deleteUser = useCallback(async (userId: number) => {
    try {
      await userApi.deleteUser(userId);
      message.success('删除成功');
      loadUsers(pagination.current);
    } catch (err) {
      message.error('删除失败');
      throw err;
    }
  }, [loadUsers, pagination.current]);
  
  const refresh = useCallback(() => {
    loadUsers(pagination.current);
  }, [loadUsers, pagination.current]);
  
  const loadPage = useCallback((page: number) => {
    loadUsers(page);
  }, [loadUsers]);
  
  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);
  
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refresh]);
  
  return {
    users,
    loading,
    error,
    pagination,
    refresh,
    loadPage,
    deleteUser
  };
};
```

#### 3. API服务开发
```typescript
// userApi.ts
class UserApi {
  private client: AxiosInstance;
  
  constructor(client: AxiosInstance) {
    this.client = client;
  }
  
  async getUserList(params: UserListParams): Promise<ApiResponse<PageResult<IUserInfo>>> {
    const response = await this.client.get('/users', { params });
    return response.data;
  }
  
  async getUserById(id: number): Promise<ApiResponse<IUserInfo>> {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }
  
  async createUser(data: UserCreateRequest): Promise<ApiResponse<IUserInfo>> {
    const response = await this.client.post('/users', data);
    return response.data;
  }
  
  async updateUser(id: number, data: UserUpdateRequest): Promise<ApiResponse<IUserInfo>> {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }
  
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }
}

export const userApi = new UserApi(apiClient);
```

## API设计规范

### RESTful API设计原则

#### 1. URL设计
```
# 资源命名使用复数名词
GET    /api/users              # 获取用户列表
POST   /api/users              # 创建用户
GET    /api/users/{id}         # 获取特定用户
PUT    /api/users/{id}         # 更新特定用户
DELETE /api/users/{id}         # 删除特定用户

# 嵌套资源
GET    /api/users/{id}/roles   # 获取用户角色
POST   /api/users/{id}/roles   # 为用户添加角色

# 操作资源
POST   /api/users/{id}/enable  # 启用用户
POST   /api/users/{id}/disable # 禁用用户
POST   /api/users/{id}/reset-password # 重置密码
```

#### 2. HTTP状态码使用
```
200 OK                 # 请求成功
201 Created           # 资源创建成功
204 No Content        # 请求成功但无返回内容
400 Bad Request       # 请求参数错误
401 Unauthorized      # 未认证
403 Forbidden         # 权限不足
404 Not Found         # 资源不存在
409 Conflict          # 资源冲突
422 Unprocessable Entity # 参数验证失败
429 Too Many Requests # 请求频率过高
500 Internal Server Error # 服务器内部错误
```

#### 3. 请求和响应格式
```json
// 请求格式
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "roles": ["USER"]
}

// 成功响应格式
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "username": "newuser",
    "email": "newuser@example.com",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "traceId": "abc123"
}

// 错误响应格式
{
  "code": 400,
  "message": "参数验证失败",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "traceId": "abc123"
}
```

## 安全开发规范

### 1. 输入验证
```java
// 后端验证
@PostMapping("/users")
public ApiResponse<UserResponse> createUser(
        @RequestBody @Valid UserCreateRequest request) {
    
    // 额外的业务验证
    if (!SecurityUtils.isValidPassword(request.getPassword())) {
        throw new ValidationException("密码不符合安全要求");
    }
    
    // XSS防护
    String cleanUsername = SecurityUtils.cleanXSS(request.getUsername());
    request.setUsername(cleanUsername);
    
    return userService.createUser(request);
}
```

```typescript
// 前端验证
const validateForm = (values: UserCreateForm) => {
  const errors: FormErrors = {};
  
  if (!values.username) {
    errors.username = '用户名不能为空';
  } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(values.username)) {
    errors.username = '用户名只能包含字母、数字和下划线，长度3-20位';
  }
  
  if (!values.email) {
    errors.email = '邮箱不能为空';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = '邮箱格式不正确';
  }
  
  if (!values.password) {
    errors.password = '密码不能为空';
  } else if (!isStrongPassword(values.password)) {
    errors.password = '密码必须包含大小写字母、数字和特殊字符，长度至少8位';
  }
  
  return errors;
};
```

### 2. 权限控制
```java
// 方法级权限控制
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public UserResponse updateUser(Long userId, UserUpdateRequest request) {
    // 实现逻辑
}

// 数据级权限控制
@PostFilter("hasRole('ADMIN') or filterObject.userId == authentication.principal.id")
public List<UserData> getUserData() {
    // 实现逻辑
}
```

### 3. 敏感数据处理
```java
// 密码加密
@Service
public class PasswordService {
    
    private final PasswordEncoder passwordEncoder;
    
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}

// 敏感信息脱敏
public class SecurityUtils {
    
    public static String maskEmail(String email) {
        if (StringUtils.isEmpty(email)) {
            return email;
        }
        
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return email;
        }
        
        String username = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        
        if (username.length() <= 2) {
            return username.charAt(0) + "*" + domain;
        }
        
        return username.charAt(0) + "***" + username.charAt(username.length() - 1) + domain;
    }
}
```

## 测试指南

### 1. 单元测试
```java
// 服务层测试
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {
    
    @Mock
    private UserMapper userMapper;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    @Test
    void createUser_Success() {
        // Given
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        
        when(userMapper.existsByUsername("testuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password");
        
        // When
        UserResponse result = userService.createUser(request);
        
        // Then
        assertThat(result.getUsername()).isEqualTo("testuser");
        verify(userMapper).insert(any(User.class));
    }
    
    @Test
    void createUser_UserAlreadyExists_ThrowsException() {
        // Given
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername("existinguser");
        
        when(userMapper.existsByUsername("existinguser")).thenReturn(true);
        
        // When & Then
        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(UserAlreadyExistsException.class)
            .hasMessage("用户名已存在");
    }
}
```

### 2. 集成测试
```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.yml")
class UserControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private UserMapper userMapper;
    
    @Test
    void createUser_Success() {
        // Given
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername("integrationtest");
        request.setPassword("Password123!");
        request.setEmail("integration@test.com");
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(getAdminToken());
        
        HttpEntity<UserCreateRequest> entity = new HttpEntity<>(request, headers);
        
        // When
        ResponseEntity<ApiResponse> response = restTemplate.postForEntity(
            "/api/users", entity, ApiResponse.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getCode()).isEqualTo(200);
        
        // 验证数据库中的数据
        User savedUser = userMapper.findByUsername("integrationtest");
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo("integration@test.com");
    }
}
```

### 3. 前端测试
```typescript
// 组件测试
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import UserList from './UserList';

const mockUsers: IUserInfo[] = [
  {
    id: 1,
    username: 'testuser1',
    email: 'test1@example.com',
    status: 'ACTIVE'
  },
  {
    id: 2,
    username: 'testuser2',
    email: 'test2@example.com',
    status: 'INACTIVE'
  }
];

describe('UserList', () => {
  it('renders user list correctly', () => {
    render(
      <Provider store={store}>
        <UserList users={mockUsers} />
      </Provider>
    );
    
    expect(screen.getByText('testuser1')).toBeInTheDocument();
    expect(screen.getByText('testuser2')).toBeInTheDocument();
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
  });
  
  it('calls onUserDelete when delete button is clicked', async () => {
    const mockOnUserDelete = jest.fn();
    
    render(
      <Provider store={store}>
        <UserList users={mockUsers} onUserDelete={mockOnUserDelete} />
      </Provider>
    );
    
    const deleteButtons = screen.getAllByText('删除');
    fireEvent.click(deleteButtons[0]);
    
    // 确认删除对话框
    const confirmButton = screen.getByText('确定');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockOnUserDelete).toHaveBeenCalledWith(1);
    });
  });
});

// API测试
import { userApi } from '../services/user';
import { mockApiClient } from '../__mocks__/api';

jest.mock('../services/api', () => ({
  apiClient: mockApiClient
}));

describe('userApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('getUserList returns user list', async () => {
    const mockResponse = {
      data: {
        code: 200,
        data: {
          records: mockUsers,
          total: 2
        }
      }
    };
    
    mockApiClient.get.mockResolvedValue(mockResponse);
    
    const result = await userApi.getUserList({ page: 1, size: 10 });
    
    expect(mockApiClient.get).toHaveBeenCalledWith('/users', {
      params: { page: 1, size: 10 }
    });
    expect(result.data.records).toEqual(mockUsers);
  });
});
```

## 性能优化

### 1. 后端性能优化
```java
// 数据库查询优化
@Service
public class UserServiceImpl implements UserService {
    
    // 使用缓存
    @Cacheable(value = "users", key = "#userId")
    public UserResponse getUserById(Long userId) {
        User user = userMapper.selectById(userId);
        return UserResponse.from(user);
    }
    
    // 批量操作
    @Transactional
    public void batchUpdateUserStatus(List<Long> userIds, UserStatus status) {
        // 分批处理，避免一次性处理过多数据
        int batchSize = 100;
        for (int i = 0; i < userIds.size(); i += batchSize) {
            int end = Math.min(i + batchSize, userIds.size());
            List<Long> batch = userIds.subList(i, end);
            userMapper.batchUpdateStatus(batch, status);
        }
    }
    
    // 异步处理
    @Async
    public CompletableFuture<Void> sendWelcomeEmail(User user) {
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
        return CompletableFuture.completedFuture(null);
    }
}
```

### 2. 前端性能优化
```typescript
// 组件懒加载
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SecurityAudit = lazy(() => import('./pages/SecurityAudit'));

// 使用React.memo优化渲染
const UserListItem = React.memo<UserListItemProps>(({ user, onSelect }) => {
  return (
    <div onClick={() => onSelect(user)}>
      {user.username} - {user.email}
    </div>
  );
});

// 虚拟滚动优化长列表
import { FixedSizeList as List } from 'react-window';

const VirtualUserList: React.FC<{ users: IUserInfo[] }> = ({ users }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <UserListItem user={users[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={users.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};

// 防抖搜索
const useDebounceSearch = (searchTerm: string, delay: number) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);
  
  return debouncedTerm;
};
```

## 联系和支持

如有开发相关问题，请联系：
- 技术负责人: tech-lead@siku.com
- 开发团队: dev-team@siku.com
- 代码审查: code-review@siku.com