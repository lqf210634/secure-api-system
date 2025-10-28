package com.siku.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 登录响应DTO
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    
    /**
     * 访问Token
     */
    private String accessToken;
    
    /**
     * 刷新Token
     */
    private String refreshToken;
    
    /**
     * Token类型
     */
    @Builder.Default
    private String tokenType = "Bearer";
    
    /**
     * 访问Token过期时间（秒）
     */
    private Integer expiresIn;
    
    /**
     * 刷新Token过期时间（秒）
     */
    private Integer refreshExpiresIn;
    
    /**
     * 会话ID
     */
    private String sessionId;
    
    /**
     * 用户信息
     */
    private UserInfo userInfo;
    
    /**
     * 登录时间
     */
    private LocalDateTime loginTime;
    
    /**
     * 登录IP
     */
    private String loginIp;
    
    /**
     * 设备信息
     */
    private String deviceInfo;
    
    /**
     * 是否首次登录
     */
    private Boolean firstLogin;
    
    /**
     * 用户信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserInfo {
        
        /**
         * 用户ID
         */
        private Long id;
        
        /**
         * 用户名
         */
        private String username;
        
        /**
         * 邮箱
         */
        private String email;
        
        /**
         * 手机号
         */
        private String phone;
        
        /**
         * 昵称
         */
        private String nickname;
        
        /**
         * 头像URL
         */
        private String avatarUrl;
        
        /**
         * 用户状态
         */
        private Integer status;
        
        /**
         * 用户角色列表
         */
        private List<String> roles;
        
        /**
         * 最后登录时间
         */
        private LocalDateTime lastLoginTime;
        
        /**
         * 注册时间
         */
        private LocalDateTime createdAt;
        
        /**
         * 显示名称
         */
        private String displayName;
    }
}