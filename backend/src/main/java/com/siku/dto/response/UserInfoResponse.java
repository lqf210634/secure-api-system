package com.siku.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户信息响应DTO
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserInfoResponse {
    
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
     * 用户状态：0-禁用，1-启用
     */
    private Integer status;
    
    /**
     * 用户状态描述
     */
    private String statusText;
    
    /**
     * 用户角色列表
     */
    private List<String> roles;
    
    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginTime;
    
    /**
     * 最后登录IP
     */
    private String lastLoginIp;
    
    /**
     * 登录失败次数
     */
    private Integer loginFailCount;
    
    /**
     * 账户锁定时间
     */
    private LocalDateTime lockedUntil;
    
    /**
     * 是否被锁定
     */
    private Boolean isLocked;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 显示名称
     */
    private String displayName;
    
    /**
     * 账户可用性
     */
    private Boolean isAvailable;
    
    /**
     * 获取用户状态描述
     * 
     * @return 状态描述
     */
    public String getStatusText() {
        if (status == null) {
            return "未知";
        }
        
        switch (status) {
            case 0:
                return "禁用";
            case 1:
                return "启用";
            default:
                return "未知";
        }
    }
    
    /**
     * 获取是否被锁定状态
     * 
     * @return 是否被锁定
     */
    public Boolean getIsLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }
    
    /**
     * 获取账户可用性
     * 
     * @return 是否可用
     */
    public Boolean getIsAvailable() {
        return status != null && status == 1 && !getIsLocked();
    }
    
    /**
     * 获取显示名称
     * 
     * @return 显示名称
     */
    public String getDisplayName() {
        return nickname != null && !nickname.trim().isEmpty() ? nickname : username;
    }
}