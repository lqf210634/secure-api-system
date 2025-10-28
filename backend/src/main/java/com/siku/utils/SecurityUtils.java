package com.siku.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.regex.Pattern;

/**
 * 安全工具类
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
public class SecurityUtils {

    private static final String TOKEN_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    
    // IP地址正则表达式
    private static final Pattern IP_PATTERN = Pattern.compile(
        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    );
    
    // XSS攻击检测正则表达式
    private static final Pattern[] XSS_PATTERNS = {
        Pattern.compile("<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onload", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onerror", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onclick", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onmouseover", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<iframe[^>]*>.*?</iframe>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<object[^>]*>.*?</object>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<embed[^>]*>.*?</embed>", Pattern.CASE_INSENSITIVE)
    };
    
    // SQL注入检测正则表达式
    private static final Pattern[] SQL_INJECTION_PATTERNS = {
        Pattern.compile("('|(\\-\\-)|(;)|(\\|)|(\\*)|(%))", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(union|select|insert|delete|update|drop|create|alter|exec|execute)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(script|javascript|vbscript|onload|onerror|onclick)", Pattern.CASE_INSENSITIVE)
    };

    /**
     * 获取当前认证用户
     * 
     * @return 当前用户认证信息
     */
    public static Authentication getCurrentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /**
     * 获取当前用户ID
     * 
     * @return 当前用户ID
     */
    public static Long getCurrentUserId() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails) {
                // 假设UserDetails实现类中有getId方法
                try {
                    return (Long) principal.getClass().getMethod("getId").invoke(principal);
                } catch (Exception e) {
                    log.warn("无法获取用户ID: {}", e.getMessage());
                }
            } else if (principal instanceof String) {
                try {
                    return Long.parseLong((String) principal);
                } catch (NumberFormatException e) {
                    log.warn("用户ID格式错误: {}", principal);
                }
            }
        }
        return null;
    }

    /**
     * 获取当前用户名
     * 
     * @return 当前用户名
     */
    public static String getCurrentUsername() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return null;
    }

    /**
     * 检查当前用户是否已认证
     * 
     * @return 是否已认证
     */
    public static boolean isAuthenticated() {
        Authentication authentication = getCurrentAuthentication();
        return authentication != null && authentication.isAuthenticated() 
               && !"anonymousUser".equals(authentication.getPrincipal());
    }

    /**
     * 检查当前用户是否具有指定角色
     * 
     * @param role 角色名称
     * @return 是否具有该角色
     */
    public static boolean hasRole(String role) {
        Authentication authentication = getCurrentAuthentication();
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
        }
        return false;
    }

    /**
     * 检查当前用户是否具有指定权限
     * 
     * @param permission 权限名称
     * @return 是否具有该权限
     */
    public static boolean hasPermission(String permission) {
        Authentication authentication = getCurrentAuthentication();
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals(permission));
        }
        return false;
    }

    /**
     * 从请求中获取JWT令牌
     * 
     * @param request HTTP请求
     * @return JWT令牌
     */
    public static String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
            return bearerToken.substring(TOKEN_PREFIX.length());
        }
        return null;
    }

    /**
     * 获取客户端IP地址
     * 
     * @param request HTTP请求
     * @return 客户端IP地址
     */
    public static String getClientIp(HttpServletRequest request) {
        String[] headers = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
        };
        
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (isValidIp(ip)) {
                // 如果有多个IP，取第一个
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                if (isValidIp(ip)) {
                    return ip;
                }
            }
        }
        
        String remoteAddr = request.getRemoteAddr();
        return isValidIp(remoteAddr) ? remoteAddr : "unknown";
    }

    /**
     * 验证IP地址是否有效
     * 
     * @param ip IP地址
     * @return 是否有效
     */
    public static boolean isValidIp(String ip) {
        return StringUtils.hasText(ip) 
               && !"unknown".equalsIgnoreCase(ip) 
               && !"0:0:0:0:0:0:0:1".equals(ip)
               && (IP_PATTERN.matcher(ip).matches() || "127.0.0.1".equals(ip));
    }

    /**
     * 检测XSS攻击
     * 
     * @param input 输入字符串
     * @return 是否包含XSS攻击代码
     */
    public static boolean containsXSS(String input) {
        if (!StringUtils.hasText(input)) {
            return false;
        }
        
        for (Pattern pattern : XSS_PATTERNS) {
            if (pattern.matcher(input).find()) {
                return true;
            }
        }
        return false;
    }

    /**
     * 清理XSS攻击代码
     * 
     * @param input 输入字符串
     * @return 清理后的字符串
     */
    public static String cleanXSS(String input) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        
        String cleaned = input;
        
        // 移除脚本标签
        cleaned = cleaned.replaceAll("(?i)<script[^>]*>.*?</script>", "");
        cleaned = cleaned.replaceAll("(?i)<iframe[^>]*>.*?</iframe>", "");
        cleaned = cleaned.replaceAll("(?i)<object[^>]*>.*?</object>", "");
        cleaned = cleaned.replaceAll("(?i)<embed[^>]*>.*?</embed>", "");
        
        // 移除事件处理器
        cleaned = cleaned.replaceAll("(?i)on\\w+\\s*=", "");
        
        // 移除javascript和vbscript协议
        cleaned = cleaned.replaceAll("(?i)javascript:", "");
        cleaned = cleaned.replaceAll("(?i)vbscript:", "");
        
        // HTML实体编码
        cleaned = cleaned.replace("<", "&lt;");
        cleaned = cleaned.replace(">", "&gt;");
        cleaned = cleaned.replace("\"", "&quot;");
        cleaned = cleaned.replace("'", "&#x27;");
        cleaned = cleaned.replace("/", "&#x2F;");
        
        return cleaned;
    }

    /**
     * 检测SQL注入攻击
     * 
     * @param input 输入字符串
     * @return 是否包含SQL注入攻击代码
     */
    public static boolean containsSQLInjection(String input) {
        if (!StringUtils.hasText(input)) {
            return false;
        }
        
        for (Pattern pattern : SQL_INJECTION_PATTERNS) {
            if (pattern.matcher(input).find()) {
                return true;
            }
        }
        return false;
    }

    /**
     * 生成安全的随机字符串
     * 
     * @param length 字符串长度
     * @return 随机字符串
     */
    public static String generateSecureRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return sb.toString();
    }

    /**
     * 生成安全的数字验证码
     * 
     * @param length 验证码长度
     * @return 数字验证码
     */
    public static String generateSecureNumericCode(int length) {
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        
        return sb.toString();
    }

    /**
     * 掩码敏感信息（邮箱）
     * 
     * @param email 邮箱地址
     * @return 掩码后的邮箱
     */
    public static String maskEmail(String email) {
        if (!StringUtils.hasText(email) || !email.contains("@")) {
            return email;
        }
        
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        if (username.length() <= 2) {
            return email;
        }
        
        String maskedUsername = username.charAt(0) + 
                               "*".repeat(username.length() - 2) + 
                               username.charAt(username.length() - 1);
        
        return maskedUsername + "@" + domain;
    }

    /**
     * 掩码敏感信息（手机号）
     * 
     * @param phone 手机号
     * @return 掩码后的手机号
     */
    public static String maskPhone(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() < 7) {
            return phone;
        }
        
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    /**
     * 验证密码强度
     * 
     * @param password 密码
     * @return 密码强度等级 (0-4)
     */
    public static int getPasswordStrength(String password) {
        if (!StringUtils.hasText(password)) {
            return 0;
        }
        
        int score = 0;
        
        // 长度检查
        if (password.length() >= 8) score++;
        if (password.length() >= 12) score++;
        
        // 字符类型检查
        if (password.matches(".*[a-z].*")) score++; // 小写字母
        if (password.matches(".*[A-Z].*")) score++; // 大写字母
        if (password.matches(".*[0-9].*")) score++; // 数字
        if (password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) score++; // 特殊字符
        
        return Math.min(score, 4);
    }
}