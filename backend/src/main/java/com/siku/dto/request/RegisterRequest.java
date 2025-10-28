package com.siku.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * 注册请求DTO
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;
    
    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 100, message = "密码长度必须在8-100个字符之间")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$", 
             message = "密码必须包含大小写字母、数字和特殊字符")
    private String password;
    
    /**
     * 确认密码
     */
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;
    
    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 100, message = "邮箱长度不能超过100个字符")
    private String email;
    
    /**
     * 手机号（可选）
     */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    /**
     * 昵称（可选）
     */
    @Size(max = 50, message = "昵称长度不能超过50个字符")
    private String nickname;
    
    /**
     * 邮箱验证码
     */
    @NotBlank(message = "邮箱验证码不能为空")
    @Size(min = 4, max = 10, message = "验证码长度不正确")
    private String emailCode;
    
    /**
     * 手机验证码（如果提供了手机号）
     */
    private String phoneCode;
    
    /**
     * 图形验证码
     */
    @NotBlank(message = "图形验证码不能为空")
    private String captcha;
    
    /**
     * 图形验证码Token
     */
    @NotBlank(message = "验证码Token不能为空")
    private String captchaToken;
    
    /**
     * 是否同意用户协议
     */
    @NotBlank(message = "必须同意用户协议")
    private Boolean agreeTerms;
    
    /**
     * 邀请码（可选）
     */
    private String inviteCode;
    
    /**
     * 设备信息（可选）
     */
    private String deviceInfo;
    
    /**
     * 客户端类型（可选）：web, mobile, desktop
     */
    private String clientType;
    
    /**
     * 验证密码是否一致
     * 
     * @return 是否一致
     */
    public boolean isPasswordMatch() {
        return password != null && password.equals(confirmPassword);
    }
}