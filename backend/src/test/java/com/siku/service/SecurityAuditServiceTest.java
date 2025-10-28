package com.siku.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.siku.entity.SecurityAuditLog;
import com.siku.mapper.SecurityAuditLogMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * SecurityAuditService 安全审计服务单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("SecurityAuditService 安全审计服务测试")
class SecurityAuditServiceTest {

    @MockBean
    private SecurityAuditLogMapper auditLogMapper;

    private SecurityAuditService securityAuditService;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        securityAuditService = new SecurityAuditService(auditLogMapper);
        request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.100");
        request.addHeader("User-Agent", "Mozilla/5.0 Test Browser");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @Test
    @DisplayName("测试记录安全事件")
    void testLogSecurityEvent() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录安全事件
        securityAuditService.logSecurityEvent(
            SecurityAuditLog.EventType.SECURITY_VIOLATION,
            SecurityAuditLog.EventLevel.HIGH,
            "检测到SQL注入攻击",
            1001L,
            "testuser"
        );
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试记录登录事件")
    void testLogLoginEvent() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录登录事件
        securityAuditService.logLoginEvent(1001L, "testuser", true, "登录成功");
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试记录登出事件")
    void testLogLogoutEvent() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录登出事件
        securityAuditService.logLogoutEvent(1001L, "testuser");
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试记录密码修改事件")
    void testLogPasswordChangeEvent() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录密码修改事件
        securityAuditService.logPasswordChangeEvent(1001L, "testuser", true);
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试记录API访问事件")
    void testLogApiAccessEvent() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录API访问事件
        securityAuditService.logApiAccessEvent(
            "/api/users",
            "GET",
            1001L,
            "testuser",
            200,
            100L
        );
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试记录安全违规事件")
    void testLogSecurityViolationEvent() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录安全违规事件
        securityAuditService.logSecurityViolationEvent(
            "XSS攻击检测",
            "检测到恶意脚本注入",
            SecurityAuditLog.RiskLevel.HIGH,
            1001L,
            "testuser"
        );
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试分页查询审计日志")
    void testGetAuditLogs() {
        // 创建测试数据
        SecurityAuditLog log1 = new SecurityAuditLog();
        log1.setId(1L);
        log1.setEventType(SecurityAuditLog.EventType.LOGIN);
        log1.setDescription("用户登录");
        
        SecurityAuditLog log2 = new SecurityAuditLog();
        log2.setId(2L);
        log2.setEventType(SecurityAuditLog.EventType.LOGOUT);
        log2.setDescription("用户登出");
        
        List<SecurityAuditLog> logs = Arrays.asList(log1, log2);
        
        // Mock分页结果
        Page<SecurityAuditLog> mockPage = new Page<>(1, 10);
        mockPage.setRecords(logs);
        mockPage.setTotal(2);
        
        when(auditLogMapper.selectPage(any(Page.class), any())).thenReturn(mockPage);
        
        // 执行查询
        IPage<SecurityAuditLog> result = securityAuditService.getAuditLogs(
            1, 10, null, null, null, null, null, null
        );
        
        // 验证结果
        assertNotNull(result);
        assertEquals(2, result.getTotal());
        assertEquals(2, result.getRecords().size());
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).selectPage(any(Page.class), any());
    }

    @Test
    @DisplayName("测试获取安全统计信息")
    void testGetSecurityStatistics() {
        // Mock统计数据
        when(auditLogMapper.countByEventType(any())).thenReturn(100L);
        when(auditLogMapper.countFailedLogins(any(), any())).thenReturn(10L);
        when(auditLogMapper.countFailedLoginsByUser(anyLong(), any(), any())).thenReturn(3L);
        when(auditLogMapper.countFailedLoginsByIp(anyString(), any(), any())).thenReturn(5L);
        when(auditLogMapper.countSecurityViolations(any(), any())).thenReturn(2L);
        when(auditLogMapper.countHighRiskEvents(any(), any())).thenReturn(1L);
        
        // 执行统计
        Map<String, Object> statistics = securityAuditService.getSecurityStatistics(
            LocalDateTime.now().minusDays(7),
            LocalDateTime.now(),
            1001L,
            "192.168.1.100"
        );
        
        // 验证结果
        assertNotNull(statistics);
        assertTrue(statistics.containsKey("totalEvents"));
        assertTrue(statistics.containsKey("loginEvents"));
        assertTrue(statistics.containsKey("failedLogins"));
        assertTrue(statistics.containsKey("securityViolations"));
        assertTrue(statistics.containsKey("highRiskEvents"));
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).countByEventType(any());
        verify(auditLogMapper, times(1)).countFailedLogins(any(), any());
    }

    @Test
    @DisplayName("测试清理过期日志")
    void testCleanupExpiredLogs() {
        // Mock删除操作
        when(auditLogMapper.deleteExpiredLogs(any(LocalDateTime.class))).thenReturn(50);
        
        // 执行清理
        int deletedCount = securityAuditService.cleanupExpiredLogs(30);
        
        // 验证结果
        assertEquals(50, deletedCount);
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).deleteExpiredLogs(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("测试获取当前请求信息")
    void testGetCurrentRequestInfo() {
        // 设置请求信息
        request.setRequestURI("/api/test");
        request.setMethod("POST");
        request.addHeader("X-Forwarded-For", "203.0.113.1");
        
        // 这是一个私有方法，我们通过公共方法间接测试
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录事件，这会调用私有方法获取请求信息
        securityAuditService.logSecurityEvent(
            SecurityAuditLog.EventType.API_ACCESS,
            SecurityAuditLog.EventLevel.INFO,
            "API访问测试",
            1001L,
            "testuser"
        );
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试过滤敏感请求参数")
    void testFilterSensitiveParams() {
        // 这是一个私有方法，我们通过包含敏感参数的场景间接测试
        request.setParameter("password", "secret123");
        request.setParameter("token", "jwt-token");
        request.setParameter("username", "testuser");
        
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录事件
        securityAuditService.logApiAccessEvent(
            "/api/login",
            "POST",
            1001L,
            "testuser",
            200,
            100L
        );
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试异步日志记录")
    void testAsyncLogging() throws InterruptedException {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 记录多个事件
        for (int i = 0; i < 5; i++) {
            securityAuditService.logSecurityEvent(
                SecurityAuditLog.EventType.API_ACCESS,
                SecurityAuditLog.EventLevel.INFO,
                "测试事件 " + i,
                1001L,
                "testuser"
            );
        }
        
        // 等待异步操作完成
        Thread.sleep(1000);
        
        // 验证mapper被调用5次
        verify(auditLogMapper, times(5)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试空参数处理")
    void testNullParameterHandling() {
        // Mock mapper操作
        when(auditLogMapper.insert(any(SecurityAuditLog.class))).thenReturn(1);
        
        // 测试null参数
        securityAuditService.logSecurityEvent(
            SecurityAuditLog.EventType.SECURITY_VIOLATION,
            SecurityAuditLog.EventLevel.HIGH,
            null, // null描述
            null, // null用户ID
            null  // null用户名
        );
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).insert(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("测试获取审计日志详情")
    void testGetAuditLogById() {
        // 创建测试数据
        SecurityAuditLog log = new SecurityAuditLog();
        log.setId(1L);
        log.setEventType(SecurityAuditLog.EventType.LOGIN);
        log.setDescription("用户登录");
        
        // Mock查询操作
        when(auditLogMapper.selectById(1L)).thenReturn(log);
        
        // 执行查询
        SecurityAuditLog result = securityAuditService.getAuditLogById(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(SecurityAuditLog.EventType.LOGIN, result.getEventType());
        
        // 验证mapper被调用
        verify(auditLogMapper, times(1)).selectById(1L);
    }
}