package com.siku.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户实体类
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("users")
public class User {
    
    /**
     * 用户ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
    @TableField("username")
    private String username;
    
    /**
     * 密码（加密后）
     */
    @JsonIgnore
    @NotBlank(message = "密码不能为空")
    @TableField("password")
    private String password;
    
    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    @TableField("email")
    private String email;
    
    /**
     * 手机号
     */
    @TableField("phone")
    private String phone;
    
    /**
     * 昵称
     */
    @TableField("nickname")
    private String nickname;
    
    /**
     * 头像URL
     */
    @TableField("avatar_url")
    private String avatarUrl;
    
    /**
     * 用户状态：0-禁用，1-启用
     */
    @TableField("status")
    @Builder.Default
    private Integer status = 1;
    
    /**
     * 用户角色列表（JSON格式存储）
     */
    @TableField("roles")
    private String rolesJson;
    
    /**
     * 最后登录时间
     */
    @TableField("last_login_time")
    private LocalDateTime lastLoginTime;
    
    /**
     * 最后登录IP
     */
    @TableField("last_login_ip")
    private String lastLoginIp;
    
    /**
     * 登录失败次数
     */
    @TableField("login_fail_count")
    @Builder.Default
    private Integer loginFailCount = 0;
    
    /**
     * 账户锁定时间
     */
    @TableField("locked_until")
    private LocalDateTime lockedUntil;
    
    /**
     * 创建时间
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    /**
     * 逻辑删除标志：0-未删除，1-已删除
     */
    @TableLogic
    @TableField("deleted")
    @Builder.Default
    private Integer deleted = 0;
    
    /**
     * 版本号（乐观锁）
     */
    @Version
    @TableField("version")
    @Builder.Default
    private Integer version = 0;
    
    // ==================== 业务方法 ====================
    
    /**
     * 获取用户角色列表
     * 
     * @return 角色列表
     */
    @JsonIgnore
    public List<String> getRoles() {
        if (rolesJson == null || rolesJson.trim().isEmpty()) {
            return List.of("USER"); // 默认角色
        }
        
        try {
            // 简单的JSON解析，实际项目中可以使用Jackson
            String[] roles = rolesJson.replace("[", "")
                                    .replace("]", "")
                                    .replace("\"", "")
                                    .split(",");
            return List.of(roles);
        } catch (Exception e) {
            return List.of("USER");
        }
    }
    
    /**
     * 设置用户角色列表
     * 
     * @param roles 角色列表
     */
    public void setRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            this.rolesJson = "[\"USER\"]";
        } else {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < roles.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(roles.get(i)).append("\"");
            }
            sb.append("]");
            this.rolesJson = sb.toString();
        }
    }
    
    /**
     * 检查用户是否具有指定角色
     * 
     * @param role 角色名称
     * @return 是否具有该角色
     */
    public boolean hasRole(String role) {
        return getRoles().contains(role);
    }
    
    /**
     * 检查用户账户是否启用
     * 
     * @return 是否启用
     */
    public boolean isEnabled() {
        return status != null && status == 1;
    }
    
    /**
     * 检查用户账户是否被锁定
     * 
     * @return 是否被锁定
     */
    public boolean isLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }
    
    /**
     * 检查用户账户是否可用（启用且未锁定）
     * 
     * @return 是否可用
     */
    public boolean isAccountAvailable() {
        return isEnabled() && !isLocked();
    }
    
    /**
     * 重置登录失败次数
     */
    public void resetLoginFailCount() {
        this.loginFailCount = 0;
        this.lockedUntil = null;
    }
    
    /**
     * 增加登录失败次数
     * 
     * @param maxFailCount 最大失败次数
     * @param lockDurationMinutes 锁定时长（分钟）
     */
    public void incrementLoginFailCount(int maxFailCount, int lockDurationMinutes) {
        this.loginFailCount = (this.loginFailCount == null ? 0 : this.loginFailCount) + 1;
        
        if (this.loginFailCount >= maxFailCount) {
            this.lockedUntil = LocalDateTime.now().plusMinutes(lockDurationMinutes);
        }
    }
    
    /**
     * 更新最后登录信息
     * 
     * @param loginIp 登录IP
     */
    public void updateLastLoginInfo(String loginIp) {
        this.lastLoginTime = LocalDateTime.now();
        this.lastLoginIp = loginIp;
        resetLoginFailCount();
    }
    
    /**
     * 获取显示名称（优先使用昵称，其次用户名）
     * 
     * @return 显示名称
     */
    public String getDisplayName() {
        return nickname != null && !nickname.trim().isEmpty() ? nickname : username;
    }
}