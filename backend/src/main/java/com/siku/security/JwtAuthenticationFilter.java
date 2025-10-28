package com.siku.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siku.common.ApiResponse;
import com.siku.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT认证过滤器
 * 负责从HTTP请求中提取JWT Token，验证并设置安全上下文
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;
    
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        try {
            // 提取JWT Token
            String token = extractTokenFromRequest(request);
            
            if (token != null) {
                // 验证Token
                if (jwtTokenProvider.validateToken(token)) {
                    // 创建用户会话信息
                    UserSession userSession = jwtTokenProvider.createUserSession(token);
                    
                    if (userSession != null && userSession.isValid()) {
                        // 设置安全上下文
                        setSecurityContext(userSession, request);
                        
                        // 将用户会话信息添加到请求属性中，供后续使用
                        request.setAttribute("userSession", userSession);
                        
                        log.debug("用户认证成功: userId={}, username={}, sessionId={}", 
                                userSession.getUserId(), userSession.getUsername(), userSession.getSessionId());
                    } else {
                        log.warn("用户会话无效或已过期");
                        handleAuthenticationError(response, ErrorCode.TOKEN_EXPIRED, "Token已过期");
                        return;
                    }
                } else {
                    log.warn("Token验证失败: {}", token.substring(0, Math.min(20, token.length())) + "...");
                    handleAuthenticationError(response, ErrorCode.TOKEN_INVALID, "Token无效");
                    return;
                }
            }
            
            // 继续过滤链
            filterChain.doFilter(request, response);
            
        } catch (Exception e) {
            log.error("JWT认证过滤器处理异常", e);
            handleAuthenticationError(response, ErrorCode.AUTHENTICATION_FAILED, "认证失败");
        }
    }
    
    /**
     * 从HTTP请求中提取JWT Token
     * 
     * @param request HTTP请求
     * @return JWT Token，如果不存在返回null
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        // 1. 从Authorization头中提取
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        
        // 2. 从请求参数中提取（用于某些特殊场景，如WebSocket连接）
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }
        
        return null;
    }
    
    /**
     * 设置Spring Security上下文
     * 
     * @param userSession 用户会话信息
     * @param request HTTP请求
     */
    private void setSecurityContext(UserSession userSession, HttpServletRequest request) {
        // 创建权限列表
        List<SimpleGrantedAuthority> authorities = userSession.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toList());
        
        // 创建认证对象
        UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                        userSession.getUsername(),
                        null,
                        authorities
                );
        
        // 设置认证详情
        authentication.setDetails(userSession);
        
        // 设置安全上下文
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        log.debug("安全上下文已设置: username={}, authorities={}", 
                userSession.getUsername(), authorities);
    }
    
    /**
     * 处理认证错误
     * 
     * @param response HTTP响应
     * @param errorCode 错误代码
     * @param message 错误消息
     * @throws IOException IO异常
     */
    private void handleAuthenticationError(HttpServletResponse response, 
                                         ErrorCode errorCode, 
                                         String message) throws IOException {
        
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        ApiResponse<Object> apiResponse = ApiResponse.error(errorCode, message);
        
        String jsonResponse = objectMapper.writeValueAsString(apiResponse);
        response.getWriter().write(jsonResponse);
        
        log.warn("认证失败响应: {}", message);
    }
    
    /**
     * 判断是否应该跳过过滤器处理
     * 对于某些公开接口，不需要进行JWT认证
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // 跳过公开接口
        return path.startsWith("/api/public/") ||
               path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/register") ||
               path.startsWith("/swagger-ui/") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/actuator/health") ||
               path.equals("/favicon.ico");
    }
    
    /**
     * 从安全上下文中获取当前用户会话
     * 
     * @return 用户会话信息，如果未认证返回null
     */
    public static UserSession getCurrentUserSession() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getDetails() instanceof UserSession) {
                return (UserSession) authentication.getDetails();
            }
        } catch (Exception e) {
            log.warn("获取当前用户会话失败", e);
        }
        return null;
    }
    
    /**
     * 从安全上下文中获取当前用户ID
     * 
     * @return 用户ID，如果未认证返回null
     */
    public static Long getCurrentUserId() {
        UserSession session = getCurrentUserSession();
        return session != null ? session.getUserId() : null;
    }
    
    /**
     * 从安全上下文中获取当前用户名
     * 
     * @return 用户名，如果未认证返回null
     */
    public static String getCurrentUsername() {
        UserSession session = getCurrentUserSession();
        return session != null ? session.getUsername() : null;
    }
}