package com.siku.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 错误代码枚举
 * 定义系统中所有的错误代码和对应的错误消息
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {
    
    // ==================== 通用错误代码 (1000-1999) ====================
    SUCCESS(200, "操作成功"),
    SYSTEM_ERROR(1000, "系统内部错误"),
    INVALID_PARAMETER(1001, "参数无效"),
    VALIDATION_FAILED(1002, "参数验证失败"),
    BUSINESS_ERROR(1003, "业务逻辑错误"),
    RESOURCE_NOT_FOUND(1004, "资源不存在"),
    OPERATION_FAILED(1005, "操作失败"),
    DATA_CONFLICT(1006, "数据冲突"),
    RATE_LIMIT_EXCEEDED(1007, "请求频率超限"),
    SERVICE_UNAVAILABLE(1008, "服务不可用"),
    
    // ==================== 认证授权错误代码 (2000-2999) ====================
    AUTHENTICATION_FAILED(2000, "认证失败"),
    AUTHORIZATION_FAILED(2001, "授权失败"),
    TOKEN_INVALID(2002, "Token无效"),
    TOKEN_EXPIRED(2003, "Token已过期"),
    TOKEN_MISSING(2004, "Token缺失"),
    REFRESH_TOKEN_INVALID(2005, "刷新Token无效"),
    REFRESH_TOKEN_EXPIRED(2006, "刷新Token已过期"),
    SESSION_EXPIRED(2007, "会话已过期"),
    PERMISSION_DENIED(2008, "权限不足"),
    ACCOUNT_DISABLED(2009, "账户已禁用"),
    ACCOUNT_LOCKED(2010, "账户已锁定"),
    
    // ==================== 用户相关错误代码 (3000-3999) ====================
    USER_NOT_FOUND(3000, "用户不存在"),
    USERNAME_ALREADY_EXISTS(3001, "用户名已存在"),
    EMAIL_ALREADY_EXISTS(3002, "邮箱已存在"),
    PHONE_ALREADY_EXISTS(3003, "手机号已存在"),
    INVALID_CREDENTIALS(3004, "用户名或密码错误"),
    PASSWORD_TOO_WEAK(3005, "密码强度不足"),
    OLD_PASSWORD_INCORRECT(3006, "原密码错误"),
    USER_REGISTRATION_FAILED(3007, "用户注册失败"),
    USER_UPDATE_FAILED(3008, "用户信息更新失败"),
    LOGIN_ATTEMPTS_EXCEEDED(3009, "登录尝试次数超限"),
    
    // ==================== 加密相关错误代码 (4000-4999) ====================
    ENCRYPTION_FAILED(4000, "加密失败"),
    DECRYPTION_FAILED(4001, "解密失败"),
    KEY_GENERATION_FAILED(4002, "密钥生成失败"),
    SIGNATURE_VERIFICATION_FAILED(4003, "签名验证失败"),
    INVALID_ENCRYPTION_DATA(4004, "加密数据无效"),
    ENCRYPTION_KEY_INVALID(4005, "加密密钥无效"),
    RSA_ENCRYPTION_FAILED(4006, "RSA加密失败"),
    RSA_DECRYPTION_FAILED(4007, "RSA解密失败"),
    AES_ENCRYPTION_FAILED(4008, "AES加密失败"),
    AES_DECRYPTION_FAILED(4009, "AES解密失败"),
    HMAC_VERIFICATION_FAILED(4010, "HMAC验证失败"),
    
    // ==================== 数据库相关错误代码 (5000-5999) ====================
    DATABASE_ERROR(5000, "数据库错误"),
    DATA_INTEGRITY_VIOLATION(5001, "数据完整性违反"),
    DUPLICATE_KEY_ERROR(5002, "主键冲突"),
    FOREIGN_KEY_CONSTRAINT(5003, "外键约束违反"),
    OPTIMISTIC_LOCK_FAILURE(5004, "乐观锁冲突"),
    TRANSACTION_ROLLBACK(5005, "事务回滚"),
    CONNECTION_TIMEOUT(5006, "数据库连接超时"),
    
    // ==================== 文件相关错误代码 (6000-6999) ====================
    FILE_NOT_FOUND(6000, "文件不存在"),
    FILE_UPLOAD_FAILED(6001, "文件上传失败"),
    FILE_DOWNLOAD_FAILED(6002, "文件下载失败"),
    FILE_SIZE_EXCEEDED(6003, "文件大小超限"),
    INVALID_FILE_TYPE(6004, "文件类型不支持"),
    FILE_PROCESSING_FAILED(6005, "文件处理失败"),
    
    // ==================== 网络相关错误代码 (7000-7999) ====================
    NETWORK_ERROR(7000, "网络错误"),
    CONNECTION_TIMEOUT_ERROR(7001, "连接超时"),
    READ_TIMEOUT_ERROR(7002, "读取超时"),
    EXTERNAL_SERVICE_ERROR(7003, "外部服务错误"),
    API_CALL_FAILED(7004, "API调用失败"),
    
    // ==================== 缓存相关错误代码 (8000-8999) ====================
    CACHE_ERROR(8000, "缓存错误"),
    CACHE_KEY_NOT_FOUND(8001, "缓存键不存在"),
    CACHE_OPERATION_FAILED(8002, "缓存操作失败"),
    REDIS_CONNECTION_ERROR(8003, "Redis连接错误"),
    
    // ==================== 消息队列相关错误代码 (9000-9999) ====================
    MESSAGE_QUEUE_ERROR(9000, "消息队列错误"),
    MESSAGE_SEND_FAILED(9001, "消息发送失败"),
    MESSAGE_CONSUME_FAILED(9002, "消息消费失败"),
    QUEUE_NOT_FOUND(9003, "队列不存在");
    
    /**
     * 错误代码
     */
    private final Integer code;
    
    /**
     * 错误消息
     */
    private final String message;
    
    /**
     * 根据错误代码查找对应的枚举
     * 
     * @param code 错误代码
     * @return 对应的枚举，如果不存在返回SYSTEM_ERROR
     */
    public static ErrorCode fromCode(Integer code) {
        if (code == null) {
            return SYSTEM_ERROR;
        }
        
        for (ErrorCode errorCode : values()) {
            if (errorCode.getCode().equals(code)) {
                return errorCode;
            }
        }
        
        return SYSTEM_ERROR;
    }
    
    /**
     * 判断是否为成功代码
     * 
     * @return 是否成功
     */
    public boolean isSuccess() {
        return this == SUCCESS;
    }
    
    /**
     * 判断是否为认证相关错误
     * 
     * @return 是否为认证错误
     */
    public boolean isAuthenticationError() {
        return this.code >= 2000 && this.code < 3000;
    }
    
    /**
     * 判断是否为用户相关错误
     * 
     * @return 是否为用户错误
     */
    public boolean isUserError() {
        return this.code >= 3000 && this.code < 4000;
    }
    
    /**
     * 判断是否为加密相关错误
     * 
     * @return 是否为加密错误
     */
    public boolean isEncryptionError() {
        return this.code >= 4000 && this.code < 5000;
    }
    
    /**
     * 判断是否为数据库相关错误
     * 
     * @return 是否为数据库错误
     */
    public boolean isDatabaseError() {
        return this.code >= 5000 && this.code < 6000;
    }
}