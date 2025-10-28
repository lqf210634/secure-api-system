package com.siku.controller;

import com.siku.common.ApiResponse;
import com.siku.dto.request.LoginRequest;
import com.siku.dto.request.RegisterRequest;
import com.siku.dto.response.LoginResponse;
import com.siku.dto.response.UserInfoResponse;
import com.siku.service.AuthService;
import com.siku.service.CaptchaService;
import com.siku.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.Map;

/**
 * 认证控制器
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@Tag(name = "用户认证", description = "用户登录、注册、登出等认证相关API")
public class AuthController {

    private final AuthService authService;
    private final CaptchaService captchaService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    @Operation(summary = "用户登录", description = "用户使用用户名/邮箱/手机号和密码登录系统")
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = SecurityUtils.getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        LoginResponse response = authService.login(request, clientIp, userAgent);
        
        log.info("用户登录成功: username={}, ip={}", request.getUsername(), clientIp);
        return ApiResponse.success(response);
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    @Operation(summary = "用户注册", description = "新用户注册账户")
    public ApiResponse<UserInfoResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = SecurityUtils.getClientIp(httpRequest);
        UserInfoResponse response = authService.register(request, clientIp);
        
        log.info("用户注册成功: username={}, email={}, ip={}", 
                request.getUsername(), request.getEmail(), clientIp);
        return ApiResponse.success(response);
    }

    /**
     * 用户登出
     */
    @PostMapping("/logout")
    @Operation(summary = "用户登出", description = "用户登出系统，清除认证信息")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        String token = SecurityUtils.getTokenFromRequest(request);
        if (token != null) {
            authService.logout(token);
            log.info("用户登出成功: userId={}", SecurityUtils.getCurrentUserId());
        }
        return ApiResponse.success();
    }

    /**
     * 刷新访问令牌
     */
    @PostMapping("/refresh")
    @Operation(summary = "刷新令牌", description = "使用刷新令牌获取新的访问令牌")
    public ApiResponse<LoginResponse> refreshToken(
            @Parameter(description = "刷新令牌") @RequestParam @NotBlank String refreshToken,
            HttpServletRequest httpRequest) {
        
        String clientIp = SecurityUtils.getClientIp(httpRequest);
        LoginResponse response = authService.refreshToken(refreshToken, clientIp);
        
        return ApiResponse.success(response);
    }

    /**
     * 获取验证码
     */
    @GetMapping("/captcha")
    @Operation(summary = "获取验证码", description = "获取图形验证码")
    public ApiResponse<Map<String, Object>> getCaptcha() {
        Map<String, Object> captcha = captchaService.generateCaptcha();
        return ApiResponse.success(captcha);
    }

    /**
     * 验证验证码
     */
    @PostMapping("/captcha/verify")
    @Operation(summary = "验证验证码", description = "验证用户输入的验证码是否正确")
    public ApiResponse<Boolean> verifyCaptcha(
            @Parameter(description = "验证码ID") @RequestParam @NotBlank String captchaId,
            @Parameter(description = "验证码值") @RequestParam @NotBlank String captchaCode) {
        
        boolean valid = captchaService.verifyCaptcha(captchaId, captchaCode);
        return ApiResponse.success(valid);
    }

    /**
     * 发送邮箱验证码
     */
    @PostMapping("/email/send-code")
    @Operation(summary = "发送邮箱验证码", description = "向指定邮箱发送验证码")
    public ApiResponse<Void> sendEmailCode(
            @Parameter(description = "邮箱地址") @RequestParam @NotBlank String email,
            @Parameter(description = "验证码类型：register, reset_password, change_email") 
            @RequestParam @NotBlank String type) {
        
        authService.sendEmailVerificationCode(email, type);
        return ApiResponse.success();
    }

    /**
     * 发送短信验证码
     */
    @PostMapping("/sms/send-code")
    @Operation(summary = "发送短信验证码", description = "向指定手机号发送验证码")
    public ApiResponse<Void> sendSmsCode(
            @Parameter(description = "手机号") @RequestParam @NotBlank String phone,
            @Parameter(description = "验证码类型：register, reset_password, change_phone") 
            @RequestParam @NotBlank String type) {
        
        authService.sendSmsVerificationCode(phone, type);
        return ApiResponse.success();
    }

    /**
     * 验证邮箱验证码
     */
    @PostMapping("/email/verify-code")
    @Operation(summary = "验证邮箱验证码", description = "验证邮箱验证码是否正确")
    public ApiResponse<Boolean> verifyEmailCode(
            @Parameter(description = "邮箱地址") @RequestParam @NotBlank String email,
            @Parameter(description = "验证码") @RequestParam @NotBlank String code,
            @Parameter(description = "验证码类型") @RequestParam @NotBlank String type) {
        
        boolean valid = authService.verifyEmailCode(email, code, type);
        return ApiResponse.success(valid);
    }

    /**
     * 验证短信验证码
     */
    @PostMapping("/sms/verify-code")
    @Operation(summary = "验证短信验证码", description = "验证短信验证码是否正确")
    public ApiResponse<Boolean> verifySmsCode(
            @Parameter(description = "手机号") @RequestParam @NotBlank String phone,
            @Parameter(description = "验证码") @RequestParam @NotBlank String code,
            @Parameter(description = "验证码类型") @RequestParam @NotBlank String type) {
        
        boolean valid = authService.verifySmsCode(phone, code, type);
        return ApiResponse.success(valid);
    }

    /**
     * 忘记密码 - 发送重置链接
     */
    @PostMapping("/password/forgot")
    @Operation(summary = "忘记密码", description = "发送密码重置链接到用户邮箱")
    public ApiResponse<Void> forgotPassword(
            @Parameter(description = "邮箱地址") @RequestParam @NotBlank String email) {
        
        authService.sendPasswordResetLink(email);
        return ApiResponse.success();
    }

    /**
     * 重置密码
     */
    @PostMapping("/password/reset")
    @Operation(summary = "重置密码", description = "使用重置令牌重置用户密码")
    public ApiResponse<Void> resetPassword(
            @Parameter(description = "重置令牌") @RequestParam @NotBlank String token,
            @Parameter(description = "新密码") @RequestParam @NotBlank String newPassword) {
        
        authService.resetPassword(token, newPassword);
        return ApiResponse.success();
    }

    /**
     * 验证重置令牌
     */
    @GetMapping("/password/verify-reset-token")
    @Operation(summary = "验证重置令牌", description = "验证密码重置令牌是否有效")
    public ApiResponse<Boolean> verifyResetToken(
            @Parameter(description = "重置令牌") @RequestParam @NotBlank String token) {
        
        boolean valid = authService.verifyResetToken(token);
        return ApiResponse.success(valid);
    }

    /**
     * 检查认证状态
     */
    @GetMapping("/status")
    @Operation(summary = "检查认证状态", description = "检查当前用户的认证状态")
    public ApiResponse<Map<String, Object>> getAuthStatus(HttpServletRequest request) {
        String token = SecurityUtils.getTokenFromRequest(request);
        Map<String, Object> status = authService.getAuthStatus(token);
        return ApiResponse.success(status);
    }

    /**
     * 获取当前会话信息
     */
    @GetMapping("/session")
    @Operation(summary = "获取会话信息", description = "获取当前用户的会话详细信息")
    public ApiResponse<Map<String, Object>> getSessionInfo(HttpServletRequest request) {
        String token = SecurityUtils.getTokenFromRequest(request);
        String clientIp = SecurityUtils.getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        
        Map<String, Object> sessionInfo = authService.getSessionInfo(token, clientIp, userAgent);
        return ApiResponse.success(sessionInfo);
    }
}