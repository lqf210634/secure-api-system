package com.siku.integration;

import com.siku.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 安全审计API集成测试
 */
@DisplayName("安全审计API集成测试")
public class SecurityAuditIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取审计日志列表 - 管理员权限")
    public void testGetAuditLogsAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs")
                        .header("Authorization", getAdminAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray())
                .andExpect(jsonPath("$.data.total").exists())
                .andExpect(jsonPath("$.data.current").value(1))
                .andExpect(jsonPath("$.data.size").value(10));
    }

    @Test
    @DisplayName("获取审计日志列表 - 普通用户无权限")
    public void testGetAuditLogsAsUser() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs")
                        .header("Authorization", getUserAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("按用户筛选审计日志")
    public void testGetAuditLogsByUser() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs")
                        .header("Authorization", getAdminAuthHeader())
                        .param("userId", testUser.getId().toString())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("按事件类型筛选审计日志")
    public void testGetAuditLogsByEventType() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs")
                        .header("Authorization", getAdminAuthHeader())
                        .param("eventType", "LOGIN")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("按时间范围筛选审计日志")
    public void testGetAuditLogsByDateRange() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs")
                        .header("Authorization", getAdminAuthHeader())
                        .param("startDate", "2024-01-01")
                        .param("endDate", "2024-12-31")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("按IP地址筛选审计日志")
    public void testGetAuditLogsByIpAddress() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs")
                        .header("Authorization", getAdminAuthHeader())
                        .param("ipAddress", "127.0.0.1")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("获取安全统计信息")
    public void testGetSecurityStatistics() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/statistics")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalEvents").exists())
                .andExpect(jsonPath("$.data.loginAttempts").exists())
                .andExpect(jsonPath("$.data.failedLogins").exists())
                .andExpect(jsonPath("$.data.securityViolations").exists());
    }

    @Test
    @DisplayName("获取今日安全事件统计")
    public void testGetTodaySecurityStatistics() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/statistics/today")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.date").exists())
                .andExpect(jsonPath("$.data.events").exists());
    }

    @Test
    @DisplayName("获取安全事件趋势")
    public void testGetSecurityTrends() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/trends")
                        .header("Authorization", getAdminAuthHeader())
                        .param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("获取高风险事件")
    public void testGetHighRiskEvents() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/high-risk")
                        .header("Authorization", getAdminAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("获取用户行为分析")
    public void testGetUserBehaviorAnalysis() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/user-behavior")
                        .header("Authorization", getAdminAuthHeader())
                        .param("userId", testUser.getId().toString())
                        .param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loginPattern").exists())
                .andExpect(jsonPath("$.data.activitySummary").exists());
    }

    @Test
    @DisplayName("获取IP地址分析")
    public void testGetIpAddressAnalysis() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/ip-analysis")
                        .header("Authorization", getAdminAuthHeader())
                        .param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("导出审计日志")
    public void testExportAuditLogs() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/export")
                        .header("Authorization", getAdminAuthHeader())
                        .param("format", "excel")
                        .param("startDate", "2024-01-01")
                        .param("endDate", "2024-12-31"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    @DisplayName("清理过期审计日志")
    public void testCleanupExpiredLogs() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/audit/cleanup")
                        .header("Authorization", getAdminAuthHeader())
                        .param("days", "90"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deletedCount").exists());
    }

    @Test
    @DisplayName("获取审计日志详情")
    public void testGetAuditLogDetail() throws Exception {
        // 首先创建一个审计日志记录
        // 这里假设有一个审计日志ID为1
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/logs/1")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.eventType").exists())
                .andExpect(jsonPath("$.data.createTime").exists());
    }

    @Test
    @DisplayName("搜索审计日志")
    public void testSearchAuditLogs() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/search")
                        .header("Authorization", getAdminAuthHeader())
                        .param("keyword", "login")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("获取安全警报")
    public void testGetSecurityAlerts() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/alerts")
                        .header("Authorization", getAdminAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("标记警报为已处理")
    public void testMarkAlertAsHandled() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/audit/alerts/1/handle")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("警报已标记为已处理"));
    }

    @Test
    @DisplayName("获取系统安全配置")
    public void testGetSecurityConfig() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/audit/config")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.auditEnabled").exists())
                .andExpect(jsonPath("$.data.retentionDays").exists());
    }

    @Test
    @DisplayName("更新系统安全配置")
    public void testUpdateSecurityConfig() throws Exception {
        String configJson = """
                {
                    "auditEnabled": true,
                    "retentionDays": 90,
                    "alertThreshold": 10
                }
                """;

        mockMvc.perform(MockMvcRequestBuilders.put("/api/audit/config")
                        .header("Authorization", getAdminAuthHeader())
                        .contentType("application/json")
                        .content(configJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("安全配置更新成功"));
    }

    @Test
    @DisplayName("生成安全报告")
    public void testGenerateSecurityReport() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/audit/report")
                        .header("Authorization", getAdminAuthHeader())
                        .param("startDate", "2024-01-01")
                        .param("endDate", "2024-12-31")
                        .param("format", "pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reportUrl").exists());
    }
}