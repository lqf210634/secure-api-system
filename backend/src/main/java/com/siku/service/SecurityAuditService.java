package com.siku.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.siku.entity.SecurityAuditLog;
import com.siku.entity.User;
import com.siku.mapper.SecurityAuditLogMapper;
import com.siku.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 安全审计日志服务
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditService extends ServiceImpl<SecurityAuditLogMapper, SecurityAuditLog> {

    private final ObjectMapper objectMapper;

    /**
     * 记录安全审计日志（异步）
     * 
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param description 事件描述
     */
    @Async
    public void logSecurityEvent(String eventType, String eventLevel, String description) {
        logSecurityEvent(eventType, eventLevel, description, null, null, null);
    }

    /**
     * 记录安全审计日志（异步）
     * 
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param description 事件描述
     * @param result 操作结果
     */
    @Async
    public void logSecurityEvent(String eventType, String eventLevel, String description, String result) {
        logSecurityEvent(eventType, eventLevel, description, result, null, null);
    }

    /**
     * 记录安全审计日志（异步）
     * 
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param description 事件描述
     * @param result 操作结果
     * @param riskLevel 风险等级
     * @param extraData 额外数据
     */
    @Async
    public void logSecurityEvent(String eventType, String eventLevel, String description, 
                                String result, String riskLevel, Map<String, Object> extraData) {
        try {
            SecurityAuditLog auditLog = createAuditLog(eventType, eventLevel, description, result, riskLevel, extraData);
            save(auditLog);
            log.debug("安全审计日志记录成功: {}", auditLog.getId());
        } catch (Exception e) {
            log.error("记录安全审计日志失败", e);
        }
    }

    /**
     * 记录登录事件
     * 
     * @param username 用户名
     * @param success 是否成功
     * @param reason 失败原因
     */
    @Async
    public void logLoginEvent(String username, boolean success, String reason) {
        String eventLevel = success ? SecurityAuditLog.EventLevel.INFO.name() : SecurityAuditLog.EventLevel.WARN.name();
        String result = success ? SecurityAuditLog.OperationResult.SUCCESS.name() : SecurityAuditLog.OperationResult.FAILURE.name();
        String description = success ? "用户登录成功" : "用户登录失败: " + reason;
        String riskLevel = success ? SecurityAuditLog.RiskLevel.LOW.name() : SecurityAuditLog.RiskLevel.MEDIUM.name();
        
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("username", username);
        if (!success && StringUtils.hasText(reason)) {
            extraData.put("failureReason", reason);
        }
        
        logSecurityEvent(SecurityAuditLog.EventType.LOGIN.name(), eventLevel, description, result, riskLevel, extraData);
    }

    /**
     * 记录登出事件
     * 
     * @param username 用户名
     */
    @Async
    public void logLogoutEvent(String username) {
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("username", username);
        
        logSecurityEvent(SecurityAuditLog.EventType.LOGOUT.name(), 
                        SecurityAuditLog.EventLevel.INFO.name(), 
                        "用户登出", 
                        SecurityAuditLog.OperationResult.SUCCESS.name(),
                        SecurityAuditLog.RiskLevel.LOW.name(),
                        extraData);
    }

    /**
     * 记录密码修改事件
     * 
     * @param username 用户名
     * @param success 是否成功
     */
    @Async
    public void logPasswordChangeEvent(String username, boolean success) {
        String eventLevel = success ? SecurityAuditLog.EventLevel.INFO.name() : SecurityAuditLog.EventLevel.WARN.name();
        String result = success ? SecurityAuditLog.OperationResult.SUCCESS.name() : SecurityAuditLog.OperationResult.FAILURE.name();
        String description = success ? "密码修改成功" : "密码修改失败";
        String riskLevel = SecurityAuditLog.RiskLevel.MEDIUM.name();
        
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("username", username);
        
        logSecurityEvent(SecurityAuditLog.EventType.PASSWORD_CHANGE.name(), eventLevel, description, result, riskLevel, extraData);
    }

    /**
     * 记录API访问事件
     * 
     * @param apiPath API路径
     * @param method HTTP方法
     * @param statusCode 响应状态码
     * @param processingTime 处理时间
     */
    @Async
    public void logApiAccessEvent(String apiPath, String method, int statusCode, long processingTime) {
        String eventLevel = statusCode >= 400 ? SecurityAuditLog.EventLevel.WARN.name() : SecurityAuditLog.EventLevel.INFO.name();
        String result = statusCode >= 400 ? SecurityAuditLog.OperationResult.FAILURE.name() : SecurityAuditLog.OperationResult.SUCCESS.name();
        String description = String.format("API访问: %s %s", method, apiPath);
        String riskLevel = statusCode >= 500 ? SecurityAuditLog.RiskLevel.HIGH.name() : SecurityAuditLog.RiskLevel.LOW.name();
        
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("apiPath", apiPath);
        extraData.put("method", method);
        extraData.put("statusCode", statusCode);
        extraData.put("processingTime", processingTime);
        
        logSecurityEvent(SecurityAuditLog.EventType.API_ACCESS.name(), eventLevel, description, result, riskLevel, extraData);
    }

    /**
     * 记录安全违规事件
     * 
     * @param violationType 违规类型
     * @param description 描述
     * @param riskLevel 风险等级
     */
    @Async
    public void logSecurityViolation(String violationType, String description, String riskLevel) {
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("violationType", violationType);
        
        logSecurityEvent(SecurityAuditLog.EventType.SECURITY_VIOLATION.name(), 
                        SecurityAuditLog.EventLevel.ERROR.name(), 
                        description, 
                        SecurityAuditLog.OperationResult.BLOCKED.name(),
                        riskLevel,
                        extraData);
    }

    /**
     * 分页查询安全审计日志
     * 
     * @param page 页码
     * @param size 页大小
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param username 用户名
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 分页结果
     */
    public IPage<SecurityAuditLog> getAuditLogs(int page, int size, String eventType, String eventLevel, 
                                               String username, LocalDateTime startTime, LocalDateTime endTime) {
        Page<SecurityAuditLog> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<SecurityAuditLog> queryWrapper = new LambdaQueryWrapper<>();
        
        if (StringUtils.hasText(eventType)) {
            queryWrapper.eq(SecurityAuditLog::getEventType, eventType);
        }
        
        if (StringUtils.hasText(eventLevel)) {
            queryWrapper.eq(SecurityAuditLog::getEventLevel, eventLevel);
        }
        
        if (StringUtils.hasText(username)) {
            queryWrapper.like(SecurityAuditLog::getUsername, username);
        }
        
        if (startTime != null) {
            queryWrapper.ge(SecurityAuditLog::getCreatedAt, startTime);
        }
        
        if (endTime != null) {
            queryWrapper.le(SecurityAuditLog::getCreatedAt, endTime);
        }
        
        queryWrapper.orderByDesc(SecurityAuditLog::getCreatedAt);
        
        return page(pageParam, queryWrapper);
    }

    /**
     * 获取安全统计信息
     * 
     * @param days 统计天数
     * @return 统计信息
     */
    public Map<String, Object> getSecurityStatistics(int days) {
        LocalDateTime startTime = LocalDateTime.now().minusDays(days);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 总事件数
        LambdaQueryWrapper<SecurityAuditLog> totalWrapper = new LambdaQueryWrapper<>();
        totalWrapper.ge(SecurityAuditLog::getCreatedAt, startTime);
        long totalEvents = count(totalWrapper);
        statistics.put("totalEvents", totalEvents);
        
        // 登录事件数
        LambdaQueryWrapper<SecurityAuditLog> loginWrapper = new LambdaQueryWrapper<>();
        loginWrapper.eq(SecurityAuditLog::getEventType, SecurityAuditLog.EventType.LOGIN.name())
                   .ge(SecurityAuditLog::getCreatedAt, startTime);
        long loginEvents = count(loginWrapper);
        statistics.put("loginEvents", loginEvents);
        
        // 失败登录数
        LambdaQueryWrapper<SecurityAuditLog> failedLoginWrapper = new LambdaQueryWrapper<>();
        failedLoginWrapper.eq(SecurityAuditLog::getEventType, SecurityAuditLog.EventType.LOGIN.name())
                         .eq(SecurityAuditLog::getOperationResult, SecurityAuditLog.OperationResult.FAILURE.name())
                         .ge(SecurityAuditLog::getCreatedAt, startTime);
        long failedLogins = count(failedLoginWrapper);
        statistics.put("failedLogins", failedLogins);
        
        // 安全违规数
        LambdaQueryWrapper<SecurityAuditLog> violationWrapper = new LambdaQueryWrapper<>();
        violationWrapper.eq(SecurityAuditLog::getEventType, SecurityAuditLog.EventType.SECURITY_VIOLATION.name())
                       .ge(SecurityAuditLog::getCreatedAt, startTime);
        long violations = count(violationWrapper);
        statistics.put("violations", violations);
        
        // 高风险事件数
        LambdaQueryWrapper<SecurityAuditLog> highRiskWrapper = new LambdaQueryWrapper<>();
        highRiskWrapper.in(SecurityAuditLog::getRiskLevel, 
                          SecurityAuditLog.RiskLevel.HIGH.name(), 
                          SecurityAuditLog.RiskLevel.CRITICAL.name())
                      .ge(SecurityAuditLog::getCreatedAt, startTime);
        long highRiskEvents = count(highRiskWrapper);
        statistics.put("highRiskEvents", highRiskEvents);
        
        return statistics;
    }

    /**
     * 创建审计日志对象
     * 
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param description 事件描述
     * @param result 操作结果
     * @param riskLevel 风险等级
     * @param extraData 额外数据
     * @return 审计日志对象
     */
    private SecurityAuditLog createAuditLog(String eventType, String eventLevel, String description, 
                                           String result, String riskLevel, Map<String, Object> extraData) {
        SecurityAuditLog auditLog = new SecurityAuditLog();
        
        // 基本信息
        auditLog.setEventType(eventType);
        auditLog.setEventLevel(eventLevel);
        auditLog.setEventDescription(description);
        auditLog.setOperationResult(result);
        auditLog.setRiskLevel(riskLevel);
        auditLog.setTraceId(UUID.randomUUID().toString());
        
        // 用户信息
        try {
            Long currentUserId = SecurityUtils.getCurrentUserId();
            String currentUsername = SecurityUtils.getCurrentUsername();
            auditLog.setUserId(currentUserId);
            auditLog.setUsername(currentUsername);
        } catch (Exception e) {
            // 忽略获取用户信息失败的情况
        }
        
        // 请求信息
        try {
            HttpServletRequest request = getCurrentRequest();
            if (request != null) {
                auditLog.setClientIp(SecurityUtils.getClientIp(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
                auditLog.setRequestMethod(request.getMethod());
                auditLog.setRequestUrl(request.getRequestURL().toString());
                auditLog.setSessionId(request.getSession().getId());
                
                // 请求参数（敏感信息需要过滤）
                String params = getFilteredRequestParams(request);
                auditLog.setRequestParams(params);
            }
        } catch (Exception e) {
            log.debug("获取请求信息失败", e);
        }
        
        // 额外数据
        if (extraData != null && !extraData.isEmpty()) {
            try {
                auditLog.setExtraData(objectMapper.writeValueAsString(extraData));
            } catch (JsonProcessingException e) {
                log.warn("序列化额外数据失败", e);
            }
        }
        
        auditLog.setCreatedAt(LocalDateTime.now());
        
        return auditLog;
    }

    /**
     * 获取当前请求
     * 
     * @return HttpServletRequest
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * 获取过滤后的请求参数
     * 
     * @param request HTTP请求
     * @return 过滤后的参数字符串
     */
    private String getFilteredRequestParams(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        if (parameterMap.isEmpty()) {
            return null;
        }
        
        Map<String, Object> filteredParams = new HashMap<>();
        for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
            String key = entry.getKey().toLowerCase();
            String[] values = entry.getValue();
            
            // 过滤敏感参数
            if (key.contains("password") || key.contains("token") || key.contains("secret")) {
                filteredParams.put(entry.getKey(), "***");
            } else {
                filteredParams.put(entry.getKey(), values.length == 1 ? values[0] : values);
            }
        }
        
        try {
            return objectMapper.writeValueAsString(filteredParams);
        } catch (JsonProcessingException e) {
            return filteredParams.toString();
        }
    }

    /**
     * 清理过期的审计日志
     * 
     * @param days 保留天数
     * @return 清理的记录数
     */
    public int cleanExpiredLogs(int days) {
        LocalDateTime expireTime = LocalDateTime.now().minusDays(days);
        LambdaQueryWrapper<SecurityAuditLog> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.lt(SecurityAuditLog::getCreatedAt, expireTime);
        
        int count = Math.toIntExact(count(queryWrapper));
        remove(queryWrapper);
        
        log.info("清理过期审计日志: {} 条记录", count);
        return count;
    }
}