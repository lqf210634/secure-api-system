package com.siku.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 登录请求DTO
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    /**
     * 用户名或邮箱
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 100, message = "用户名长度必须在3-100个字符之间")
    private String username;
    
    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度必须在6-100个字符之间")
    private String password;
    
    /**
     * 记住我（可选）
     */
    private Boolean rememberMe;
    
    /**
     * 设备信息（可选）
     */
    private String deviceInfo;
    
    /**
     * 客户端类型（可选）：web, mobile, desktop
     */
    private String clientType;
    
    /**
     * 验证码（可选，用于安全验证）
     */
    private String captcha;
    
    /**
     * 验证码Token（可选）
     */
    private String captchaToken;
}