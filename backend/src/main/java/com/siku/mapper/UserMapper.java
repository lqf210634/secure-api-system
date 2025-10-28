package com.siku.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.siku.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 用户数据访问层
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * 根据用户名查找用户
     * 
     * @param username 用户名
     * @return 用户信息
     */
    @Select("SELECT * FROM users WHERE username = #{username} AND deleted = 0")
    Optional<User> findByUsername(@Param("username") String username);
    
    /**
     * 根据邮箱查找用户
     * 
     * @param email 邮箱
     * @return 用户信息
     */
    @Select("SELECT * FROM users WHERE email = #{email} AND deleted = 0")
    Optional<User> findByEmail(@Param("email") String email);
    
    /**
     * 根据手机号查找用户
     * 
     * @param phone 手机号
     * @return 用户信息
     */
    @Select("SELECT * FROM users WHERE phone = #{phone} AND deleted = 0")
    Optional<User> findByPhone(@Param("phone") String phone);
    
    /**
     * 检查用户名是否存在
     * 
     * @param username 用户名
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM users WHERE username = #{username} AND deleted = 0")
    boolean existsByUsername(@Param("username") String username);
    
    /**
     * 检查邮箱是否存在
     * 
     * @param email 邮箱
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM users WHERE email = #{email} AND deleted = 0")
    boolean existsByEmail(@Param("email") String email);
    
    /**
     * 检查手机号是否存在
     * 
     * @param phone 手机号
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM users WHERE phone = #{phone} AND deleted = 0")
    boolean existsByPhone(@Param("phone") String phone);
    
    /**
     * 更新用户最后登录信息
     * 
     * @param userId 用户ID
     * @param loginTime 登录时间
     * @param loginIp 登录IP
     * @return 更新行数
     */
    @Update("UPDATE users SET last_login_time = #{loginTime}, last_login_ip = #{loginIp}, " +
            "login_fail_count = 0, locked_until = NULL, updated_at = NOW() " +
            "WHERE id = #{userId}")
    int updateLastLoginInfo(@Param("userId") Long userId, 
                           @Param("loginTime") LocalDateTime loginTime, 
                           @Param("loginIp") String loginIp);
    
    /**
     * 更新用户登录失败信息
     * 
     * @param userId 用户ID
     * @param failCount 失败次数
     * @param lockedUntil 锁定截止时间
     * @return 更新行数
     */
    @Update("UPDATE users SET login_fail_count = #{failCount}, locked_until = #{lockedUntil}, " +
            "updated_at = NOW() WHERE id = #{userId}")
    int updateLoginFailInfo(@Param("userId") Long userId, 
                           @Param("failCount") Integer failCount, 
                           @Param("lockedUntil") LocalDateTime lockedUntil);
    
    /**
     * 重置用户登录失败信息
     * 
     * @param userId 用户ID
     * @return 更新行数
     */
    @Update("UPDATE users SET login_fail_count = 0, locked_until = NULL, updated_at = NOW() " +
            "WHERE id = #{userId}")
    int resetLoginFailInfo(@Param("userId") Long userId);
    
    /**
     * 更新用户密码
     * 
     * @param userId 用户ID
     * @param newPassword 新密码（已加密）
     * @return 更新行数
     */
    @Update("UPDATE users SET password = #{newPassword}, updated_at = NOW() WHERE id = #{userId}")
    int updatePassword(@Param("userId") Long userId, @Param("newPassword") String newPassword);
    
    /**
     * 更新用户状态
     * 
     * @param userId 用户ID
     * @param status 状态
     * @return 更新行数
     */
    @Update("UPDATE users SET status = #{status}, updated_at = NOW() WHERE id = #{userId}")
    int updateStatus(@Param("userId") Long userId, @Param("status") Integer status);
    
    /**
     * 更新用户角色
     * 
     * @param userId 用户ID
     * @param rolesJson 角色JSON字符串
     * @return 更新行数
     */
    @Update("UPDATE users SET roles = #{rolesJson}, updated_at = NOW() WHERE id = #{userId}")
    int updateRoles(@Param("userId") Long userId, @Param("rolesJson") String rolesJson);
    
    /**
     * 软删除用户
     * 
     * @param userId 用户ID
     * @return 更新行数
     */
    @Update("UPDATE users SET deleted = 1, updated_at = NOW() WHERE id = #{userId}")
    int softDeleteUser(@Param("userId") Long userId);
    
    /**
     * 统计活跃用户数量（最近30天内登录过的用户）
     * 
     * @return 活跃用户数量
     */
    @Select("SELECT COUNT(*) FROM users WHERE last_login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) " +
            "AND deleted = 0")
    long countActiveUsers();
    
    /**
     * 统计今日新注册用户数量
     * 
     * @return 今日新注册用户数量
     */
    @Select("SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE() AND deleted = 0")
    long countTodayRegistrations();
    
    /**
     * 统计被锁定的用户数量
     * 
     * @return 被锁定的用户数量
     */
    @Select("SELECT COUNT(*) FROM users WHERE locked_until > NOW() AND deleted = 0")
    long countLockedUsers();
}