package com.siku.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * 密码更新请求DTO
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePasswordRequest {
    
    /**
     * 原密码
     */
    @NotBlank(message = "原密码不能为空")
    private String oldPassword;
    
    /**
     * 新密码
     */
    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, max = 100, message = "新密码长度必须在8-100个字符之间")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$", 
             message = "新密码必须包含大小写字母、数字和特殊字符")
    private String newPassword;
    
    /**
     * 确认新密码
     */
    @NotBlank(message = "确认新密码不能为空")
    private String confirmPassword;
    
    /**
     * 验证码（可选，用于安全验证）
     */
    private String verificationCode;
    
    /**
     * 验证码类型：email, sms
     */
    private String verificationType;
    
    /**
     * 验证新密码是否一致
     * 
     * @return 是否一致
     */
    public boolean isNewPasswordMatch() {
        return newPassword != null && newPassword.equals(confirmPassword);
    }
    
    /**
     * 验证新密码是否与原密码相同
     * 
     * @return 是否相同
     */
    public boolean isNewPasswordSameAsOld() {
        return newPassword != null && newPassword.equals(oldPassword);
    }
}