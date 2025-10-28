package com.siku;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siku.entity.User;
import com.siku.mapper.UserMapper;
import com.siku.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

/**
 * 集成测试基类
 * 提供通用的测试配置和工具方法
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.yml")
@AutoConfigureWebMvc
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected WebApplicationContext webApplicationContext;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JwtTokenProvider jwtTokenProvider;

    @Autowired
    protected UserMapper userMapper;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected StringRedisTemplate redisTemplate;

    protected MockMvc mockMvc;

    // 测试用户数据
    protected User testUser;
    protected User adminUser;
    protected String userToken;
    protected String adminToken;

    @BeforeEach
    public void setUp() {
        // 配置MockMvc
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        // 清理Redis数据
        cleanRedisData();

        // 创建测试用户
        createTestUsers();

        // 生成测试Token
        generateTestTokens();
    }

    /**
     * 清理Redis测试数据
     */
    protected void cleanRedisData() {
        try {
            redisTemplate.getConnectionFactory().getConnection().flushDb();
        } catch (Exception e) {
            // 忽略清理错误
        }
    }

    /**
     * 创建测试用户
     */
    protected void createTestUsers() {
        // 创建普通用户
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setEmail("test@example.com");
        testUser.setPhone("13800138000");
        testUser.setRoles("USER");
        testUser.setStatus(1);
        testUser.setCreateTime(LocalDateTime.now());
        testUser.setUpdateTime(LocalDateTime.now());
        userMapper.insert(testUser);

        // 创建管理员用户
        adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setEmail("admin@example.com");
        adminUser.setPhone("13900139000");
        adminUser.setRoles("ADMIN,USER");
        adminUser.setStatus(1);
        adminUser.setCreateTime(LocalDateTime.now());
        adminUser.setUpdateTime(LocalDateTime.now());
        userMapper.insert(adminUser);
    }

    /**
     * 生成测试Token
     */
    protected void generateTestTokens() {
        // 生成普通用户Token
        userToken = jwtTokenProvider.generateToken(
                testUser.getUsername(),
                testUser.getId(),
                Arrays.asList("USER")
        );

        // 生成管理员Token
        adminToken = jwtTokenProvider.generateToken(
                adminUser.getUsername(),
                adminUser.getId(),
                Arrays.asList("ADMIN", "USER")
        );
    }

    /**
     * 获取Authorization头
     */
    protected String getAuthorizationHeader(String token) {
        return "Bearer " + token;
    }

    /**
     * 获取普通用户Authorization头
     */
    protected String getUserAuthHeader() {
        return getAuthorizationHeader(userToken);
    }

    /**
     * 获取管理员Authorization头
     */
    protected String getAdminAuthHeader() {
        return getAuthorizationHeader(adminToken);
    }

    /**
     * 将对象转换为JSON字符串
     */
    protected String toJson(Object object) throws Exception {
        return objectMapper.writeValueAsString(object);
    }

    /**
     * 将JSON字符串转换为对象
     */
    protected <T> T fromJson(String json, Class<T> clazz) throws Exception {
        return objectMapper.readValue(json, clazz);
    }

    /**
     * 生成测试验证码
     */
    protected void generateTestCaptcha(String sessionId, String code) {
        redisTemplate.opsForValue().set("captcha:" + sessionId, code.toLowerCase());
    }

    /**
     * 模拟登录状态
     */
    protected void mockLoginSession(String username, String sessionId) {
        redisTemplate.opsForValue().set("session:" + sessionId, username);
    }

    /**
     * 清理测试数据
     */
    protected void cleanTestData() {
        // 清理用户数据
        if (testUser != null && testUser.getId() != null) {
            userMapper.deleteById(testUser.getId());
        }
        if (adminUser != null && adminUser.getId() != null) {
            userMapper.deleteById(adminUser.getId());
        }

        // 清理Redis数据
        cleanRedisData();
    }

    /**
     * 等待异步操作完成
     */
    protected void waitForAsyncOperation() throws InterruptedException {
        Thread.sleep(100); // 等待100ms
    }

    /**
     * 验证响应结果
     */
    protected void assertSuccessResponse(String responseContent) throws Exception {
        assertSuccessResponse(responseContent, null);
    }

    /**
     * 验证成功响应结果
     */
    protected void assertSuccessResponse(String responseContent, String expectedMessage) throws Exception {
        var response = fromJson(responseContent, java.util.Map.class);
        assert response.get("success").equals(true);
        if (expectedMessage != null) {
            assert response.get("message").equals(expectedMessage);
        }
    }

    /**
     * 验证错误响应结果
     */
    protected void assertErrorResponse(String responseContent, String expectedMessage) throws Exception {
        var response = fromJson(responseContent, java.util.Map.class);
        assert response.get("success").equals(false);
        if (expectedMessage != null) {
            assert response.get("message").equals(expectedMessage);
        }
    }
}