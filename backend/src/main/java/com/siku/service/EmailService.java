package com.siku.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * 邮件服务
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;
    
    @Value("${spring.mail.username:noreply@example.com}")
    private String fromEmail;
    
    @Value("${app.name:Secure API System}")
    private String appName;
    
    private static final String EMAIL_CODE_KEY_PREFIX = "email_code:";
    private static final String EMAIL_SEND_LIMIT_KEY_PREFIX = "email_limit:";
    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRE_MINUTES = 10;
    private static final int SEND_LIMIT_MINUTES = 1; // 发送间隔限制
    private static final int DAILY_SEND_LIMIT = 10; // 每日发送限制
    
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    /**
     * 发送邮箱验证码
     * 
     * @param email 邮箱地址
     * @param purpose 用途（注册、登录、重置密码等）
     * @return 是否发送成功
     */
    public boolean sendVerificationCode(String email, String purpose) {
        if (!isValidEmail(email)) {
            log.warn("无效的邮箱地址: {}", email);
            return false;
        }
        
        // 检查发送频率限制
        if (!checkSendLimit(email)) {
            log.warn("邮件发送过于频繁: {}", email);
            return false;
        }
        
        // 生成验证码
        String code = generateVerificationCode();
        
        try {
            // 发送邮件
            sendCodeEmail(email, code, purpose);
            
            // 存储验证码到Redis
            String redisKey = EMAIL_CODE_KEY_PREFIX + email + ":" + purpose;
            redisTemplate.opsForValue().set(redisKey, code, CODE_EXPIRE_MINUTES, TimeUnit.MINUTES);
            
            // 记录发送限制
            recordSendLimit(email);
            
            log.info("邮箱验证码发送成功: email={}, purpose={}", email, purpose);
            return true;
            
        } catch (Exception e) {
            log.error("发送邮箱验证码失败: email={}, purpose={}", email, purpose, e);
            return false;
        }
    }

    /**
     * 验证邮箱验证码
     * 
     * @param email 邮箱地址
     * @param code 验证码
     * @param purpose 用途
     * @return 是否验证成功
     */
    public boolean verifyCode(String email, String code, String purpose) {
        if (!StringUtils.hasText(email) || !StringUtils.hasText(code) || !StringUtils.hasText(purpose)) {
            return false;
        }
        
        String redisKey = EMAIL_CODE_KEY_PREFIX + email + ":" + purpose;
        String storedCode = redisTemplate.opsForValue().get(redisKey);
        
        if (storedCode == null) {
            log.debug("邮箱验证码已过期或不存在: email={}, purpose={}", email, purpose);
            return false;
        }
        
        // 验证后删除验证码（一次性使用）
        redisTemplate.delete(redisKey);
        
        boolean isValid = storedCode.equals(code.trim());
        log.debug("邮箱验证码验证结果: email={}, purpose={}, input={}, stored={}, valid={}", 
                 email, purpose, code, storedCode, isValid);
        
        return isValid;
    }

    /**
     * 发送通知邮件
     * 
     * @param email 邮箱地址
     * @param subject 邮件主题
     * @param content 邮件内容
     * @return 是否发送成功
     */
    public boolean sendNotificationEmail(String email, String subject, String content) {
        if (!isValidEmail(email)) {
            log.warn("无效的邮箱地址: {}", email);
            return false;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject(subject);
            message.setText(content);
            
            mailSender.send(message);
            log.info("通知邮件发送成功: email={}, subject={}", email, subject);
            return true;
            
        } catch (Exception e) {
            log.error("发送通知邮件失败: email={}, subject={}", email, subject, e);
            return false;
        }
    }

    /**
     * 发送HTML邮件
     * 
     * @param email 邮箱地址
     * @param subject 邮件主题
     * @param htmlContent HTML内容
     * @return 是否发送成功
     */
    public boolean sendHtmlEmail(String email, String subject, String htmlContent) {
        if (!isValidEmail(email)) {
            log.warn("无效的邮箱地址: {}", email);
            return false;
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("HTML邮件发送成功: email={}, subject={}", email, subject);
            return true;
            
        } catch (MessagingException e) {
            log.error("发送HTML邮件失败: email={}, subject={}", email, subject, e);
            return false;
        }
    }

    /**
     * 发送验证码邮件
     * 
     * @param email 邮箱地址
     * @param code 验证码
     * @param purpose 用途
     */
    private void sendCodeEmail(String email, String code, String purpose) {
        String subject = getEmailSubject(purpose);
        String content = getEmailContent(code, purpose);
        
        // 尝试发送HTML邮件，失败则发送纯文本邮件
        if (!sendHtmlEmail(email, subject, content)) {
            sendNotificationEmail(email, subject, stripHtml(content));
        }
    }

    /**
     * 获取邮件主题
     * 
     * @param purpose 用途
     * @return 邮件主题
     */
    private String getEmailSubject(String purpose) {
        switch (purpose.toLowerCase()) {
            case "register":
                return appName + " - 注册验证码";
            case "login":
                return appName + " - 登录验证码";
            case "reset_password":
                return appName + " - 密码重置验证码";
            case "change_email":
                return appName + " - 邮箱变更验证码";
            case "security":
                return appName + " - 安全验证码";
            default:
                return appName + " - 验证码";
        }
    }

    /**
     * 获取邮件内容
     * 
     * @param code 验证码
     * @param purpose 用途
     * @return 邮件内容
     */
    private String getEmailContent(String code, String purpose) {
        String action = getActionDescription(purpose);
        
        return String.format(
            "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
            "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
            "<h2 style='color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;'>%s</h2>" +
            "<p>您好，</p>" +
            "<p>您正在进行<strong>%s</strong>操作，验证码为：</p>" +
            "<div style='background-color: #f8f9fa; border: 2px solid #3498db; border-radius: 8px; " +
            "padding: 20px; text-align: center; margin: 20px 0;'>" +
            "<span style='font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px;'>%s</span>" +
            "</div>" +
            "<p style='color: #e74c3c;'><strong>注意：</strong></p>" +
            "<ul style='color: #7f8c8d;'>" +
            "<li>验证码有效期为 %d 分钟</li>" +
            "<li>验证码仅可使用一次</li>" +
            "<li>请勿将验证码告知他人</li>" +
            "<li>如非本人操作，请忽略此邮件</li>" +
            "</ul>" +
            "<hr style='border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;'>" +
            "<p style='color: #95a5a6; font-size: 12px; text-align: center;'>" +
            "此邮件由系统自动发送，请勿回复。<br>" +
            "© %s. All rights reserved." +
            "</p>" +
            "</div></body></html>",
            appName, action, code, CODE_EXPIRE_MINUTES, appName
        );
    }

    /**
     * 获取操作描述
     * 
     * @param purpose 用途
     * @return 操作描述
     */
    private String getActionDescription(String purpose) {
        switch (purpose.toLowerCase()) {
            case "register":
                return "账户注册";
            case "login":
                return "账户登录";
            case "reset_password":
                return "密码重置";
            case "change_email":
                return "邮箱变更";
            case "security":
                return "安全验证";
            default:
                return "身份验证";
        }
    }

    /**
     * 移除HTML标签
     * 
     * @param html HTML内容
     * @return 纯文本内容
     */
    private String stripHtml(String html) {
        return html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
    }

    /**
     * 生成验证码
     * 
     * @return 验证码
     */
    private String generateVerificationCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(RANDOM.nextInt(10));
        }
        return code.toString();
    }

    /**
     * 验证邮箱格式
     * 
     * @param email 邮箱地址
     * @return 是否有效
     */
    private boolean isValidEmail(String email) {
        return StringUtils.hasText(email) && EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * 检查发送频率限制
     * 
     * @param email 邮箱地址
     * @return 是否可以发送
     */
    private boolean checkSendLimit(String email) {
        String limitKey = EMAIL_SEND_LIMIT_KEY_PREFIX + email;
        String lastSendTime = redisTemplate.opsForValue().get(limitKey);
        
        if (lastSendTime != null) {
            long lastTime = Long.parseLong(lastSendTime);
            long currentTime = System.currentTimeMillis();
            long timeDiff = currentTime - lastTime;
            
            // 检查是否在限制时间内
            if (timeDiff < SEND_LIMIT_MINUTES * 60 * 1000) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 记录发送限制
     * 
     * @param email 邮箱地址
     */
    private void recordSendLimit(String email) {
        String limitKey = EMAIL_SEND_LIMIT_KEY_PREFIX + email;
        String currentTime = String.valueOf(System.currentTimeMillis());
        redisTemplate.opsForValue().set(limitKey, currentTime, 24, TimeUnit.HOURS);
    }
}