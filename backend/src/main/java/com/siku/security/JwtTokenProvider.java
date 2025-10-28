package com.siku.security;

import com.siku.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * JWT Token 提供者
 * 负责JWT Token的生成、验证和解析
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.access-token-expiration:86400}")
    private int accessTokenExpiration; // 24小时
    
    @Value("${jwt.refresh-token-expiration:604800}")
    private int refreshTokenExpiration; // 7天
    
    @Value("${jwt.issuer:SiKu-Backend}")
    private String issuer;
    
    @Value("${jwt.audience:SiKu-Mobile}")
    private String audience;
    
    private SecretKey secretKey;
    
    @PostConstruct
    public void init() {
        // 确保密钥长度足够
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters long");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JWT Token Provider initialized with issuer: {}, audience: {}", issuer, audience);
    }
    
    /**
     * 生成访问Token
     * 
     * @param user 用户信息
     * @return JWT访问Token
     */
    public String generateAccessToken(User user) {
        return generateAccessToken(user, null);
    }
    
    /**
     * 生成访问Token（带会话ID）
     * 
     * @param user 用户信息
     * @param sessionId 会话ID
     * @return JWT访问Token
     */
    public String generateAccessToken(User user, String sessionId) {
        Instant now = Instant.now();
        Instant expiration = now.plus(accessTokenExpiration, ChronoUnit.SECONDS);
        
        String sid = sessionId != null ? sessionId : UUID.randomUUID().toString();
        
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("sid", sid)
                .claim("username", user.getUsername())
                .claim("roles", user.getRoles())
                .claim("type", "access")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(issuer)
                .setAudience(audience)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * 生成刷新Token
     * 
     * @param user 用户信息
     * @param sessionId 会话ID
     * @return JWT刷新Token
     */
    public String generateRefreshToken(User user, String sessionId) {
        Instant now = Instant.now();
        Instant expiration = now.plus(refreshTokenExpiration, ChronoUnit.SECONDS);
        
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("sid", sessionId)
                .claim("type", "refresh")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(issuer)
                .setAudience(audience)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * 验证Token有效性
     * 
     * @param token JWT Token
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        try {
            Jws<Claims> claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .requireIssuer(issuer)
                    .requireAudience(audience)
                    .build()
                    .parseClaimsJws(token);
            
            // 检查Token是否过期
            Date expiration = claims.getBody().getExpiration();
            if (expiration.before(new Date())) {
                log.warn("Token已过期: {}", expiration);
                return false;
            }
            
            log.debug("Token验证成功");
            return true;
            
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Token验证失败: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 从Token中获取用户ID
     * 
     * @param token JWT Token
     * @return 用户ID
     */
    public Long getUserIdFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return Long.valueOf(claims.getSubject());
        } catch (Exception e) {
            log.error("从Token获取用户ID失败", e);
            return null;
        }
    }
    
    /**
     * 从Token中获取用户名
     * 
     * @param token JWT Token
     * @return 用户名
     */
    public String getUsernameFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("username", String.class);
        } catch (Exception e) {
            log.error("从Token获取用户名失败", e);
            return null;
        }
    }
    
    /**
     * 从Token中获取会话ID
     * 
     * @param token JWT Token
     * @return 会话ID
     */
    public String getSessionIdFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("sid", String.class);
        } catch (Exception e) {
            log.error("从Token获取会话ID失败", e);
            return null;
        }
    }
    
    /**
     * 从Token中获取用户角色
     * 
     * @param token JWT Token
     * @return 用户角色列表
     */
    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("roles", List.class);
        } catch (Exception e) {
            log.error("从Token获取用户角色失败", e);
            return null;
        }
    }
    
    /**
     * 从Token中获取Token类型
     * 
     * @param token JWT Token
     * @return Token类型（access/refresh）
     */
    public String getTokenTypeFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("type", String.class);
        } catch (Exception e) {
            log.error("从Token获取Token类型失败", e);
            return null;
        }
    }
    
    /**
     * 获取Token过期时间
     * 
     * @param token JWT Token
     * @return 过期时间
     */
    public Date getExpirationFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.getExpiration();
        } catch (Exception e) {
            log.error("从Token获取过期时间失败", e);
            return null;
        }
    }
    
    /**
     * 检查Token是否即将过期（30分钟内）
     * 
     * @param token JWT Token
     * @return 是否即将过期
     */
    public boolean isTokenExpiringSoon(String token) {
        try {
            Date expiration = getExpirationFromToken(token);
            if (expiration == null) {
                return true;
            }
            
            long timeUntilExpiration = expiration.getTime() - System.currentTimeMillis();
            return timeUntilExpiration < 30 * 60 * 1000; // 30分钟
            
        } catch (Exception e) {
            log.error("检查Token过期时间失败", e);
            return true;
        }
    }
    
    /**
     * 从Token中解析Claims
     * 
     * @param token JWT Token
     * @return Claims对象
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    /**
     * 获取访问Token过期时间（秒）
     * 
     * @return 过期时间
     */
    public int getAccessTokenExpiration() {
        return accessTokenExpiration;
    }
    
    /**
     * 获取刷新Token过期时间（秒）
     * 
     * @return 过期时间
     */
    public int getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }
    
    /**
     * 创建用户会话信息
     * 
     * @param token JWT Token
     * @return 用户会话信息
     */
    public UserSession createUserSession(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            
            return UserSession.builder()
                    .userId(Long.valueOf(claims.getSubject()))
                    .sessionId(claims.get("sid", String.class))
                    .username(claims.get("username", String.class))
                    .roles(claims.get("roles", List.class))
                    .issuedAt(claims.getIssuedAt().toInstant())
                    .expiresAt(claims.getExpiration().toInstant())
                    .build();
                    
        } catch (Exception e) {
            log.error("创建用户会话信息失败", e);
            return null;
        }
    }
}