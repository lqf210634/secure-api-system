package com.siku.integration;

import com.siku.BaseIntegrationTest;
import com.siku.dto.LoginRequest;
import com.siku.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 认证API集成测试
 */
@DisplayName("认证API集成测试")
public class AuthIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("用户登录 - 成功")
    public void testLoginSuccess() throws Exception {
        // 生成验证码
        String sessionId = "test-session-123";
        generateTestCaptcha(sessionId, "1234");

        // 准备登录请求
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
        loginRequest.setCaptcha("1234");
        loginRequest.setSessionId(sessionId);

        // 执行登录请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.user.username").value("testuser"))
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"));
    }

    @Test
    @DisplayName("用户登录 - 验证码错误")
    public void testLoginWithInvalidCaptcha() throws Exception {
        // 生成验证码
        String sessionId = "test-session-456";
        generateTestCaptcha(sessionId, "1234");

        // 准备登录请求（错误验证码）
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
        loginRequest.setCaptcha("5678"); // 错误验证码
        loginRequest.setSessionId(sessionId);

        // 执行登录请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("验证码错误"));
    }

    @Test
    @DisplayName("用户登录 - 用户名或密码错误")
    public void testLoginWithInvalidCredentials() throws Exception {
        // 生成验证码
        String sessionId = "test-session-789";
        generateTestCaptcha(sessionId, "1234");

        // 准备登录请求（错误密码）
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrongpassword");
        loginRequest.setCaptcha("1234");
        loginRequest.setSessionId(sessionId);

        // 执行登录请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("用户名或密码错误"));
    }

    @Test
    @DisplayName("用户注册 - 成功")
    public void testRegisterSuccess() throws Exception {
        // 生成验证码
        String sessionId = "test-session-register";
        generateTestCaptcha(sessionId, "1234");

        // 准备注册请求
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setPassword("newpassword123");
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPhone("13700137000");
        registerRequest.setCaptcha("1234");
        registerRequest.setSessionId(sessionId);

        // 执行注册请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("注册成功"));
    }

    @Test
    @DisplayName("用户注册 - 用户名已存在")
    public void testRegisterWithExistingUsername() throws Exception {
        // 生成验证码
        String sessionId = "test-session-register-exist";
        generateTestCaptcha(sessionId, "1234");

        // 准备注册请求（使用已存在的用户名）
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser"); // 已存在的用户名
        registerRequest.setPassword("newpassword123");
        registerRequest.setEmail("newuser2@example.com");
        registerRequest.setPhone("13700137001");
        registerRequest.setCaptcha("1234");
        registerRequest.setSessionId(sessionId);

        // 执行注册请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
    }

    @Test
    @DisplayName("用户登出 - 成功")
    public void testLogoutSuccess() throws Exception {
        // 执行登出请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/logout")
                        .header("Authorization", getUserAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("登出成功"));
    }

    @Test
    @DisplayName("获取验证码 - 成功")
    public void testGetCaptchaSuccess() throws Exception {
        // 执行获取验证码请求
        mockMvc.perform(MockMvcRequestBuilders.get("/api/auth/captcha")
                        .param("sessionId", "test-captcha-session"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));
    }

    @Test
    @DisplayName("刷新验证码 - 成功")
    public void testRefreshCaptchaSuccess() throws Exception {
        // 执行刷新验证码请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/captcha/refresh")
                        .param("sessionId", "test-refresh-session"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));
    }

    @Test
    @DisplayName("验证Token - 成功")
    public void testVerifyTokenSuccess() throws Exception {
        // 执行Token验证请求
        mockMvc.perform(MockMvcRequestBuilders.get("/api/auth/verify")
                        .header("Authorization", getUserAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.roles").isArray());
    }

    @Test
    @DisplayName("验证Token - 无效Token")
    public void testVerifyTokenWithInvalidToken() throws Exception {
        // 执行Token验证请求（无效Token）
        mockMvc.perform(MockMvcRequestBuilders.get("/api/auth/verify")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("访问受保护资源 - 无Token")
    public void testAccessProtectedResourceWithoutToken() throws Exception {
        // 尝试访问受保护的资源（无Token）
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("访问受保护资源 - 有效Token")
    public void testAccessProtectedResourceWithValidToken() throws Exception {
        // 访问受保护的资源（有效Token）
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/profile")
                        .header("Authorization", getUserAuthHeader()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("参数验证 - 缺少必填字段")
    public void testValidationWithMissingFields() throws Exception {
        // 准备不完整的登录请求
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(""); // 空用户名
        loginRequest.setPassword("password123");

        // 执行登录请求
        mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("并发登录测试")
    public void testConcurrentLogin() throws Exception {
        // 生成多个验证码
        for (int i = 0; i < 5; i++) {
            generateTestCaptcha("concurrent-session-" + i, "1234");
        }

        // 并发执行登录请求
        Thread[] threads = new Thread[5];
        for (int i = 0; i < 5; i++) {
            final int index = i;
            threads[i] = new Thread(() -> {
                try {
                    LoginRequest loginRequest = new LoginRequest();
                    loginRequest.setUsername("testuser");
                    loginRequest.setPassword("password123");
                    loginRequest.setCaptcha("1234");
                    loginRequest.setSessionId("concurrent-session-" + index);

                    mockMvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(toJson(loginRequest)))
                            .andExpect(status().isOk());
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
        }

        // 启动所有线程
        for (Thread thread : threads) {
            thread.start();
        }

        // 等待所有线程完成
        for (Thread thread : threads) {
            thread.join();
        }
    }
}