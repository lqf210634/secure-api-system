package com.siku.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AESHelper 加密工具类单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("AESHelper 加密工具类测试")
class AESHelperTest {

    @Test
    @DisplayName("测试AES密钥生成")
    void testGenerateKey() {
        // 测试生成AES密钥
        String key = AESHelper.generateKey();
        assertNotNull(key);
        assertEquals(44, key.length()); // Base64编码的256位密钥长度
        
        // 测试多次生成的密钥不相同
        String key2 = AESHelper.generateKey();
        assertNotEquals(key, key2);
    }

    @Test
    @DisplayName("测试AES加密和解密")
    void testEncryptAndDecrypt() {
        String originalText = "这是一个测试文本，包含中文和English字符123!@#";
        String key = AESHelper.generateKey();
        
        // 测试加密
        String encrypted = AESHelper.encrypt(originalText, key);
        assertNotNull(encrypted);
        assertNotEquals(originalText, encrypted);
        
        // 测试解密
        String decrypted = AESHelper.decrypt(encrypted, key);
        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("测试空字符串加密解密")
    void testEncryptDecryptEmptyString() {
        String key = AESHelper.generateKey();
        
        // 测试空字符串
        String encrypted = AESHelper.encrypt("", key);
        assertNotNull(encrypted);
        
        String decrypted = AESHelper.decrypt(encrypted, key);
        assertEquals("", decrypted);
    }

    @Test
    @DisplayName("测试长文本加密解密")
    void testEncryptDecryptLongText() {
        StringBuilder longText = new StringBuilder();
        for (int i = 0; i < 1000; i++) {
            longText.append("这是第").append(i).append("行测试数据，包含中文和数字。");
        }
        
        String key = AESHelper.generateKey();
        String originalText = longText.toString();
        
        // 测试加密
        String encrypted = AESHelper.encrypt(originalText, key);
        assertNotNull(encrypted);
        
        // 测试解密
        String decrypted = AESHelper.decrypt(encrypted, key);
        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("测试特殊字符加密解密")
    void testEncryptDecryptSpecialCharacters() {
        String specialText = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~\n\t\r";
        String key = AESHelper.generateKey();
        
        // 测试加密
        String encrypted = AESHelper.encrypt(specialText, key);
        assertNotNull(encrypted);
        
        // 测试解密
        String decrypted = AESHelper.decrypt(encrypted, key);
        assertEquals(specialText, decrypted);
    }

    @Test
    @DisplayName("测试错误密钥解密")
    void testDecryptWithWrongKey() {
        String originalText = "测试文本";
        String key1 = AESHelper.generateKey();
        String key2 = AESHelper.generateKey();
        
        // 用key1加密
        String encrypted = AESHelper.encrypt(originalText, key1);
        
        // 用key2解密应该失败
        assertThrows(RuntimeException.class, () -> {
            AESHelper.decrypt(encrypted, key2);
        });
    }

    @Test
    @DisplayName("测试无效输入处理")
    void testInvalidInputs() {
        String key = AESHelper.generateKey();
        
        // 测试null输入
        assertThrows(RuntimeException.class, () -> {
            AESHelper.encrypt(null, key);
        });
        
        assertThrows(RuntimeException.class, () -> {
            AESHelper.encrypt("test", null);
        });
        
        assertThrows(RuntimeException.class, () -> {
            AESHelper.decrypt(null, key);
        });
        
        assertThrows(RuntimeException.class, () -> {
            AESHelper.decrypt("test", null);
        });
    }

    @Test
    @DisplayName("测试无效密钥格式")
    void testInvalidKeyFormat() {
        String originalText = "测试文本";
        String invalidKey = "invalid-key-format";
        
        // 测试无效密钥格式
        assertThrows(RuntimeException.class, () -> {
            AESHelper.encrypt(originalText, invalidKey);
        });
        
        assertThrows(RuntimeException.class, () -> {
            AESHelper.decrypt("encrypted-text", invalidKey);
        });
    }

    @Test
    @DisplayName("测试加密结果的随机性")
    void testEncryptionRandomness() {
        String originalText = "相同的文本内容";
        String key = AESHelper.generateKey();
        
        // 多次加密相同内容，结果应该不同（因为使用了随机IV）
        String encrypted1 = AESHelper.encrypt(originalText, key);
        String encrypted2 = AESHelper.encrypt(originalText, key);
        
        assertNotEquals(encrypted1, encrypted2);
        
        // 但解密结果应该相同
        String decrypted1 = AESHelper.decrypt(encrypted1, key);
        String decrypted2 = AESHelper.decrypt(encrypted2, key);
        
        assertEquals(originalText, decrypted1);
        assertEquals(originalText, decrypted2);
    }
}