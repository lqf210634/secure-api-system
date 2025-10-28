package com.siku.controller;

import com.siku.common.ApiResponse;
import com.siku.dto.request.RegisterRequest;
import com.siku.dto.request.UpdatePasswordRequest;
import com.siku.dto.request.UpdateUserRequest;
import com.siku.dto.response.UserInfoResponse;
import com.siku.entity.User;
import com.siku.service.UserService;
import com.siku.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 用户管理控制器
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
@Tag(name = "用户管理", description = "用户相关的API接口")
public class UserController {

    private final UserService userService;

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    public ApiResponse<UserInfoResponse> getCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        UserInfoResponse userInfo = userService.getUserInfo(currentUserId);
        return ApiResponse.success(userInfo);
    }

    /**
     * 更新当前用户信息
     */
    @PutMapping("/me")
    @Operation(summary = "更新当前用户信息", description = "更新当前登录用户的基本信息")
    public ApiResponse<UserInfoResponse> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        UserInfoResponse userInfo = userService.updateUser(currentUserId, request);
        return ApiResponse.success(userInfo);
    }

    /**
     * 修改当前用户密码
     */
    @PutMapping("/me/password")
    @Operation(summary = "修改密码", description = "修改当前用户的登录密码")
    public ApiResponse<Void> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        userService.updatePassword(currentUserId, request);
        return ApiResponse.success();
    }

    /**
     * 获取用户列表（管理员权限）
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取用户列表", description = "分页获取用户列表（需要管理员权限）")
    public ApiResponse<Page<UserInfoResponse>> getUsers(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") @Min(1) int size,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortDir,
            @Parameter(description = "搜索关键词") @RequestParam(required = false) String keyword,
            @Parameter(description = "用户状态") @RequestParam(required = false) Integer status) {
        
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<UserInfoResponse> users = userService.getUsers(pageable, keyword, status);
        return ApiResponse.success(users);
    }

    /**
     * 根据ID获取用户信息（管理员权限）
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取用户详情", description = "根据用户ID获取用户详细信息（需要管理员权限）")
    public ApiResponse<UserInfoResponse> getUserById(
            @Parameter(description = "用户ID") @PathVariable @NotNull Long id) {
        UserInfoResponse userInfo = userService.getUserInfo(id);
        return ApiResponse.success(userInfo);
    }

    /**
     * 创建用户（管理员权限）
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "创建用户", description = "创建新用户（需要管理员权限）")
    public ApiResponse<UserInfoResponse> createUser(
            @Valid @RequestBody RegisterRequest request) {
        UserInfoResponse userInfo = userService.createUser(request);
        return ApiResponse.success(userInfo);
    }

    /**
     * 更新用户信息（管理员权限）
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "更新用户信息", description = "更新指定用户的信息（需要管理员权限）")
    public ApiResponse<UserInfoResponse> updateUser(
            @Parameter(description = "用户ID") @PathVariable @NotNull Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserInfoResponse userInfo = userService.updateUser(id, request);
        return ApiResponse.success(userInfo);
    }

    /**
     * 启用/禁用用户（管理员权限）
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "更新用户状态", description = "启用或禁用指定用户（需要管理员权限）")
    public ApiResponse<Void> updateUserStatus(
            @Parameter(description = "用户ID") @PathVariable @NotNull Long id,
            @Parameter(description = "用户状态：0-禁用，1-启用") @RequestParam @NotNull Integer status) {
        userService.updateUserStatus(id, status);
        return ApiResponse.success();
    }

    /**
     * 重置用户密码（管理员权限）
     */
    @PutMapping("/{id}/password/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "重置用户密码", description = "重置指定用户的密码（需要管理员权限）")
    public ApiResponse<String> resetUserPassword(
            @Parameter(description = "用户ID") @PathVariable @NotNull Long id) {
        String newPassword = userService.resetPassword(id);
        return ApiResponse.success(newPassword);
    }

    /**
     * 解锁用户账户（管理员权限）
     */
    @PutMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "解锁用户账户", description = "解锁被锁定的用户账户（需要管理员权限）")
    public ApiResponse<Void> unlockUser(
            @Parameter(description = "用户ID") @PathVariable @NotNull Long id) {
        userService.unlockUser(id);
        return ApiResponse.success();
    }

    /**
     * 删除用户（管理员权限）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "删除用户", description = "软删除指定用户（需要管理员权限）")
    public ApiResponse<Void> deleteUser(
            @Parameter(description = "用户ID") @PathVariable @NotNull Long id) {
        userService.deleteUser(id);
        return ApiResponse.success();
    }

    /**
     * 批量删除用户（管理员权限）
     */
    @DeleteMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "批量删除用户", description = "批量软删除用户（需要管理员权限）")
    public ApiResponse<Void> deleteUsers(
            @Parameter(description = "用户ID列表") @RequestBody @NotNull List<Long> ids) {
        userService.deleteUsers(ids);
        return ApiResponse.success();
    }

    /**
     * 检查用户名是否可用
     */
    @GetMapping("/check/username")
    @Operation(summary = "检查用户名可用性", description = "检查指定用户名是否已被使用")
    public ApiResponse<Boolean> checkUsernameAvailable(
            @Parameter(description = "用户名") @RequestParam @NotNull String username) {
        boolean available = userService.isUsernameAvailable(username);
        return ApiResponse.success(available);
    }

    /**
     * 检查邮箱是否可用
     */
    @GetMapping("/check/email")
    @Operation(summary = "检查邮箱可用性", description = "检查指定邮箱是否已被使用")
    public ApiResponse<Boolean> checkEmailAvailable(
            @Parameter(description = "邮箱地址") @RequestParam @NotNull String email) {
        boolean available = userService.isEmailAvailable(email);
        return ApiResponse.success(available);
    }

    /**
     * 检查手机号是否可用
     */
    @GetMapping("/check/phone")
    @Operation(summary = "检查手机号可用性", description = "检查指定手机号是否已被使用")
    public ApiResponse<Boolean> checkPhoneAvailable(
            @Parameter(description = "手机号") @RequestParam @NotNull String phone) {
        boolean available = userService.isPhoneAvailable(phone);
        return ApiResponse.success(available);
    }
}