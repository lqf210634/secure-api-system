package com.siku.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.security.KeyPair;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RSAHelper 加密工具类单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("RSAHelper 加密工具类测试")
class RSAHelperTest {

    @Test
    @DisplayName("测试RSA密钥对生成")
    void testGenerateKeyPair() {
        // 测试生成RSA密钥对
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        assertNotNull(keyPair);
        assertTrue(keyPair.containsKey("publicKey"));
        assertTrue(keyPair.containsKey("privateKey"));
        
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        assertNotNull(publicKey);
        assertNotNull(privateKey);
        assertFalse(publicKey.isEmpty());
        assertFalse(privateKey.isEmpty());
        
        // 测试多次生成的密钥对不相同
        Map<String, String> keyPair2 = RSAHelper.generateKeyPair();
        assertNotEquals(publicKey, keyPair2.get("publicKey"));
        assertNotEquals(privateKey, keyPair2.get("privateKey"));
    }

    @Test
    @DisplayName("测试RSA公钥加密私钥解密")
    void testPublicEncryptPrivateDecrypt() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        String originalText = "这是一个RSA加密测试文本，包含中文和English123!@#";
        
        // 公钥加密
        String encrypted = RSAHelper.encryptByPublicKey(originalText, publicKey);
        assertNotNull(encrypted);
        assertNotEquals(originalText, encrypted);
        
        // 私钥解密
        String decrypted = RSAHelper.decryptByPrivateKey(encrypted, privateKey);
        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("测试RSA私钥加密公钥解密")
    void testPrivateEncryptPublicDecrypt() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        String originalText = "这是一个RSA私钥加密测试文本";
        
        // 私钥加密
        String encrypted = RSAHelper.encryptByPrivateKey(originalText, privateKey);
        assertNotNull(encrypted);
        assertNotEquals(originalText, encrypted);
        
        // 公钥解密
        String decrypted = RSAHelper.decryptByPublicKey(encrypted, publicKey);
        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("测试RSA数字签名")
    void testSignAndVerify() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        String data = "需要签名的数据内容";
        
        // 私钥签名
        String signature = RSAHelper.sign(data, privateKey);
        assertNotNull(signature);
        assertFalse(signature.isEmpty());
        
        // 公钥验证签名
        boolean isValid = RSAHelper.verify(data, signature, publicKey);
        assertTrue(isValid);
        
        // 测试篡改数据后验证失败
        boolean isInvalid = RSAHelper.verify(data + "篡改", signature, publicKey);
        assertFalse(isInvalid);
    }

    @Test
    @DisplayName("测试空字符串加密解密")
    void testEncryptDecryptEmptyString() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        // 测试空字符串
        String encrypted = RSAHelper.encryptByPublicKey("", publicKey);
        assertNotNull(encrypted);
        
        String decrypted = RSAHelper.decryptByPrivateKey(encrypted, privateKey);
        assertEquals("", decrypted);
    }

    @Test
    @DisplayName("测试特殊字符加密解密")
    void testEncryptDecryptSpecialCharacters() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        String specialText = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
        
        // 公钥加密，私钥解密
        String encrypted = RSAHelper.encryptByPublicKey(specialText, publicKey);
        String decrypted = RSAHelper.decryptByPrivateKey(encrypted, privateKey);
        assertEquals(specialText, decrypted);
    }

    @Test
    @DisplayName("测试长文本分段加密解密")
    void testEncryptDecryptLongText() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        // 创建一个较长的文本（但不超过RSA加密限制）
        StringBuilder longText = new StringBuilder();
        for (int i = 0; i < 50; i++) {
            longText.append("测试数据").append(i);
        }
        String originalText = longText.toString();
        
        // 公钥加密，私钥解密
        String encrypted = RSAHelper.encryptByPublicKey(originalText, publicKey);
        String decrypted = RSAHelper.decryptByPrivateKey(encrypted, privateKey);
        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("测试错误密钥解密")
    void testDecryptWithWrongKey() {
        Map<String, String> keyPair1 = RSAHelper.generateKeyPair();
        Map<String, String> keyPair2 = RSAHelper.generateKeyPair();
        
        String originalText = "测试文本";
        
        // 用keyPair1的公钥加密
        String encrypted = RSAHelper.encryptByPublicKey(originalText, keyPair1.get("publicKey"));
        
        // 用keyPair2的私钥解密应该失败
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.decryptByPrivateKey(encrypted, keyPair2.get("privateKey"));
        });
    }

    @Test
    @DisplayName("测试无效输入处理")
    void testInvalidInputs() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        // 测试null输入
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.encryptByPublicKey(null, publicKey);
        });
        
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.encryptByPublicKey("test", null);
        });
        
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.decryptByPrivateKey(null, privateKey);
        });
        
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.decryptByPrivateKey("test", null);
        });
    }

    @Test
    @DisplayName("测试无效密钥格式")
    void testInvalidKeyFormat() {
        String originalText = "测试文本";
        String invalidKey = "invalid-key-format";
        
        // 测试无效公钥格式
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.encryptByPublicKey(originalText, invalidKey);
        });
        
        // 测试无效私钥格式
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.decryptByPrivateKey("encrypted-text", invalidKey);
        });
    }

    @Test
    @DisplayName("测试签名验证的边界情况")
    void testSignVerifyEdgeCases() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        // 测试空数据签名
        String signature = RSAHelper.sign("", privateKey);
        assertTrue(RSAHelper.verify("", signature, publicKey));
        
        // 测试null数据
        assertThrows(RuntimeException.class, () -> {
            RSAHelper.sign(null, privateKey);
        });
        
        // 测试无效签名格式
        assertFalse(RSAHelper.verify("data", "invalid-signature", publicKey));
    }

    @Test
    @DisplayName("测试加密结果的一致性")
    void testEncryptionConsistency() {
        Map<String, String> keyPair = RSAHelper.generateKeyPair();
        String publicKey = keyPair.get("publicKey");
        String privateKey = keyPair.get("privateKey");
        
        String originalText = "一致性测试文本";
        
        // 多次加密相同内容，结果应该不同（因为使用了随机填充）
        String encrypted1 = RSAHelper.encryptByPublicKey(originalText, publicKey);
        String encrypted2 = RSAHelper.encryptByPublicKey(originalText, publicKey);
        
        assertNotEquals(encrypted1, encrypted2);
        
        // 但解密结果应该相同
        String decrypted1 = RSAHelper.decryptByPrivateKey(encrypted1, privateKey);
        String decrypted2 = RSAHelper.decryptByPrivateKey(encrypted2, privateKey);
        
        assertEquals(originalText, decrypted1);
        assertEquals(originalText, decrypted2);
    }
}