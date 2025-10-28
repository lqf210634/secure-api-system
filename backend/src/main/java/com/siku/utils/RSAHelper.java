package com.siku.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RSA加密解密工具类 - Java后端版本
 * 
 * 功能描述：
 * - 提供RSA公钥加密、私钥解密功能
 * - 支持密钥对生成和PEM格式导入导出
 * - 与iOS和Android版本完全兼容
 * - 使用标准的RSA/ECB/PKCS1Padding填充模式
 * - 支持Base64编码的数据传输格式
 * - 针对服务器端优化，支持批量操作和高并发
 * 
 * @author SiKu Team
 * @version 1.0
 * @since JDK 11
 */
@Slf4j
@Component
public class RSAHelper {
    
    // RSA算法常量
    private static final String RSA_ALGORITHM = "RSA";
    private static final String RSA_TRANSFORMATION = "RSA/ECB/PKCS1Padding";
    private static final int DEFAULT_KEY_SIZE = 2048;
    
    // PEM格式常量
    private static final String PUBLIC_KEY_HEADER = "-----BEGIN PUBLIC KEY-----";
    private static final String PUBLIC_KEY_FOOTER = "-----END PUBLIC KEY-----";
    private static final String PRIVATE_KEY_HEADER = "-----BEGIN PRIVATE KEY-----";
    private static final String PRIVATE_KEY_FOOTER = "-----END PRIVATE KEY-----";
    
    // 线程安全的密钥缓存（可选，用于高并发场景）
    private static final Map<String, PublicKey> publicKeyCache = new ConcurrentHashMap<>();
    private static final Map<String, PrivateKey> privateKeyCache = new ConcurrentHashMap<>();
    
    /**
     * RSA操作异常类
     */
    public static class RSAException extends Exception {
        private static final long serialVersionUID = 1L;
        
        public RSAException(String message) {
            super(message);
        }
        
        public RSAException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * 密钥对数据类
     */
    public static class RSAKeyPair {
        private final PublicKey publicKey;
        private final PrivateKey privateKey;
        
        public RSAKeyPair(PublicKey publicKey, PrivateKey privateKey) {
            this.publicKey = publicKey;
            this.privateKey = privateKey;
        }
        
        public PublicKey getPublicKey() {
            return publicKey;
        }
        
        public PrivateKey getPrivateKey() {
            return privateKey;
        }
        
        /**
         * 获取公钥的PEM格式字符串
         */
        public String getPublicKeyPEM() throws RSAException {
            return RSAHelper.exportKeyToPEM(publicKey, true);
        }
        
        /**
         * 获取私钥的PEM格式字符串
         */
        public String getPrivateKeyPEM() throws RSAException {
            return RSAHelper.exportKeyToPEM(privateKey, false);
        }
    }
    
    /**
     * 使用公钥加密数据
     * @param data 待加密的字节数组
     * @param publicKey 公钥
     * @return 加密后的字节数组
     * @throws RSAException 加密失败异常
     */
    public static byte[] encrypt(byte[] data, PublicKey publicKey) throws RSAException {
        if (data == null) {
            throw new RSAException("Input data cannot be null");
        }
        if (publicKey == null) {
            throw new RSAException("Public key cannot be null");
        }
        
        try {
            Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);
            return cipher.doFinal(data);
        } catch (Exception e) {
            log.error("RSA encryption failed", e);
            throw new RSAException("RSA encryption failed", e);
        }
    }
    
    /**
     * 使用公钥加密字符串
     * @param text 待加密的字符串
     * @param publicKey 公钥
     * @return Base64编码的加密结果
     * @throws RSAException 加密失败异常
     */
    public static String encrypt(String text, PublicKey publicKey) throws RSAException {
        if (text == null) {
            throw new RSAException("Input text cannot be null");
        }
        
        byte[] data = text.getBytes(StandardCharsets.UTF_8);
        byte[] encryptedData = encrypt(data, publicKey);
        return Base64.getEncoder().encodeToString(encryptedData);
    }
    
