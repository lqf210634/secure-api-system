package com.siku.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.siku.common.ApiResponse;
import com.siku.common.ResponseCode;
import com.siku.entity.SecurityAuditLog;
import com.siku.service.SecurityAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 安全审计日志控制器
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/security/audit")
@RequiredArgsConstructor
@Tag(name = "安全审计", description = "安全审计日志管理")
public class SecurityAuditController {

    private final SecurityAuditService securityAuditService;

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
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_READ')")
    @Operation(summary = "分页查询安全审计日志", description = "根据条件分页查询安全审计日志")
    public ApiResponse<IPage<SecurityAuditLog>> getAuditLogs(
            @Parameter(description = "页码", example = "1")
            @RequestParam(defaultValue = "1") @Min(1) int page,
            
            @Parameter(description = "页大小", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            
            @Parameter(description = "事件类型")
            @RequestParam(required = false) String eventType,
            
            @Parameter(description = "事件级别")
            @RequestParam(required = false) String eventLevel,
            
            @Parameter(description = "用户名")
            @RequestParam(required = false) String username,
            
            @Parameter(description = "开始时间")
            @RequestParam(required = false) 
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            
            @Parameter(description = "结束时间")
            @RequestParam(required = false) 
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        
        try {
            IPage<SecurityAuditLog> result = securityAuditService.getAuditLogs(
                page, size, eventType, eventLevel, username, startTime, endTime);
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("查询安全审计日志失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "查询失败");
        }
    }

    /**
     * 获取安全统计信息
     * 
     * @param days 统计天数
     * @return 统计信息
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_READ')")
    @Operation(summary = "获取安全统计信息", description = "获取指定天数内的安全事件统计信息")
    public ApiResponse<Map<String, Object>> getSecurityStatistics(
            @Parameter(description = "统计天数", example = "7")
            @RequestParam(defaultValue = "7") @Min(1) @Max(365) int days) {
        
        try {
            Map<String, Object> statistics = securityAuditService.getSecurityStatistics(days);
            return ApiResponse.success(statistics);
        } catch (Exception e) {
            log.error("获取安全统计信息失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "获取统计信息失败");
        }
    }

    /**
     * 获取审计日志详情
     * 
     * @param id 日志ID
     * @return 日志详情
     */
    @GetMapping("/logs/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_READ')")
    @Operation(summary = "获取审计日志详情", description = "根据ID获取安全审计日志详情")
    public ApiResponse<SecurityAuditLog> getAuditLogDetail(
            @Parameter(description = "日志ID")
            @PathVariable Long id) {
        
        try {
            SecurityAuditLog auditLog = securityAuditService.getById(id);
            if (auditLog == null) {
                return ApiResponse.error(ResponseCode.NOT_FOUND, "审计日志不存在");
            }
            return ApiResponse.success(auditLog);
        } catch (Exception e) {
            log.error("获取审计日志详情失败: id={}", id, e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "获取详情失败");
        }
    }

    /**
     * 记录安全事件（手动）
     * 
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param description 事件描述
     * @param riskLevel 风险等级
     * @return 操作结果
     */
    @PostMapping("/events")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_WRITE')")
    @Operation(summary = "记录安全事件", description = "手动记录安全事件到审计日志")
    public ApiResponse<Void> logSecurityEvent(
            @Parameter(description = "事件类型", required = true)
            @RequestParam String eventType,
            
            @Parameter(description = "事件级别", required = true)
            @RequestParam String eventLevel,
            
            @Parameter(description = "事件描述", required = true)
            @RequestParam String description,
            
            @Parameter(description = "风险等级")
            @RequestParam(required = false) String riskLevel) {
        
        try {
            securityAuditService.logSecurityEvent(eventType, eventLevel, description, 
                                                 SecurityAuditLog.OperationResult.SUCCESS.name(), 
                                                 riskLevel, null);
            return ApiResponse.success();
        } catch (Exception e) {
            log.error("记录安全事件失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "记录事件失败");
        }
    }

    /**
     * 清理过期的审计日志
     * 
     * @param days 保留天数
     * @return 清理结果
     */
    @DeleteMapping("/logs/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "清理过期审计日志", description = "清理指定天数之前的审计日志")
    public ApiResponse<Map<String, Object>> cleanupExpiredLogs(
            @Parameter(description = "保留天数", example = "90")
            @RequestParam @Min(1) @Max(3650) int days) {
        
        try {
            int cleanedCount = securityAuditService.cleanExpiredLogs(days);
            
            Map<String, Object> result = Map.of(
                "cleanedCount", cleanedCount,
                "retentionDays", days,
                "cleanupTime", LocalDateTime.now()
            );
            
            // 记录清理操作
            securityAuditService.logSecurityEvent(
                "ADMIN_OPERATION", 
                SecurityAuditLog.EventLevel.INFO.name(),
                String.format("清理过期审计日志，保留%d天，清理%d条记录", days, cleanedCount),
                SecurityAuditLog.OperationResult.SUCCESS.name(),
                SecurityAuditLog.RiskLevel.LOW.name(),
                null
            );
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("清理过期审计日志失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "清理失败");
        }
    }

    /**
     * 导出审计日志
     * 
     * @param eventType 事件类型
     * @param eventLevel 事件级别
     * @param username 用户名
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 导出结果
     */
    @GetMapping("/logs/export")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_EXPORT')")
    @Operation(summary = "导出审计日志", description = "根据条件导出安全审计日志")
    public ApiResponse<Map<String, Object>> exportAuditLogs(
            @Parameter(description = "事件类型")
            @RequestParam(required = false) String eventType,
            
            @Parameter(description = "事件级别")
            @RequestParam(required = false) String eventLevel,
            
            @Parameter(description = "用户名")
            @RequestParam(required = false) String username,
            
            @Parameter(description = "开始时间")
            @RequestParam(required = false) 
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            
            @Parameter(description = "结束时间")
            @RequestParam(required = false) 
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        
        try {
            // TODO: 实现审计日志导出功能
            // 这里可以实现CSV、Excel等格式的导出
            
            // 记录导出操作
            securityAuditService.logSecurityEvent(
                SecurityAuditLog.EventType.DATA_EXPORT.name(),
                SecurityAuditLog.EventLevel.INFO.name(),
                "导出安全审计日志",
                SecurityAuditLog.OperationResult.SUCCESS.name(),
                SecurityAuditLog.RiskLevel.MEDIUM.name(),
                Map.of(
                    "exportType", "audit_logs",
                    "eventType", eventType != null ? eventType : "all",
                    "eventLevel", eventLevel != null ? eventLevel : "all",
                    "username", username != null ? username : "all"
                )
            );
            
            Map<String, Object> result = Map.of(
                "message", "导出功能开发中",
                "exportTime", LocalDateTime.now()
            );
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("导出审计日志失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "导出失败");
        }
    }

    /**
     * 获取事件类型列表
     * 
     * @return 事件类型列表
     */
    @GetMapping("/event-types")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_READ')")
    @Operation(summary = "获取事件类型列表", description = "获取所有可用的安全事件类型")
    public ApiResponse<Map<String, String>> getEventTypes() {
        try {
            Map<String, String> eventTypes = Map.of(
                SecurityAuditLog.EventType.LOGIN.name(), SecurityAuditLog.EventType.LOGIN.getDescription(),
                SecurityAuditLog.EventType.LOGOUT.name(), SecurityAuditLog.EventType.LOGOUT.getDescription(),
                SecurityAuditLog.EventType.REGISTER.name(), SecurityAuditLog.EventType.REGISTER.getDescription(),
                SecurityAuditLog.EventType.PASSWORD_CHANGE.name(), SecurityAuditLog.EventType.PASSWORD_CHANGE.getDescription(),
                SecurityAuditLog.EventType.PASSWORD_RESET.name(), SecurityAuditLog.EventType.PASSWORD_RESET.getDescription(),
                SecurityAuditLog.EventType.API_ACCESS.name(), SecurityAuditLog.EventType.API_ACCESS.getDescription(),
                SecurityAuditLog.EventType.SECURITY_VIOLATION.name(), SecurityAuditLog.EventType.SECURITY_VIOLATION.getDescription(),
                SecurityAuditLog.EventType.ADMIN_OPERATION.name(), SecurityAuditLog.EventType.ADMIN_OPERATION.getDescription()
            );
            return ApiResponse.success(eventTypes);
        } catch (Exception e) {
            log.error("获取事件类型列表失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "获取失败");
        }
    }

    /**
     * 获取事件级别列表
     * 
     * @return 事件级别列表
     */
    @GetMapping("/event-levels")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_AUDIT_READ')")
    @Operation(summary = "获取事件级别列表", description = "获取所有可用的事件级别")
    public ApiResponse<Map<String, String>> getEventLevels() {
        try {
            Map<String, String> eventLevels = Map.of(
                SecurityAuditLog.EventLevel.INFO.name(), SecurityAuditLog.EventLevel.INFO.getDescription(),
                SecurityAuditLog.EventLevel.WARN.name(), SecurityAuditLog.EventLevel.WARN.getDescription(),
                SecurityAuditLog.EventLevel.ERROR.name(), SecurityAuditLog.EventLevel.ERROR.getDescription(),
                SecurityAuditLog.EventLevel.CRITICAL.name(), SecurityAuditLog.EventLevel.CRITICAL.getDescription()
            );
            return ApiResponse.success(eventLevels);
        } catch (Exception e) {
            log.error("获取事件级别列表失败", e);
            return ApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR, "获取失败");
        }
    }
}