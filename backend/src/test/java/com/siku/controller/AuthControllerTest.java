package com.siku.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siku.dto.request.LoginRequest;
import com.siku.dto.request.RegisterRequest;
import com.siku.dto.response.LoginResponse;
import com.siku.service.CaptchaService;
import com.siku.service.SecurityAuditService;
import com.siku.service.UserService;
import com.siku.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 认证控制器单元测试
 */
@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
@DisplayName("AuthController 认证控制器测试")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private CaptchaService captchaService;

    @MockBean
    private SecurityAuditService securityAuditService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        // 设置默认的mock行为
        doNothing().when(securityAuditService).logLoginEvent(anyLong(), anyString(), anyBoolean(), anyString());
        doNothing().when(securityAuditService).logLogoutEvent(anyLong(), anyString());
        doNothing().when(securityAuditService).logApiAccessEvent(anyString(), anyString(), anyLong(), anyString(), anyInt(), anyLong());
    }

    @Test
    @DisplayName("测试用户登录成功")
    void testLoginSuccess() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
        loginRequest.setCaptchaKey("captcha:test123");
        loginRequest.setCaptchaCode("1234");

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken("jwt-token-123");
        loginResponse.setUserId(1001L);
        loginResponse.setUsername("testuser");

        // Mock服务方法
        when(captchaService.verifyCaptcha("captcha:test123", "1234")).thenReturn(true);
        when(userService.login("testuser", "password123")).thenReturn(loginResponse);

        // 执行请求
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("登录成功"))
                .andExpect(jsonPath("$.data.token").value("jwt-token-123"))
                .andExpect(jsonPath("$.data.userId").value(1001))
                .andExpect(jsonPath("$.data.username").value("testuser"));

        // 验证服务方法被调用
        verify(captchaService, times(1)).verifyCaptcha("captcha:test123", "1234");
        verify(userService, times(1)).login("testuser", "password123");
        verify(securityAuditService, times(1)).logLoginEvent(eq(1001L), eq("testuser"), eq(true), anyString());
    }

    @Test
    @DisplayName("测试用户登录失败 - 验证码错误")
    void testLoginFailInvalidCaptcha() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
        loginRequest.setCaptchaKey("captcha:test123");
        loginRequest.setCaptchaCode("wrong");

        // Mock服务方法
        when(captchaService.verifyCaptcha("captcha:test123", "wrong")).thenReturn(false);

        // 执行请求
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("验证码错误"));

        // 验证服务方法被调用
        verify(captchaService, times(1)).verifyCaptcha("captcha:test123", "wrong");
        verify(userService, never()).login(anyString(), anyString());
    }

    @Test
    @DisplayName("测试用户登录失败 - 用户名或密码错误")
    void testLoginFailInvalidCredentials() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrongpassword");
        loginRequest.setCaptchaKey("captcha:test123");
        loginRequest.setCaptchaCode("1234");

        // Mock服务方法
        when(captchaService.verifyCaptcha("captcha:test123", "1234")).thenReturn(true);
        when(userService.login("testuser", "wrongpassword"))
                .thenThrow(new RuntimeException("用户名或密码错误"));

        // 执行请求
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户名或密码错误"));

        // 验证服务方法被调用
        verify(captchaService, times(1)).verifyCaptcha("captcha:test123", "1234");
        verify(userService, times(1)).login("testuser", "wrongpassword");
    }

    @Test
    @DisplayName("测试用户注册成功")
    void testRegisterSuccess() throws Exception {
        // 准备测试数据
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setCaptchaKey("captcha:test123");
        registerRequest.setCaptchaCode("1234");

        // Mock服务方法
        when(captchaService.verifyCaptcha("captcha:test123", "1234")).thenReturn(true);
        when(userService.register(any(RegisterRequest.class))).thenReturn(1001L);

        // 执行请求
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpected(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("注册成功"))
                .andExpect(jsonPath("$.data").value(1001));

        // 验证服务方法被调用
        verify(captchaService, times(1)).verifyCaptcha("captcha:test123", "1234");
        verify(userService, times(1)).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("测试用户注册失败 - 用户名已存在")
    void testRegisterFailUserExists() throws Exception {
        // 准备测试数据
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("existinguser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("existing@example.com");
        registerRequest.setCaptchaKey("captcha:test123");
        registerRequest.setCaptchaCode("1234");

        // Mock服务方法
        when(captchaService.verifyCaptcha("captcha:test123", "1234")).thenReturn(true);
        when(userService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("用户名已存在"));

        // 执行请求
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("用户名已存在"));

        // 验证服务方法被调用
        verify(captchaService, times(1)).verifyCaptcha("captcha:test123", "1234");
        verify(userService, times(1)).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("测试用户登出")
    @WithMockUser(username = "testuser", authorities = {"USER"})
    void testLogout() throws Exception {
        // 执行请求
        mockMvc.perform(post("/api/auth/logout")
                .with(csrf())
                .header("Authorization", "Bearer jwt-token-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("登出成功"));

        // 验证审计日志被记录
        verify(securityAuditService, times(1)).logLogoutEvent(anyLong(), eq("testuser"));
    }

    @Test
    @DisplayName("测试获取验证码")
    void testGetCaptcha() throws Exception {
        // Mock服务方法
        when(captchaService.generateCaptcha()).thenReturn("captcha:test123");
        when(captchaService.getCaptchaImage("captcha:test123"))
                .thenReturn("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");

        // 执行请求
        mockMvc.perform(get("/api/auth/captcha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.captchaKey").value("captcha:test123"))
                .andExpect(jsonPath("$.data.captchaImage").value("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."));

        // 验证服务方法被调用
        verify(captchaService, times(1)).generateCaptcha();
        verify(captchaService, times(1)).getCaptchaImage("captcha:test123");
    }

    @Test
    @DisplayName("测试刷新验证码")
    void testRefreshCaptcha() throws Exception {
        // Mock服务方法
        when(captchaService.refreshCaptcha("captcha:old123")).thenReturn("captcha:new456");
        when(captchaService.getCaptchaImage("captcha:new456"))
                .thenReturn("data:image/png;base64,newImageData...");

        // 执行请求
        mockMvc.perform(post("/api/auth/captcha/refresh")
                .with(csrf())
                .param("captchaKey", "captcha:old123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.captchaKey").value("captcha:new456"))
                .andExpect(jsonPath("$.data.captchaImage").value("data:image/png;base64,newImageData..."));

        // 验证服务方法被调用
        verify(captchaService, times(1)).refreshCaptcha("captcha:old123");
        verify(captchaService, times(1)).getCaptchaImage("captcha:new456");
    }

    @Test
    @DisplayName("测试验证JWT令牌")
    @WithMockUser(username = "testuser", authorities = {"USER"})
    void testVerifyToken() throws Exception {
        // Mock服务方法
        when(jwtTokenProvider.validateToken("jwt-token-123")).thenReturn(true);
        when(jwtTokenProvider.getUsernameFromToken("jwt-token-123")).thenReturn("testuser");

        // 执行请求
        mockMvc.perform(post("/api/auth/verify")
                .with(csrf())
                .header("Authorization", "Bearer jwt-token-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("令牌有效"))
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.username").value("testuser"));

        // 验证服务方法被调用
        verify(jwtTokenProvider, times(1)).validateToken("jwt-token-123");
        verify(jwtTokenProvider, times(1)).getUsernameFromToken("jwt-token-123");
    }

    @Test
    @DisplayName("测试参数验证失败")
    void testValidationFailure() throws Exception {
        // 准备无效的登录请求（缺少必填字段）
        LoginRequest loginRequest = new LoginRequest();
        // 不设置username和password

        // 执行请求
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));

        // 验证服务方法没有被调用
        verify(userService, never()).login(anyString(), anyString());
    }

    @Test
    @DisplayName("测试无CSRF令牌的请求")
    void testRequestWithoutCsrf() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        // 执行不带CSRF令牌的请求
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());

        // 验证服务方法没有被调用
        verify(userService, never()).login(anyString(), anyString());
    }
}