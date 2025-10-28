package com.siku.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SecurityUtils 工具类单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("SecurityUtils 工具类测试")
class SecurityUtilsTest {

    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @Test
    @DisplayName("测试获取客户端IP地址")
    void testGetClientIpAddress() {
        // 测试 X-Forwarded-For 头
        request.addHeader("X-Forwarded-For", "192.168.1.100, 10.0.0.1");
        String ip = SecurityUtils.getClientIpAddress(request);
        assertEquals("192.168.1.100", ip);

        // 测试 X-Real-IP 头
        request = new MockHttpServletRequest();
        request.addHeader("X-Real-IP", "192.168.1.200");
        ip = SecurityUtils.getClientIpAddress(request);
        assertEquals("192.168.1.200", ip);

        // 测试 Proxy-Client-IP 头
        request = new MockHttpServletRequest();
        request.addHeader("Proxy-Client-IP", "192.168.1.300");
        ip = SecurityUtils.getClientIpAddress(request);
        assertEquals("192.168.1.300", ip);

        // 测试默认远程地址
        request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        ip = SecurityUtils.getClientIpAddress(request);
        assertEquals("127.0.0.1", ip);
    }

    @Test
    @DisplayName("测试XSS攻击检测")
    void testDetectXssAttack() {
        // 测试包含script标签的输入
        assertTrue(SecurityUtils.detectXssAttack("<script>alert('xss')</script>"));
        
        // 测试包含javascript的输入
        assertTrue(SecurityUtils.detectXssAttack("javascript:alert('xss')"));
        
        // 测试包含onload事件的输入
        assertTrue(SecurityUtils.detectXssAttack("<img onload='alert(1)'>"));
        
        // 测试包含iframe的输入
        assertTrue(SecurityUtils.detectXssAttack("<iframe src='evil.com'></iframe>"));
        
        // 测试正常输入
        assertFalse(SecurityUtils.detectXssAttack("这是正常的文本内容"));
        assertFalse(SecurityUtils.detectXssAttack("normal text content"));
    }

    @Test
    @DisplayName("测试XSS清理")
    void testCleanXss() {
        // 测试清理script标签
        String input = "<script>alert('xss')</script>Hello World";
        String cleaned = SecurityUtils.cleanXss(input);
        assertFalse(cleaned.contains("<script>"));
        assertTrue(cleaned.contains("Hello World"));

        // 测试清理事件处理器
        input = "<div onclick='alert(1)'>Content</div>";
        cleaned = SecurityUtils.cleanXss(input);
        assertFalse(cleaned.contains("onclick"));
        assertTrue(cleaned.contains("Content"));

        // 测试正常内容不被影响
        input = "正常的文本内容";
        cleaned = SecurityUtils.cleanXss(input);
        assertEquals(input, cleaned);
    }

    @Test
    @DisplayName("测试SQL注入检测")
    void testDetectSqlInjection() {
        // 测试SQL注入关键词
        assertTrue(SecurityUtils.detectSqlInjection("' OR '1'='1"));
        assertTrue(SecurityUtils.detectSqlInjection("UNION SELECT * FROM users"));
        assertTrue(SecurityUtils.detectSqlInjection("DROP TABLE users"));
        assertTrue(SecurityUtils.detectSqlInjection("INSERT INTO users"));
        assertTrue(SecurityUtils.detectSqlInjection("DELETE FROM users"));
        
        // 测试正常输入
        assertFalse(SecurityUtils.detectSqlInjection("正常的查询内容"));
        assertFalse(SecurityUtils.detectSqlInjection("normal search text"));
    }

    @Test
    @DisplayName("测试生成安全随机字符串")
    void testGenerateSecureRandomString() {
        // 测试生成指定长度的随机字符串
        String randomStr = SecurityUtils.generateSecureRandomString(10);
        assertNotNull(randomStr);
        assertEquals(10, randomStr.length());
        
        // 测试生成的字符串只包含字母和数字
        assertTrue(randomStr.matches("[a-zA-Z0-9]+"));
        
        // 测试多次生成的字符串不相同
        String randomStr2 = SecurityUtils.generateSecureRandomString(10);
        assertNotEquals(randomStr, randomStr2);
    }

    @Test
    @DisplayName("测试生成数字验证码")
    void testGenerateNumericCode() {
        // 测试生成6位数字验证码
        String code = SecurityUtils.generateNumericCode(6);
        assertNotNull(code);
        assertEquals(6, code.length());
        assertTrue(code.matches("\\d+"));
        
        // 测试生成4位数字验证码
        code = SecurityUtils.generateNumericCode(4);
        assertNotNull(code);
        assertEquals(4, code.length());
        assertTrue(code.matches("\\d+"));
    }

    @Test
    @DisplayName("测试邮箱掩码")
    void testMaskEmail() {
        // 测试正常邮箱掩码
        String masked = SecurityUtils.maskEmail("test@example.com");
        assertEquals("t***@example.com", masked);
        
        // 测试短邮箱掩码
        masked = SecurityUtils.maskEmail("a@b.com");
        assertEquals("a***@b.com", masked);
        
        // 测试无效邮箱
        masked = SecurityUtils.maskEmail("invalid-email");
        assertEquals("invalid-email", masked);
        
        // 测试null输入
        masked = SecurityUtils.maskEmail(null);
        assertNull(masked);
    }

    @Test
    @DisplayName("测试手机号掩码")
    void testMaskPhoneNumber() {
        // 测试11位手机号掩码
        String masked = SecurityUtils.maskPhoneNumber("13812345678");
        assertEquals("138****5678", masked);
        
        // 测试短号码
        masked = SecurityUtils.maskPhoneNumber("12345");
        assertEquals("12345", masked);
        
        // 测试null输入
        masked = SecurityUtils.maskPhoneNumber(null);
        assertNull(masked);
    }

    @Test
    @DisplayName("测试密码强度评估")
    void testEvaluatePasswordStrength() {
        // 测试弱密码
        assertEquals(1, SecurityUtils.evaluatePasswordStrength("123456"));
        assertEquals(1, SecurityUtils.evaluatePasswordStrength("password"));
        
        // 测试中等强度密码
        assertEquals(2, SecurityUtils.evaluatePasswordStrength("Password123"));
        
        // 测试强密码
        assertEquals(3, SecurityUtils.evaluatePasswordStrength("Password123!"));
        assertEquals(3, SecurityUtils.evaluatePasswordStrength("MyStr0ng@Pass"));
        
        // 测试空密码
        assertEquals(0, SecurityUtils.evaluatePasswordStrength(""));
        assertEquals(0, SecurityUtils.evaluatePasswordStrength(null));
    }

    @Test
    @DisplayName("测试IP地址验证")
    void testIsValidIpAddress() {
        // 测试有效IP地址
        assertTrue(SecurityUtils.isValidIpAddress("192.168.1.1"));
        assertTrue(SecurityUtils.isValidIpAddress("127.0.0.1"));
        assertTrue(SecurityUtils.isValidIpAddress("255.255.255.255"));
        
        // 测试无效IP地址
        assertFalse(SecurityUtils.isValidIpAddress("256.1.1.1"));
        assertFalse(SecurityUtils.isValidIpAddress("192.168.1"));
        assertFalse(SecurityUtils.isValidIpAddress("invalid-ip"));
        assertFalse(SecurityUtils.isValidIpAddress(""));
        assertFalse(SecurityUtils.isValidIpAddress(null));
    }
}