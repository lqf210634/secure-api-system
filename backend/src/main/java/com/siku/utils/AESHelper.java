package com.siku.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Base64;

/**
 * AES加密解密工具类 - Java后端版本
 * 使用AES/CBC/PKCS5Padding模式，确保与iOS和Android完全兼容
 * 
 * @author SiKu Team
 * @version 1.0
 * @since JDK 11
 */
@Slf4j
@Component
public class AESHelper {
    
    // MARK: - 常量定义
    private static final String AES_TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final String AES_ALGORITHM = "AES";
    private static final String PBKDF2_ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int AES_BLOCK_SIZE = 16;
    private static final int AES_KEY_SIZE_128 = 16;
    private static final int AES_KEY_SIZE_192 = 24;
    private static final int AES_KEY_SIZE_256 = 32;
    private static final int DEFAULT_PBKDF2_ROUNDS = 10000;
    
    /**
     * 自定义异常类
     */
    public static class AESException extends Exception {
        private static final long serialVersionUID = 1L;
        
        public AESException(String message) {
            super(message);
        }
        
        public AESException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * AES加密（兼容iOS和Android）
     * 
     * @param plainText 待加密的明文字符串
     * @param key 加密密钥（16、24或32字节）
     * @param iv 初始化向量（16字节），如果为null则自动生成
     * @return Base64编码的加密结果，格式为Base64(IV + EncryptedData)
     * @throws AESException 加密异常
     */
    public static String encrypt(String plainText, String key, String iv) throws AESException {
        try {
            if (plainText == null || plainText.trim().isEmpty()) {
                throw new AESException("输入数据无效");
            }
            
            byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
            if (!isValidKeyLength(keyBytes.length)) {
                throw new AESException("密钥长度无效，必须是16、24或32字节");
            }
            
            byte[] ivBytes;
            if (iv != null && !iv.trim().isEmpty()) {
                ivBytes = iv.getBytes(StandardCharsets.UTF_8);
                if (ivBytes.length != AES_BLOCK_SIZE) {
                    throw new AESException("IV长度无效，必须是16字节");
                }
            } else {
                ivBytes = generateRandomIV();
            }
            
            byte[] plainBytes = plainText.getBytes(StandardCharsets.UTF_8);
            byte[] encryptedBytes = performCryption(plainBytes, keyBytes, ivBytes, Cipher.ENCRYPT_MODE);
            
            // 将IV和加密数据合并，然后进行Base64编码（兼容iOS/Android格式）
            byte[] combinedBytes = new byte[ivBytes.length + encryptedBytes.length];
            System.arraycopy(ivBytes, 0, combinedBytes, 0, ivBytes.length);
            System.arraycopy(encryptedBytes, 0, combinedBytes, ivBytes.length, encryptedBytes.length);
            
            String result = Base64.getEncoder().encodeToString(combinedBytes);
            log.debug("AES加密成功，明文长度: {}, 密文长度: {}", plainText.length(), result.length());
            
            return result;
            
        } catch (Exception e) {
            log.error("AES加密失败", e);
            throw new AESException("加密失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * AES加密（自动生成IV）
     * 
     * @param plainText 待加密的明文字符串
     * @param key 加密密钥（16、24或32字节）
     * @return Base64编码的加密结果
     * @throws AESException 加密异常
     */
    public static String encrypt(String plainText, String key) throws AESException {
        return encrypt(plainText, key, null);
    }
    
    /**
     * AES解密（兼容iOS和Android）
     * 
     * @param encryptedText Base64编码的加密文本
     * @param key 解密密钥（16、24或32字节）
     * @return 解密后的明文字符串
     * @throws AESException 解密异常
     */
    public static String decrypt(String encryptedText, String key) throws AESException {
        try {
            if (encryptedText == null || encryptedText.trim().isEmpty()) {
                throw new AESException("无效的Base64字符串");
            }
            
            byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
            if (!isValidKeyLength(keyBytes.length)) {
                throw new AESException("密钥长度无效，必须是16、24或32字节");
            }
            
            byte[] combinedBytes = Base64.getDecoder().decode(encryptedText);
            if (combinedBytes.length <= AES_BLOCK_SIZE) {
                throw new AESException("输入数据无效，长度不足");
            }
            
            // 分离IV和加密数据
            byte[] ivBytes = new byte[AES_BLOCK_SIZE];
            byte[] encryptedBytes = new byte[combinedBytes.length - AES_BLOCK_SIZE];
            System.arraycopy(combinedBytes, 0, ivBytes, 0, AES_BLOCK_SIZE);
            System.arraycopy(combinedBytes, AES_BLOCK_SIZE, encryptedBytes, 0, encryptedBytes.length);
            
            byte[] decryptedBytes = performCryption(encryptedBytes, keyBytes, ivBytes, Cipher.DECRYPT_MODE);
            String result = new String(decryptedBytes, StandardCharsets.UTF_8);
            
            log.debug("AES解密成功，密文长度: {}, 明文长度: {}", encryptedText.length(), result.length());
            
            return result;
            
        } catch (Exception e) {
            log.error("AES解密失败", e);
            throw new AESException("解密失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 生成随机AES密钥
     * 
     * @param keySize 密钥大小（16、24或32字节）
     * @return Base64编码的随机密钥
     * @throws AESException 密钥生成异常
     */
    public static String generateRandomKey(int keySize) throws AESException {
        if (!isValidKeyLength(keySize)) {
            throw new AESException("密钥长度无效，必须是16、24或32字节");
        }
        
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(AES_ALGORITHM);
            keyGenerator.init(keySize * 8); // 转换为位数
            SecretKey secretKey = keyGenerator.generateKey();
            String result = Base64.getEncoder().encodeToString(secretKey.getEncoded());
            
            log.info("生成随机AES密钥成功，密钥长度: {}位", keySize * 8);
            return result;
            
        } catch (NoSuchAlgorithmException e) {
            log.error("生成随机AES密钥失败", e);
            throw new AESException("密钥生成失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 使用PBKDF2从密码派生密钥
     * 
     * @param password 密码字符串
     * @param salt 盐值
     * @param iterations 迭代次数
     * @param keyLength 密钥长度（字节）
     * @return Base64编码的派生密钥
     * @throws AESException 密钥派生异常
     */
    public static String deriveKeyFromPassword(String password, String salt, int iterations, int keyLength) throws AESException {
        if (password == null || password.trim().isEmpty()) {
            throw new AESException("密码不能为空");
        }
        
        if (salt == null || salt.trim().isEmpty()) {
            throw new AESException("盐值不能为空");
        }
        
        if (!isValidKeyLength(keyLength)) {
            throw new AESException("密钥长度无效，必须是16、24或32字节");
        }
        
        try {
            SecretKeyFactory factory = SecretKeyFactory.getInstance(PBKDF2_ALGORITHM);
            KeySpec spec = new PBEKeySpec(password.toCharArray(), salt.getBytes(StandardCharsets.UTF_8), 
                                        iterations, keyLength * 8);
            SecretKey secretKey = factory.generateSecret(spec);
            String result = Base64.getEncoder().encodeToString(secretKey.getEncoded());
            
            log.debug("PBKDF2密钥派生成功，密钥长度: {}位", keyLength * 8);
            return result;
            
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            log.error("PBKDF2密钥派生失败", e);
            throw new AESException("密钥派生失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 使用默认参数从密码派生密钥
     * 
     * @param password 密码字符串
     * @param salt 盐值
     * @return Base64编码的派生密钥（256位）
     * @throws AESException 密钥派生异常
     */
    public static String deriveKeyFromPassword(String password, String salt) throws AESException {
        return deriveKeyFromPassword(password, salt, DEFAULT_PBKDF2_ROUNDS, AES_KEY_SIZE_256);
    }
    
    // MARK: - 私有方法
    
    /**
     * 执行加密或解密操作
     */
    private static byte[] performCryption(byte[] data, byte[] keyBytes, byte[] ivBytes, int mode) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, AES_ALGORITHM);
        IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);
        
        Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
        cipher.init(mode, keySpec, ivSpec);
        
        return cipher.doFinal(data);
    }
    
    /**
     * 生成随机IV
     */
    private static byte[] generateRandomIV() {
        byte[] iv = new byte[AES_BLOCK_SIZE];
        new SecureRandom().nextBytes(iv);
        return iv;
    }
    
    /**
     * 验证密钥长度是否有效
     */
    private static boolean isValidKeyLength(int length) {
        return length == AES_KEY_SIZE_128 || length == AES_KEY_SIZE_192 || length == AES_KEY_SIZE_256;
    }
}