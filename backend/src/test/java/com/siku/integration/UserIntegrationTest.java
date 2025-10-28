package com.siku.integration;

import com.siku.BaseIntegrationTest;
import com.siku.dto.ChangePasswordRequest;
import com.siku.dto.UpdateProfileRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 用户管理API集成测试
 */
@DisplayName("用户管理API集成测试")
public class UserIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("获取用户资料 - 成功")
    public void testGetProfileSuccess() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/profile")
                        .header("Authorization", getUserAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.phone").value("13800138000"));
    }

    @Test
    @DisplayName("获取用户资料 - 未授权")
    public void testGetProfileUnauthorized() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("更新用户资料 - 成功")
    public void testUpdateProfileSuccess() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("newemail@example.com");
        request.setPhone("13900139999");
        request.setNickname("新昵称");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/user/profile")
                        .header("Authorization", getUserAuthHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("资料更新成功"));

        // 验证更新后的数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/profile")
                        .header("Authorization", getUserAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("newemail@example.com"))
                .andExpect(jsonPath("$.data.phone").value("13900139999"));
    }

    @Test
    @DisplayName("更新用户资料 - 邮箱格式错误")
    public void testUpdateProfileWithInvalidEmail() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("invalid-email"); // 无效邮箱格式
        request.setPhone("13900139999");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/user/profile")
                        .header("Authorization", getUserAuthHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("修改密码 - 成功")
    public void testChangePasswordSuccess() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("password123");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("newpassword123");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/change-password")
                        .header("Authorization", getUserAuthHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("密码修改成功"));
    }

    @Test
    @DisplayName("修改密码 - 原密码错误")
    public void testChangePasswordWithWrongOldPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("wrongpassword");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("newpassword123");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/change-password")
                        .header("Authorization", getUserAuthHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("原密码错误"));
    }

    @Test
    @DisplayName("修改密码 - 确认密码不匹配")
    public void testChangePasswordWithMismatchedConfirmation() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("password123");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("differentpassword");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/change-password")
                        .header("Authorization", getUserAuthHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("确认密码不匹配"));
    }

    @Test
    @DisplayName("获取用户列表 - 管理员权限")
    public void testGetUserListAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/list")
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
    @DisplayName("获取用户列表 - 普通用户无权限")
    public void testGetUserListAsUser() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/list")
                        .header("Authorization", getUserAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("搜索用户 - 管理员权限")
    public void testSearchUsersAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/search")
                        .header("Authorization", getAdminAuthHeader())
                        .param("keyword", "test")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("禁用用户 - 管理员权限")
    public void testDisableUserAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/" + testUser.getId() + "/disable")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("用户已禁用"));
    }

    @Test
    @DisplayName("启用用户 - 管理员权限")
    public void testEnableUserAsAdmin() throws Exception {
        // 先禁用用户
        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/" + testUser.getId() + "/disable")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk());

        // 再启用用户
        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/" + testUser.getId() + "/enable")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("用户已启用"));
    }

    @Test
    @DisplayName("删除用户 - 管理员权限")
    public void testDeleteUserAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/user/" + testUser.getId())
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("用户删除成功"));
    }

    @Test
    @DisplayName("重置用户密码 - 管理员权限")
    public void testResetUserPasswordAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/" + testUser.getId() + "/reset-password")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("密码重置成功"))
                .andExpect(jsonPath("$.data.newPassword").exists());
    }

    @Test
    @DisplayName("获取用户操作日志")
    public void testGetUserOperationLogs() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/operation-logs")
                        .header("Authorization", getUserAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("获取用户登录历史")
    public void testGetUserLoginHistory() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/login-history")
                        .header("Authorization", getUserAuthHeader())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("上传头像")
    public void testUploadAvatar() throws Exception {
        // 模拟文件上传
        byte[] fileContent = "fake image content".getBytes();
        
        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/user/avatar")
                        .file("file", fileContent)
                        .header("Authorization", getUserAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").exists());
    }

    @Test
    @DisplayName("批量操作用户 - 管理员权限")
    public void testBatchOperationAsAdmin() throws Exception {
        String requestBody = """
                {
                    "userIds": [%d],
                    "operation": "disable"
                }
                """.formatted(testUser.getId());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/user/batch")
                        .header("Authorization", getAdminAuthHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("批量操作完成"));
    }

    @Test
    @DisplayName("导出用户数据 - 管理员权限")
    public void testExportUsersAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/export")
                        .header("Authorization", getAdminAuthHeader())
                        .param("format", "excel"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    @DisplayName("用户统计信息 - 管理员权限")
    public void testGetUserStatisticsAsAdmin() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/user/statistics")
                        .header("Authorization", getAdminAuthHeader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").exists())
                .andExpect(jsonPath("$.data.activeUsers").exists())
                .andExpect(jsonPath("$.data.newUsersToday").exists());
    }
}