    /**
     * 使用私钥解密数据
     * @param encryptedData 加密的字节数组
     * @param privateKey 私钥
     * @return 解密后的字节数组
     * @throws RSAException 解密失败异常
     */
    public static byte[] decrypt(byte[] encryptedData, PrivateKey privateKey) throws RSAException {
        if (encryptedData == null) {
            throw new RSAException("Encrypted data cannot be null");
        }
        if (privateKey == null) {
            throw new RSAException("Private key cannot be null");
        }
        
        try {
            Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, privateKey);
            return cipher.doFinal(encryptedData);
        } catch (Exception e) {
            log.error("RSA decryption failed", e);
            throw new RSAException("RSA decryption failed", e);
        }
    }
    
    /**
     * 使用私钥解密Base64字符串
     * @param base64String Base64编码的加密字符串
     * @param privateKey 私钥
     * @return 解密后的字符串
     * @throws RSAException 解密失败异常
     */
    public static String decrypt(String base64String, PrivateKey privateKey) throws RSAException {
        if (base64String == null) {
            throw new RSAException("Input base64String cannot be null");
        }
        
        try {
            byte[] encryptedData = Base64.getDecoder().decode(base64String);
            byte[] decryptedData = decrypt(encryptedData, privateKey);
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new RSAException("Invalid base64 string", e);
        }
    }
    
    /**
     * 生成RSA密钥对
     * @param keySize 密钥长度
     * @return RSA密钥对
     * @throws RSAException 密钥生成失败异常
     */
    public static RSAKeyPair generateKeyPair(int keySize) throws RSAException {
        if (keySize < 1024) {
            throw new RSAException("Key size must be at least 1024 bits");
        }
        
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA_ALGORITHM);
            keyPairGenerator.initialize(keySize);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            
            log.info("Generated RSA key pair with size: {} bits", keySize);
            return new RSAKeyPair(keyPair.getPublic(), keyPair.getPrivate());
            
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate RSA key pair", e);
            throw new RSAException("Failed to generate RSA key pair", e);
        }
    }
    
    /**
     * 生成默认大小的RSA密钥对
     * @return RSA密钥对
     * @throws RSAException 密钥生成失败异常
     */
    public static RSAKeyPair generateKeyPair() throws RSAException {
        return generateKeyPair(DEFAULT_KEY_SIZE);
    }
    
    /**
     * 从PEM格式字符串导入公钥
     * @param pemString PEM格式的公钥字符串
     * @return 公钥对象
     * @throws RSAException 导入失败异常
     */
    public static PublicKey importPublicKeyFromPEM(String pemString) throws RSAException {
        if (pemString == null || pemString.trim().isEmpty()) {
            throw new RSAException("PEM string cannot be null or empty");
        }
        
        // 检查缓存
        String cacheKey = pemString.hashCode() + "";
        PublicKey cachedKey = publicKeyCache.get(cacheKey);
        if (cachedKey != null) {
            return cachedKey;
        }
        
        try {
            String cleanPem = pemString
                .replace(PUBLIC_KEY_HEADER, "")
                .replace(PUBLIC_KEY_FOOTER, "")
                .replaceAll("\\s", "");
            
            byte[] keyBytes = Base64.getDecoder().decode(cleanPem);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
            PublicKey publicKey = keyFactory.generatePublic(keySpec);
            
            // 缓存密钥
            publicKeyCache.put(cacheKey, publicKey);
            log.debug("Imported public key from PEM format");
            
            return publicKey;
            
        } catch (Exception e) {
            log.error("Failed to import public key from PEM", e);
            throw new RSAException("Failed to import public key from PEM", e);
        }
    }
    
    /**
     * 从PEM格式字符串导入私钥
     * @param pemString PEM格式的私钥字符串
     * @return 私钥对象
     * @throws RSAException 导入失败异常
     */
    public static PrivateKey importPrivateKeyFromPEM(String pemString) throws RSAException {
        if (pemString == null || pemString.trim().isEmpty()) {
            throw new RSAException("PEM string cannot be null or empty");
        }
        
        // 检查缓存
        String cacheKey = pemString.hashCode() + "";
        PrivateKey cachedKey = privateKeyCache.get(cacheKey);
        if (cachedKey != null) {
            return cachedKey;
        }
        
        try {
            String cleanPem = pemString
                .replace(PRIVATE_KEY_HEADER, "")
                .replace(PRIVATE_KEY_FOOTER, "")
                .replaceAll("\\s", "");
            
            byte[] keyBytes = Base64.getDecoder().decode(cleanPem);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
            PrivateKey privateKey = keyFactory.generatePrivate(keySpec);
            
            // 缓存密钥
            privateKeyCache.put(cacheKey, privateKey);
            log.debug("Imported private key from PEM format");
            
            return privateKey;
            
        } catch (Exception e) {
            log.error("Failed to import private key from PEM", e);
            throw new RSAException("Failed to import private key from PEM", e);
        }
    }
    
    /**
     * 将密钥导出为PEM格式字符串
     * @param key 密钥对象
     * @param isPublicKey 是否为公钥
     * @return PEM格式字符串
     * @throws RSAException 导出失败异常
     */
    public static String exportKeyToPEM(Key key, boolean isPublicKey) throws RSAException {
        if (key == null) {
            throw new RSAException("Key cannot be null");
        }
        
        try {
            byte[] keyBytes = key.getEncoded();
            String base64Key = Base64.getEncoder().encodeToString(keyBytes);
            
            StringBuilder pemBuilder = new StringBuilder();
            if (isPublicKey) {
                pemBuilder.append(PUBLIC_KEY_HEADER).append("\n");
            } else {
                pemBuilder.append(PRIVATE_KEY_HEADER).append("\n");
            }
            
            // 每64个字符换行
            for (int i = 0; i < base64Key.length(); i += 64) {
                int endIndex = Math.min(i + 64, base64Key.length());
                pemBuilder.append(base64Key, i, endIndex).append("\n");
            }
            
            if (isPublicKey) {
                pemBuilder.append(PUBLIC_KEY_FOOTER);
            } else {
                pemBuilder.append(PRIVATE_KEY_FOOTER);
            }
            
            return pemBuilder.toString();
            
        } catch (Exception e) {
            log.error("Failed to export key to PEM format", e);
            throw new RSAException("Failed to export key to PEM format", e);
        }
    }
    
    /**
     * 清除密钥缓存
     */
    public static void clearKeyCache() {
        publicKeyCache.clear();
        privateKeyCache.clear();
        log.info("RSA key cache cleared");
    }
    
    /**
     * 获取缓存统计信息
     * @return 缓存统计信息
     */
    public static String getCacheStats() {
        return String.format("Public keys cached: %d, Private keys cached: %d", 
                           publicKeyCache.size(), privateKeyCache.size());
    }
}