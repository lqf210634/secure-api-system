package com.siku.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 响应状态码枚举
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Getter
@AllArgsConstructor
public enum ResponseCode {

    // ==================== 成功状态码 ====================
    SUCCESS(200, "操作成功"),
    CREATED(201, "创建成功"),
    ACCEPTED(202, "请求已接受"),
    NO_CONTENT(204, "无内容"),

    // ==================== 客户端错误状态码 ====================
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权访问"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源未找到"),
    METHOD_NOT_ALLOWED(405, "请求方法不允许"),
    CONFLICT(409, "资源冲突"),
    VALIDATION_ERROR(422, "参数验证失败"),
    TOO_MANY_REQUESTS(429, "请求过于频繁"),

    // ==================== 服务器错误状态码 ====================
    INTERNAL_ERROR(500, "服务器内部错误"),
    BAD_GATEWAY(502, "网关错误"),
    SERVICE_UNAVAILABLE(503, "服务不可用"),
    GATEWAY_TIMEOUT(504, "网关超时"),

    // ==================== 业务错误状态码 ====================
    // 用户相关错误 (1000-1099)
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_ALREADY_EXISTS(1002, "用户已存在"),
    USER_DISABLED(1003, "用户已被禁用"),
    USER_LOCKED(1004, "用户账户已被锁定"),
    USERNAME_ALREADY_EXISTS(1005, "用户名已存在"),
    EMAIL_ALREADY_EXISTS(1006, "邮箱已存在"),
    PHONE_ALREADY_EXISTS(1007, "手机号已存在"),

    // 认证相关错误 (1100-1199)
    INVALID_CREDENTIALS(1101, "用户名或密码错误"),
    PASSWORD_INCORRECT(1102, "密码错误"),
    TOKEN_INVALID(1103, "令牌无效"),
    TOKEN_EXPIRED(1104, "令牌已过期"),
    REFRESH_TOKEN_INVALID(1105, "刷新令牌无效"),
    REFRESH_TOKEN_EXPIRED(1106, "刷新令牌已过期"),
    LOGIN_FAILED_TOO_MANY_TIMES(1107, "登录失败次数过多，账户已被锁定"),
    CAPTCHA_INVALID(1108, "验证码错误"),
    CAPTCHA_EXPIRED(1109, "验证码已过期"),
    VERIFICATION_CODE_INVALID(1110, "验证码错误"),
    VERIFICATION_CODE_EXPIRED(1111, "验证码已过期"),

    // 权限相关错误 (1200-1299)
    INSUFFICIENT_PERMISSIONS(1201, "权限不足"),
    ROLE_NOT_FOUND(1202, "角色不存在"),
    PERMISSION_DENIED(1203, "权限被拒绝"),
    ACCESS_DENIED(1204, "访问被拒绝"),

    // 数据相关错误 (1300-1399)
    DATA_NOT_FOUND(1301, "数据不存在"),
    DATA_ALREADY_EXISTS(1302, "数据已存在"),
    DATA_INTEGRITY_VIOLATION(1303, "数据完整性约束违反"),
    OPTIMISTIC_LOCK_FAILURE(1304, "数据已被其他用户修改，请刷新后重试"),

    // 文件相关错误 (1400-1499)
    FILE_NOT_FOUND(1401, "文件不存在"),
    FILE_UPLOAD_FAILED(1402, "文件上传失败"),
    FILE_TYPE_NOT_SUPPORTED(1403, "不支持的文件类型"),
    FILE_SIZE_EXCEEDED(1404, "文件大小超出限制"),

    // 网络相关错误 (1500-1599)
    NETWORK_ERROR(1501, "网络错误"),
    TIMEOUT_ERROR(1502, "请求超时"),
    CONNECTION_REFUSED(1503, "连接被拒绝"),

    // 第三方服务错误 (1600-1699)
    THIRD_PARTY_SERVICE_ERROR(1601, "第三方服务错误"),
    SMS_SEND_FAILED(1602, "短信发送失败"),
    EMAIL_SEND_FAILED(1603, "邮件发送失败"),
    PAYMENT_FAILED(1604, "支付失败"),

    // 系统相关错误 (1700-1799)
    SYSTEM_MAINTENANCE(1701, "系统维护中"),
    SYSTEM_BUSY(1702, "系统繁忙，请稍后重试"),
    CONFIGURATION_ERROR(1703, "系统配置错误"),
    DATABASE_ERROR(1704, "数据库错误"),
    CACHE_ERROR(1705, "缓存错误"),

    // 安全相关错误 (1800-1899)
    SECURITY_VIOLATION(1801, "安全违规"),
    XSS_ATTACK_DETECTED(1802, "检测到XSS攻击"),
    SQL_INJECTION_DETECTED(1803, "检测到SQL注入攻击"),
    CSRF_TOKEN_INVALID(1804, "CSRF令牌无效"),
    IP_BLOCKED(1805, "IP地址已被封禁"),
    SUSPICIOUS_ACTIVITY(1806, "检测到可疑活动"),

    // API相关错误 (1900-1999)
    API_NOT_FOUND(1901, "API接口不存在"),
    API_VERSION_NOT_SUPPORTED(1902, "API版本不支持"),
    API_RATE_LIMIT_EXCEEDED(1903, "API调用频率超限"),
    API_QUOTA_EXCEEDED(1904, "API调用配额超限");

    /**
     * 状态码
     */
    private final Integer code;

    /**
     * 状态消息
     */
    private final String message;

    /**
     * 根据状态码获取响应码枚举
     * 
     * @param code 状态码
     * @return 响应码枚举
     */
    public static ResponseCode getByCode(Integer code) {
        for (ResponseCode responseCode : values()) {
            if (responseCode.getCode().equals(code)) {
                return responseCode;
            }
        }
        return INTERNAL_ERROR;
    }

    /**
     * 判断是否为成功状态码
     * 
     * @return 是否成功
     */
    public boolean isSuccess() {
        return this.code >= 200 && this.code < 300;
    }

    /**
     * 判断是否为客户端错误状态码
     * 
     * @return 是否为客户端错误
     */
    public boolean isClientError() {
        return this.code >= 400 && this.code < 500;
    }

    /**
     * 判断是否为服务器错误状态码
     * 
     * @return 是否为服务器错误
     */
    public boolean isServerError() {
        return this.code >= 500 && this.code < 600;
    }

    /**
     * 判断是否为业务错误状态码
     * 
     * @return 是否为业务错误
     */
    public boolean isBusinessError() {
        return this.code >= 1000 && this.code < 2000;
    }
}