package com.siku.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * CaptchaService 验证码服务单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("CaptchaService 验证码服务测试")
class CaptchaServiceTest {

    @MockBean
    private StringRedisTemplate redisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    private CaptchaService captchaService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        captchaService = new CaptchaService(redisTemplate);
    }

    @Test
    @DisplayName("测试生成验证码")
    void testGenerateCaptcha() {
        // Mock Redis操作
        doNothing().when(valueOperations).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        
        // 生成验证码
        String captchaKey = captchaService.generateCaptcha();
        
        // 验证结果
        assertNotNull(captchaKey);
        assertFalse(captchaKey.isEmpty());
        assertTrue(captchaKey.startsWith("captcha:"));
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).set(anyString(), anyString(), eq(300L), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("测试获取验证码图片")
    void testGetCaptchaImage() {
        String captchaKey = "captcha:test123";
        when(valueOperations.get(captchaKey)).thenReturn("1234");
        
        // 获取验证码图片
        String imageBase64 = captchaService.getCaptchaImage(captchaKey);
        
        // 验证结果
        assertNotNull(imageBase64);
        assertFalse(imageBase64.isEmpty());
        assertTrue(imageBase64.startsWith("data:image/png;base64,"));
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).get(captchaKey);
    }

    @Test
    @DisplayName("测试验证码验证成功")
    void testVerifyCaptchaSuccess() {
        String captchaKey = "captcha:test123";
        String captchaCode = "1234";
        
        when(valueOperations.get(captchaKey)).thenReturn(captchaCode);
        doNothing().when(redisTemplate).delete(captchaKey);
        
        // 验证验证码
        boolean result = captchaService.verifyCaptcha(captchaKey, captchaCode);
        
        // 验证结果
        assertTrue(result);
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).get(captchaKey);
        verify(redisTemplate, times(1)).delete(captchaKey);
    }

    @Test
    @DisplayName("测试验证码验证失败 - 验证码错误")
    void testVerifyCaptchaFailWrongCode() {
        String captchaKey = "captcha:test123";
        String storedCode = "1234";
        String inputCode = "5678";
        
        when(valueOperations.get(captchaKey)).thenReturn(storedCode);
        
        // 验证验证码
        boolean result = captchaService.verifyCaptcha(captchaKey, inputCode);
        
        // 验证结果
        assertFalse(result);
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).get(captchaKey);
        verify(redisTemplate, never()).delete(captchaKey);
    }

    @Test
    @DisplayName("测试验证码验证失败 - 验证码过期")
    void testVerifyCaptchaFailExpired() {
        String captchaKey = "captcha:test123";
        String captchaCode = "1234";
        
        when(valueOperations.get(captchaKey)).thenReturn(null);
        
        // 验证验证码
        boolean result = captchaService.verifyCaptcha(captchaKey, captchaCode);
        
        // 验证结果
        assertFalse(result);
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).get(captchaKey);
        verify(redisTemplate, never()).delete(captchaKey);
    }

    @Test
    @DisplayName("测试验证码验证 - 大小写不敏感")
    void testVerifyCaptchaCaseInsensitive() {
        String captchaKey = "captcha:test123";
        String storedCode = "ABCD";
        String inputCode = "abcd";
        
        when(valueOperations.get(captchaKey)).thenReturn(storedCode);
        doNothing().when(redisTemplate).delete(captchaKey);
        
        // 验证验证码
        boolean result = captchaService.verifyCaptcha(captchaKey, inputCode);
        
        // 验证结果
        assertTrue(result);
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).get(captchaKey);
        verify(redisTemplate, times(1)).delete(captchaKey);
    }

    @Test
    @DisplayName("测试验证码验证 - 空输入")
    void testVerifyCaptchaEmptyInput() {
        String captchaKey = "captcha:test123";
        
        // 测试空验证码
        boolean result1 = captchaService.verifyCaptcha(captchaKey, "");
        assertFalse(result1);
        
        // 测试null验证码
        boolean result2 = captchaService.verifyCaptcha(captchaKey, null);
        assertFalse(result2);
        
        // 测试空key
        boolean result3 = captchaService.verifyCaptcha("", "1234");
        assertFalse(result3);
        
        // 测试null key
        boolean result4 = captchaService.verifyCaptcha(null, "1234");
        assertFalse(result4);
        
        // 验证Redis操作没有被调用
        verify(valueOperations, never()).get(anyString());
    }

    @Test
    @DisplayName("测试获取不存在的验证码图片")
    void testGetCaptchaImageNotExists() {
        String captchaKey = "captcha:notexist";
        when(valueOperations.get(captchaKey)).thenReturn(null);
        
        // 获取验证码图片
        String imageBase64 = captchaService.getCaptchaImage(captchaKey);
        
        // 验证结果
        assertNull(imageBase64);
        
        // 验证Redis操作被调用
        verify(valueOperations, times(1)).get(captchaKey);
    }

    @Test
    @DisplayName("测试验证码生成的唯一性")
    void testCaptchaUniqueness() {
        // Mock Redis操作
        doNothing().when(valueOperations).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        
        // 生成多个验证码
        String captcha1 = captchaService.generateCaptcha();
        String captcha2 = captchaService.generateCaptcha();
        String captcha3 = captchaService.generateCaptcha();
        
        // 验证唯一性
        assertNotEquals(captcha1, captcha2);
        assertNotEquals(captcha2, captcha3);
        assertNotEquals(captcha1, captcha3);
        
        // 验证Redis操作被调用
        verify(valueOperations, times(3)).set(anyString(), anyString(), eq(300L), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("测试验证码刷新")
    void testRefreshCaptcha() {
        String oldCaptchaKey = "captcha:old123";
        
        // Mock Redis操作
        doNothing().when(redisTemplate).delete(oldCaptchaKey);
        doNothing().when(valueOperations).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        
        // 刷新验证码
        String newCaptchaKey = captchaService.refreshCaptcha(oldCaptchaKey);
        
        // 验证结果
        assertNotNull(newCaptchaKey);
        assertNotEquals(oldCaptchaKey, newCaptchaKey);
        assertTrue(newCaptchaKey.startsWith("captcha:"));
        
        // 验证Redis操作被调用
        verify(redisTemplate, times(1)).delete(oldCaptchaKey);
        verify(valueOperations, times(1)).set(anyString(), anyString(), eq(300L), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("测试验证码清理")
    void testCleanupExpiredCaptcha() {
        String captchaKey = "captcha:test123";
        
        // Mock Redis操作
        doNothing().when(redisTemplate).delete(captchaKey);
        
        // 清理验证码
        captchaService.cleanupCaptcha(captchaKey);
        
        // 验证Redis操作被调用
        verify(redisTemplate, times(1)).delete(captchaKey);
    }
}