-- 安全API系统数据库表结构
-- 数据库版本: MySQL 8.0+
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci

-- 创建数据库
CREATE DATABASE IF NOT EXISTS secure_api_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE secure_api_system;

-- 用户表
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码（加密）',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `nickname` varchar(100) DEFAULT NULL COMMENT '昵称',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `status` enum('ACTIVE','INACTIVE','LOCKED','PENDING') NOT NULL DEFAULT 'ACTIVE' COMMENT '用户状态',
  `roles` json DEFAULT NULL COMMENT '用户角色（JSON数组）',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
  `login_fail_count` int NOT NULL DEFAULT '0' COMMENT '登录失败次数',
  `locked_until` datetime DEFAULT NULL COMMENT '锁定到期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标志',
  `version` int NOT NULL DEFAULT '0' COMMENT '乐观锁版本号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_last_login_time` (`last_login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 安全审计日志表
CREATE TABLE `security_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `event_type` varchar(50) NOT NULL COMMENT '事件类型',
  `event_level` enum('INFO','WARN','ERROR','CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT '事件级别',
  `description` text NOT NULL COMMENT '事件描述',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `client_ip` varchar(45) DEFAULT NULL COMMENT '客户端IP',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `request_uri` varchar(500) DEFAULT NULL COMMENT '请求URI',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `request_params` json DEFAULT NULL COMMENT '请求参数（JSON）',
  `response_status` int DEFAULT NULL COMMENT '响应状态码',
  `response_data` json DEFAULT NULL COMMENT '响应数据（JSON）',
  `operation_result` enum('SUCCESS','FAILURE','PARTIAL') NOT NULL DEFAULT 'SUCCESS' COMMENT '操作结果',
  `risk_level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT '风险级别',
  `location` varchar(200) DEFAULT NULL COMMENT '地理位置',
  `device_info` varchar(500) DEFAULT NULL COMMENT '设备信息',
  `session_id` varchar(100) DEFAULT NULL COMMENT '会话ID',
  `trace_id` varchar(100) DEFAULT NULL COMMENT '追踪ID',
  `processing_time` bigint DEFAULT NULL COMMENT '处理时间（毫秒）',
  `extra_data` json DEFAULT NULL COMMENT '额外数据（JSON）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_event_level` (`event_level`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_client_ip` (`client_ip`),
  KEY `idx_operation_result` (`operation_result`),
  KEY `idx_risk_level` (`risk_level`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_trace_id` (`trace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='安全审计日志表';

-- 系统配置表
CREATE TABLE `system_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text NOT NULL COMMENT '配置值',
  `config_type` enum('STRING','NUMBER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING' COMMENT '配置类型',
  `description` varchar(500) DEFAULT NULL COMMENT '配置描述',
  `is_encrypted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否加密存储',
  `is_public` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否公开（前端可访问）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 会话管理表
CREATE TABLE `user_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `session_id` varchar(100) NOT NULL COMMENT '会话标识',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `client_ip` varchar(45) NOT NULL COMMENT '客户端IP',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `device_info` varchar(500) DEFAULT NULL COMMENT '设备信息',
  `location` varchar(200) DEFAULT NULL COMMENT '地理位置',
  `login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `last_activity_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
  `expires_at` datetime NOT NULL COMMENT '过期时间',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否活跃',
  `logout_time` datetime DEFAULT NULL COMMENT '登出时间',
  `logout_reason` varchar(100) DEFAULT NULL COMMENT '登出原因',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_id` (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_client_ip` (`client_ip`),
  KEY `idx_login_time` (`login_time`),
  KEY `idx_last_activity_time` (`last_activity_time`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- 操作日志表
CREATE TABLE `operation_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `operation` varchar(100) NOT NULL COMMENT '操作名称',
  `module` varchar(50) NOT NULL COMMENT '模块名称',
  `description` text DEFAULT NULL COMMENT '操作描述',
  `request_uri` varchar(500) DEFAULT NULL COMMENT '请求URI',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `request_params` json DEFAULT NULL COMMENT '请求参数',
  `response_data` json DEFAULT NULL COMMENT '响应数据',
  `client_ip` varchar(45) DEFAULT NULL COMMENT '客户端IP',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `status` enum('SUCCESS','FAILURE') NOT NULL DEFAULT 'SUCCESS' COMMENT '操作状态',
  `error_message` text DEFAULT NULL COMMENT '错误信息',
  `processing_time` bigint DEFAULT NULL COMMENT '处理时间（毫秒）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_operation` (`operation`),
  KEY `idx_module` (`module`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_client_ip` (`client_ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 文件上传记录表
CREATE TABLE `file_uploads` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `stored_name` varchar(255) NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_size` bigint NOT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(100) NOT NULL COMMENT '文件类型',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIME类型',
  `md5_hash` varchar(32) NOT NULL COMMENT 'MD5哈希值',
  `sha256_hash` varchar(64) DEFAULT NULL COMMENT 'SHA256哈希值',
  `upload_user_id` bigint DEFAULT NULL COMMENT '上传用户ID',
  `upload_username` varchar(50) DEFAULT NULL COMMENT '上传用户名',
  `upload_ip` varchar(45) DEFAULT NULL COMMENT '上传IP',
  `business_type` varchar(50) DEFAULT NULL COMMENT '业务类型',
  `business_id` varchar(100) DEFAULT NULL COMMENT '业务ID',
  `is_public` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否公开访问',
  `download_count` int NOT NULL DEFAULT '0' COMMENT '下载次数',
  `status` enum('UPLOADING','COMPLETED','FAILED','DELETED') NOT NULL DEFAULT 'UPLOADING' COMMENT '文件状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stored_name` (`stored_name`),
  KEY `idx_original_name` (`original_name`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_md5_hash` (`md5_hash`),
  KEY `idx_upload_user_id` (`upload_user_id`),
  KEY `idx_business_type` (`business_type`),
  KEY `idx_business_id` (`business_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件上传记录表';

-- 初始化管理员用户
INSERT INTO `users` (
  `username`, 
  `password`, 
  `email`, 
  `phone`, 
  `nickname`, 
  `status`, 
  `roles`
) VALUES (
  'admin', 
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKVjzieMwkOBSaEwHOcwRGHjSR2e', -- 密码: admin123
  'admin@siku.com', 
  '13800138000', 
  '系统管理员', 
  'ACTIVE', 
  JSON_ARRAY('ADMIN', 'USER')
);

-- 初始化系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_public`) VALUES
('system.name', '安全API系统', 'STRING', '系统名称', 1),
('system.version', '1.0.0', 'STRING', '系统版本', 1),
('system.description', '基于Spring Boot和React的安全API管理系统', 'STRING', '系统描述', 1),
('security.password.min_length', '8', 'NUMBER', '密码最小长度', 0),
('security.password.require_special_char', 'true', 'BOOLEAN', '密码是否需要特殊字符', 0),
('security.login.max_fail_count', '5', 'NUMBER', '最大登录失败次数', 0),
('security.login.lock_duration', '30', 'NUMBER', '账户锁定时长（分钟）', 0),
('security.jwt.expiration', '86400', 'NUMBER', 'JWT过期时间（秒）', 0),
('security.session.timeout', '1800', 'NUMBER', '会话超时时间（秒）', 0),
('audit.log.retention_days', '90', 'NUMBER', '审计日志保留天数', 0),
('file.upload.max_size', '10485760', 'NUMBER', '文件上传最大大小（字节）', 0),
('file.upload.allowed_types', 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx', 'STRING', '允许上传的文件类型', 0);

-- 创建索引优化查询性能
-- 用户表复合索引
CREATE INDEX `idx_users_status_created` ON `users` (`status`, `created_at`);
CREATE INDEX `idx_users_roles` ON `users` ((CAST(`roles` AS CHAR(255) ARRAY)));

-- 审计日志表复合索引
CREATE INDEX `idx_audit_logs_user_time` ON `security_audit_logs` (`user_id`, `created_at`);
CREATE INDEX `idx_audit_logs_ip_time` ON `security_audit_logs` (`client_ip`, `created_at`);
CREATE INDEX `idx_audit_logs_type_level` ON `security_audit_logs` (`event_type`, `event_level`);

-- 会话表复合索引
CREATE INDEX `idx_sessions_user_active` ON `user_sessions` (`user_id`, `is_active`);
CREATE INDEX `idx_sessions_expires_active` ON `user_sessions` (`expires_at`, `is_active`);

-- 操作日志表复合索引
CREATE INDEX `idx_operation_logs_user_time` ON `operation_logs` (`user_id`, `created_at`);
CREATE INDEX `idx_operation_logs_module_time` ON `operation_logs` (`module`, `created_at`);

-- 文件上传表复合索引
CREATE INDEX `idx_file_uploads_user_time` ON `file_uploads` (`upload_user_id`, `created_at`);
CREATE INDEX `idx_file_uploads_business` ON `file_uploads` (`business_type`, `business_id`);

-- 创建视图简化查询
-- 用户统计视图
CREATE VIEW `v_user_stats` AS
SELECT 
  COUNT(*) AS total_users,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_users,
  COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) AS inactive_users,
  COUNT(CASE WHEN status = 'LOCKED' THEN 1 END) AS locked_users,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_users,
  COUNT(CASE WHEN last_login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS active_last_30_days
FROM users 
WHERE deleted = 0;

-- 安全事件统计视图
CREATE VIEW `v_security_stats` AS
SELECT 
  COUNT(*) AS total_events,
  COUNT(CASE WHEN event_level = 'CRITICAL' THEN 1 END) AS critical_events,
  COUNT(CASE WHEN event_level = 'ERROR' THEN 1 END) AS error_events,
  COUNT(CASE WHEN event_level = 'WARN' THEN 1 END) AS warn_events,
  COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) AS high_risk_events,
  COUNT(CASE WHEN risk_level = 'CRITICAL' THEN 1 END) AS critical_risk_events,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) AS events_last_24h
FROM security_audit_logs;

-- 创建存储过程用于数据清理
DELIMITER //

-- 清理过期审计日志
CREATE PROCEDURE `sp_cleanup_audit_logs`(IN retention_days INT)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE batch_size INT DEFAULT 1000;
  DECLARE deleted_count INT DEFAULT 0;
  DECLARE total_deleted INT DEFAULT 0;
  
  -- 删除过期日志
  REPEAT
    DELETE FROM security_audit_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL retention_days DAY)
    LIMIT batch_size;
    
    SET deleted_count = ROW_COUNT();
    SET total_deleted = total_deleted + deleted_count;
    
    -- 避免长时间锁表
    SELECT SLEEP(0.1);
    
  UNTIL deleted_count = 0 END REPEAT;
  
  SELECT CONCAT('清理完成，共删除 ', total_deleted, ' 条过期审计日志') AS result;
END //

-- 清理过期会话
CREATE PROCEDURE `sp_cleanup_expired_sessions`()
BEGIN
  UPDATE user_sessions 
  SET is_active = 0, logout_time = NOW(), logout_reason = 'EXPIRED'
  WHERE expires_at < NOW() AND is_active = 1;
  
  SELECT CONCAT('清理完成，共清理 ', ROW_COUNT(), ' 个过期会话') AS result;
END //

DELIMITER ;

-- 创建定时任务（需要开启事件调度器）
-- SET GLOBAL event_scheduler = ON;

-- 每天凌晨2点清理过期审计日志（保留90天）
CREATE EVENT IF NOT EXISTS `evt_cleanup_audit_logs`
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 02:00:00'
DO
  CALL sp_cleanup_audit_logs(90);

-- 每小时清理过期会话
CREATE EVENT IF NOT EXISTS `evt_cleanup_expired_sessions`
ON SCHEDULE EVERY 1 HOUR
DO
  CALL sp_cleanup_expired_sessions();

-- 添加表注释和字段注释的完整性检查
-- 这些注释有助于数据库文档生成和维护

-- 数据库初始化完成提示
SELECT 'Database schema created successfully!' AS status;