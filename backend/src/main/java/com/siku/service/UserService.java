package com.siku.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.siku.dto.request.LoginRequest;
import com.siku.dto.request.RegisterRequest;
import com.siku.dto.request.UpdatePasswordRequest;
import com.siku.dto.request.UpdateUserRequest;
import com.siku.dto.response.LoginResponse;
import com.siku.dto.response.UserInfoResponse;
import com.siku.entity.User;

import java.util.List;
import java.util.Optional;

/**
 * 用户服务接口
 * 
 * @author SiKu Team
 * @version 1.0
 */
public interface UserService {
    
    // ==================== 认证相关方法 ====================
    
    /**
     * 用户登录
     * 
     * @param request 登录请求
     * @param clientIp 客户端IP
     * @return 登录响应
     */
    LoginResponse login(LoginRequest request, String clientIp);
    
    /**
     * 用户注册
     * 
     * @param request 注册请求
     * @param clientIp 客户端IP
     * @return 用户信息
     */
    UserInfoResponse register(RegisterRequest request, String clientIp);
    
    /**
     * 刷新Token
     * 
     * @param refreshToken 刷新Token
     * @return 新的登录响应
     */
    LoginResponse refreshToken(String refreshToken);
    
    /**
     * 用户登出
     * 
     * @param userId 用户ID
     * @param sessionId 会话ID
     */
    void logout(Long userId, String sessionId);
    
    // ==================== 用户信息管理 ====================
    
    /**
     * 根据ID获取用户信息
     * 
     * @param userId 用户ID
     * @return 用户信息
     */
    Optional<UserInfoResponse> getUserById(Long userId);
    
    /**
     * 根据用户名获取用户信息
     * 
     * @param username 用户名
     * @return 用户信息
     */
    Optional<UserInfoResponse> getUserByUsername(String username);
    
    /**
     * 更新用户信息
     * 
     * @param userId 用户ID
     * @param request 更新请求
     * @return 更新后的用户信息
     */
    UserInfoResponse updateUser(Long userId, UpdateUserRequest request);
    
    /**
     * 更新用户密码
     * 
     * @param userId 用户ID
     * @param request 密码更新请求
     */
    void updatePassword(Long userId, UpdatePasswordRequest request);
    
    /**
     * 禁用用户
     * 
     * @param userId 用户ID
     */
    void disableUser(Long userId);
    
    /**
     * 启用用户
     * 
     * @param userId 用户ID
     */
    void enableUser(Long userId);
    
    /**
     * 删除用户（软删除）
     * 
     * @param userId 用户ID
     */
    void deleteUser(Long userId);
    
    // ==================== 用户查询方法 ====================
    
    /**
     * 分页查询用户列表
     * 
     * @param page 页码
     * @param size 每页大小
     * @param keyword 搜索关键词
     * @param status 用户状态
     * @return 用户分页数据
     */
    Page<UserInfoResponse> getUserList(Integer page, Integer size, String keyword, Integer status);
    
    /**
     * 根据角色查询用户列表
     * 
     * @param role 角色名称
     * @return 用户列表
     */
    List<UserInfoResponse> getUsersByRole(String role);
    
    /**
     * 检查用户名是否存在
     * 
     * @param username 用户名
     * @return 是否存在
     */
    boolean existsByUsername(String username);
    
    /**
     * 检查邮箱是否存在
     * 
     * @param email 邮箱
     * @return 是否存在
     */
    boolean existsByEmail(String email);
    
    /**
     * 检查手机号是否存在
     * 
     * @param phone 手机号
     * @return 是否存在
     */
    boolean existsByPhone(String phone);
    
    // ==================== 用户角色管理 ====================
    
    /**
     * 为用户添加角色
     * 
     * @param userId 用户ID
     * @param role 角色名称
     */
    void addUserRole(Long userId, String role);
    
    /**
     * 移除用户角色
     * 
     * @param userId 用户ID
     * @param role 角色名称
     */
    void removeUserRole(Long userId, String role);
    
    /**
     * 设置用户角色列表
     * 
     * @param userId 用户ID
     * @param roles 角色列表
     */
    void setUserRoles(Long userId, List<String> roles);
    
    /**
     * 获取用户角色列表
     * 
     * @param userId 用户ID
     * @return 角色列表
     */
    List<String> getUserRoles(Long userId);
    
    // ==================== 账户安全管理 ====================
    
    /**
     * 重置用户登录失败次数
     * 
     * @param userId 用户ID
     */
    void resetLoginFailCount(Long userId);
    
    /**
     * 解锁用户账户
     * 
     * @param userId 用户ID
     */
    void unlockUser(Long userId);
    
    /**
     * 锁定用户账户
     * 
     * @param userId 用户ID
     * @param lockDurationMinutes 锁定时长（分钟）
     */
    void lockUser(Long userId, int lockDurationMinutes);
    
    // ==================== 统计方法 ====================
    
    /**
     * 获取用户统计信息
     * 
     * @return 统计信息
     */
    UserStatistics getUserStatistics();
    
    /**
     * 用户统计信息内部类
     */
    class UserStatistics {
        private long totalUsers;
        private long activeUsers;
        private long todayRegistrations;
        private long lockedUsers;
        
        // 构造函数、getter和setter方法
        public UserStatistics(long totalUsers, long activeUsers, long todayRegistrations, long lockedUsers) {
            this.totalUsers = totalUsers;
            this.activeUsers = activeUsers;
            this.todayRegistrations = todayRegistrations;
            this.lockedUsers = lockedUsers;
        }
        
        // Getters
        public long getTotalUsers() { return totalUsers; }
        public long getActiveUsers() { return activeUsers; }
        public long getTodayRegistrations() { return todayRegistrations; }
        public long getLockedUsers() { return lockedUsers; }
    }
}