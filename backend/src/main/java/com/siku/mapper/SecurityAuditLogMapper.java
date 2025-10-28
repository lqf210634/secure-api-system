package com.siku.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.siku.entity.SecurityAuditLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 安全审计日志Mapper接口
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Mapper
public interface SecurityAuditLogMapper extends BaseMapper<SecurityAuditLog> {

    /**
     * 统计指定时间范围内的事件数量
     * 
     * @param eventType 事件类型
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 事件数量
     */
    @Select("SELECT COUNT(*) FROM security_audit_log " +
            "WHERE event_type = #{eventType} " +
            "AND created_at BETWEEN #{startTime} AND #{endTime}")
    Long countEventsByType(@Param("eventType") String eventType,
                          @Param("startTime") LocalDateTime startTime,
                          @Param("endTime") LocalDateTime endTime);

    /**
     * 统计指定时间范围内的失败登录次数
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 失败登录次数
     */
    @Select("SELECT COUNT(*) FROM security_audit_log " +
            "WHERE event_type = 'LOGIN' " +
            "AND operation_result = 'FAILURE' " +
            "AND created_at BETWEEN #{startTime} AND #{endTime}")
    Long countFailedLogins(@Param("startTime") LocalDateTime startTime,
                          @Param("endTime") LocalDateTime endTime);

    /**
     * 统计指定用户的失败登录次数
     * 
     * @param username 用户名
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 失败登录次数
     */
    @Select("SELECT COUNT(*) FROM security_audit_log " +
            "WHERE event_type = 'LOGIN' " +
            "AND operation_result = 'FAILURE' " +
            "AND username = #{username} " +
            "AND created_at BETWEEN #{startTime} AND #{endTime}")
    Long countFailedLoginsByUser(@Param("username") String username,
                                @Param("startTime") LocalDateTime startTime,
                                @Param("endTime") LocalDateTime endTime);

    /**
     * 统计指定IP的失败登录次数
     * 
     * @param clientIp 客户端IP
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 失败登录次数
     */
    @Select("SELECT COUNT(*) FROM security_audit_log " +
            "WHERE event_type = 'LOGIN' " +
            "AND operation_result = 'FAILURE' " +
            "AND client_ip = #{clientIp} " +
            "AND created_at BETWEEN #{startTime} AND #{endTime}")
    Long countFailedLoginsByIp(@Param("clientIp") String clientIp,
                              @Param("startTime") LocalDateTime startTime,
                              @Param("endTime") LocalDateTime endTime);

    /**
     * 获取事件类型统计
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 事件类型统计列表
     */
    @Select("SELECT event_type, COUNT(*) as count " +
            "FROM security_audit_log " +
            "WHERE created_at BETWEEN #{startTime} AND #{endTime} " +
            "GROUP BY event_type " +
            "ORDER BY count DESC")
    List<Map<String, Object>> getEventTypeStatistics(@Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime);

    /**
     * 获取风险等级统计
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 风险等级统计列表
     */
    @Select("SELECT risk_level, COUNT(*) as count " +
            "FROM security_audit_log " +
            "WHERE created_at BETWEEN #{startTime} AND #{endTime} " +
            "AND risk_level IS NOT NULL " +
            "GROUP BY risk_level " +
            "ORDER BY count DESC")
    List<Map<String, Object>> getRiskLevelStatistics(@Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime);

    /**
     * 获取每日事件统计
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 每日事件统计列表
     */
    @Select("SELECT DATE(created_at) as date, COUNT(*) as count " +
            "FROM security_audit_log " +
            "WHERE created_at BETWEEN #{startTime} AND #{endTime} " +
            "GROUP BY DATE(created_at) " +
            "ORDER BY date")
    List<Map<String, Object>> getDailyEventStatistics(@Param("startTime") LocalDateTime startTime,
                                                      @Param("endTime") LocalDateTime endTime);

    /**
     * 获取每小时事件统计
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 每小时事件统计列表
     */
    @Select("SELECT HOUR(created_at) as hour, COUNT(*) as count " +
            "FROM security_audit_log " +
            "WHERE created_at BETWEEN #{startTime} AND #{endTime} " +
            "GROUP BY HOUR(created_at) " +
            "ORDER BY hour")
    List<Map<String, Object>> getHourlyEventStatistics(@Param("startTime") LocalDateTime startTime,
                                                       @Param("endTime") LocalDateTime endTime);

    /**
     * 获取最活跃的IP地址
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param limit 限制数量
     * @return IP地址统计列表
     */
    @Select("SELECT client_ip, COUNT(*) as count " +
            "FROM security_audit_log " +
            "WHERE created_at BETWEEN #{startTime} AND #{endTime} " +
            "AND client_ip IS NOT NULL " +
            "GROUP BY client_ip " +
            "ORDER BY count DESC " +
            "LIMIT #{limit}")
    List<Map<String, Object>> getTopActiveIps(@Param("startTime") LocalDateTime startTime,
                                             @Param("endTime") LocalDateTime endTime,
                                             @Param("limit") int limit);

    /**
     * 获取最活跃的用户
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param limit 限制数量
     * @return 用户统计列表
     */
    @Select("SELECT username, COUNT(*) as count " +
            "FROM security_audit_log " +
            "WHERE created_at BETWEEN #{startTime} AND #{endTime} " +
            "AND username IS NOT NULL " +
            "GROUP BY username " +
            "ORDER BY count DESC " +
            "LIMIT #{limit}")
    List<Map<String, Object>> getTopActiveUsers(@Param("startTime") LocalDateTime startTime,
                                               @Param("endTime") LocalDateTime endTime,
                                               @Param("limit") int limit);

    /**
     * 获取最近的安全违规事件
     * 
     * @param limit 限制数量
     * @return 安全违规事件列表
     */
    @Select("SELECT * FROM security_audit_log " +
            "WHERE event_type = 'SECURITY_VIOLATION' " +
            "ORDER BY created_at DESC " +
            "LIMIT #{limit}")
    List<SecurityAuditLog> getRecentSecurityViolations(@Param("limit") int limit);

    /**
     * 获取指定用户的最近活动
     * 
     * @param username 用户名
     * @param limit 限制数量
     * @return 用户活动列表
     */
    @Select("SELECT * FROM security_audit_log " +
            "WHERE username = #{username} " +
            "ORDER BY created_at DESC " +
            "LIMIT #{limit}")
    List<SecurityAuditLog> getUserRecentActivities(@Param("username") String username,
                                                  @Param("limit") int limit);

    /**
     * 删除过期的审计日志
     * 
     * @param expireTime 过期时间
     * @return 删除的记录数
     */
    @Select("DELETE FROM security_audit_log WHERE created_at < #{expireTime}")
    int deleteExpiredLogs(@Param("expireTime") LocalDateTime expireTime);
}