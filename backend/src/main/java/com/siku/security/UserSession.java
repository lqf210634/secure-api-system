package com.siku.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * 用户会话信息
 * 存储从JWT Token解析出的用户会话数据
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {
    
    /**
     * 用户ID
     */
    private Long userId;
    
    /**
     * 会话ID
     */
    private String sessionId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 用户角色列表
     */
    private List<String> roles;
    
    /**
     * Token签发时间
     */
    private Instant issuedAt;
    
    /**
     * Token过期时间
     */
    private Instant expiresAt;
    
    /**
     * 检查会话是否有效（未过期）
     * 
     * @return 是否有效
     */
    public boolean isValid() {
        return expiresAt != null && Instant.now().isBefore(expiresAt);
    }
    
    /**
     * 检查用户是否具有指定角色
     * 
     * @param role 角色名称
     * @return 是否具有该角色
     */
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }
    
    /**
     * 检查用户是否具有任意一个指定角色
     * 
     * @param roles 角色列表
     * @return 是否具有任意一个角色
     */
    public boolean hasAnyRole(String... roles) {
        if (this.roles == null || roles == null) {
            return false;
        }
        
        for (String role : roles) {
            if (this.roles.contains(role)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查用户是否具有所有指定角色
     * 
     * @param roles 角色列表
     * @return 是否具有所有角色
     */
    public boolean hasAllRoles(String... roles) {
        if (this.roles == null || roles == null) {
            return false;
        }
        
        for (String role : roles) {
            if (!this.roles.contains(role)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 获取会话剩余有效时间（秒）
     * 
     * @return 剩余时间，如果已过期返回0
     */
    public long getRemainingSeconds() {
        if (expiresAt == null) {
            return 0;
        }
        
        long remaining = expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }
    
    /**
     * 检查会话是否即将过期（指定分钟内）
     * 
     * @param minutes 分钟数
     * @return 是否即将过期
     */
    public boolean isExpiringSoon(int minutes) {
        if (expiresAt == null) {
            return true;
        }
        
        Instant threshold = Instant.now().plusSeconds(minutes * 60L);
        return expiresAt.isBefore(threshold);
    }
}