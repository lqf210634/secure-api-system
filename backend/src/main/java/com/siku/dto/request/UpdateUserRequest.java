package com.siku.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * 用户信息更新请求DTO
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    
    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    @Size(max = 100, message = "邮箱长度不能超过100个字符")
    private String email;
    
    /**
     * 手机号
     */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    /**
     * 昵称
     */
    @Size(max = 50, message = "昵称长度不能超过50个字符")
    private String nickname;
    
    /**
     * 头像URL
     */
    @Size(max = 500, message = "头像URL长度不能超过500个字符")
    private String avatarUrl;
    
    /**
     * 邮箱验证码（当更新邮箱时需要）
     */
    private String emailCode;
    
    /**
     * 手机验证码（当更新手机号时需要）
     */
    private String phoneCode;
}