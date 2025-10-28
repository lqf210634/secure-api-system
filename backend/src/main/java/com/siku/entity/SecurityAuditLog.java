package com.siku.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 安全审计日志实体
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Accessors(chain = true)
@TableName("security_audit_log")
public class SecurityAuditLog {

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 事件类型
     */
    @TableField("event_type")
    private String eventType;

    /**
     * 事件级别
     */
    @TableField("event_level")
    private String eventLevel;

    /**
     * 事件描述
     */
    @TableField("event_description")
    private String eventDescription;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 用户名
     */
    @TableField("username")
    private String username;

    /**
     * 客户端IP地址
     */
    @TableField("client_ip")
    private String clientIp;

    /**
     * 用户代理
     */
    @TableField("user_agent")
    private String userAgent;

    /**
     * 请求方法
     */
    @TableField("request_method")
    private String requestMethod;

    /**
     * 请求URL
     */
    @TableField("request_url")
    private String requestUrl;

    /**
     * 请求参数
     */
    @TableField("request_params")
    private String requestParams;

    /**
     * 响应状态码
     */
    @TableField("response_status")
    private Integer responseStatus;

    /**
     * 响应消息
     */
    @TableField("response_message")
    private String responseMessage;

    /**
     * 操作结果
     */
    @TableField("operation_result")
    private String operationResult;

    /**
     * 风险等级
     */
    @TableField("risk_level")
    private String riskLevel;

    /**
     * 地理位置
     */
    @TableField("location")
    private String location;

    /**
     * 设备信息
     */
    @TableField("device_info")
    private String deviceInfo;

    /**
     * 会话ID
     */
    @TableField("session_id")
    private String sessionId;

    /**
     * 追踪ID
     */
    @TableField("trace_id")
    private String traceId;

    /**
     * 处理时间（毫秒）
     */
    @TableField("processing_time")
    private Long processingTime;

    /**
     * 额外数据（JSON格式）
     */
    @TableField("extra_data")
    private String extraData;

    /**
     * 创建时间
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 事件类型枚举
     */
    public enum EventType {
        LOGIN("登录"),
        LOGOUT("登出"),
        REGISTER("注册"),
        PASSWORD_CHANGE("密码修改"),
        PASSWORD_RESET("密码重置"),
        PROFILE_UPDATE("资料更新"),
        PERMISSION_CHANGE("权限变更"),
        API_ACCESS("API访问"),
        DATA_EXPORT("数据导出"),
        DATA_IMPORT("数据导入"),
        FILE_UPLOAD("文件上传"),
        FILE_DOWNLOAD("文件下载"),
        SECURITY_VIOLATION("安全违规"),
        SUSPICIOUS_ACTIVITY("可疑活动"),
        SYSTEM_ERROR("系统错误"),
        CONFIGURATION_CHANGE("配置变更"),
        BACKUP_RESTORE("备份恢复"),
        ADMIN_OPERATION("管理员操作");

        private final String description;

        EventType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 事件级别枚举
     */
    public enum EventLevel {
        INFO("信息"),
        WARN("警告"),
        ERROR("错误"),
        CRITICAL("严重");

        private final String description;

        EventLevel(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 操作结果枚举
     */
    public enum OperationResult {
        SUCCESS("成功"),
        FAILURE("失败"),
        BLOCKED("阻止"),
        TIMEOUT("超时");

        private final String description;

        OperationResult(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 风险等级枚举
     */
    public enum RiskLevel {
        LOW("低"),
        MEDIUM("中"),
        HIGH("高"),
        CRITICAL("严重");

        private final String description;

        RiskLevel(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}