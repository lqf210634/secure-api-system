package com.siku.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * 短信服务
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private final StringRedisTemplate redisTemplate;
    
    @Value("${sms.enabled:false}")
    private boolean smsEnabled;
    
    @Value("${sms.provider:mock}")
    private String smsProvider;
    
    @Value("${sms.access-key:}")
    private String accessKey;
    
    @Value("${sms.secret-key:}")
    private String secretKey;
    
    @Value("${sms.sign-name:Secure API}")
    private String signName;
    
    private static final String SMS_CODE_KEY_PREFIX = "sms_code:";
    private static final String SMS_SEND_LIMIT_KEY_PREFIX = "sms_limit:";
    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRE_MINUTES = 10;
    private static final int SEND_LIMIT_MINUTES = 1; // 发送间隔限制
    private static final int DAILY_SEND_LIMIT = 10; // 每日发送限制
    
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    /**
     * 发送短信验证码
     * 
     * @param phone 手机号
     * @param purpose 用途（注册、登录、重置密码等）
     * @return 是否发送成功
     */
    public boolean sendVerificationCode(String phone, String purpose) {
        if (!isValidPhone(phone)) {
            log.warn("无效的手机号: {}", phone);
            return false;
        }
        
        if (!smsEnabled) {
            log.warn("短信服务未启用");
            return false;
        }
        
        // 检查发送频率限制
        if (!checkSendLimit(phone)) {
            log.warn("短信发送过于频繁: {}", phone);
            return false;
        }
        
        // 生成验证码
        String code = generateVerificationCode();
        
        try {
            // 发送短信
            boolean sent = sendSms(phone, code, purpose);
            
            if (sent) {
                // 存储验证码到Redis
                String redisKey = SMS_CODE_KEY_PREFIX + phone + ":" + purpose;
                redisTemplate.opsForValue().set(redisKey, code, CODE_EXPIRE_MINUTES, TimeUnit.MINUTES);
                
                // 记录发送限制
                recordSendLimit(phone);
                
                log.info("短信验证码发送成功: phone={}, purpose={}", maskPhone(phone), purpose);
                return true;
            } else {
                log.error("短信验证码发送失败: phone={}, purpose={}", maskPhone(phone), purpose);
                return false;
            }
            
        } catch (Exception e) {
            log.error("发送短信验证码异常: phone={}, purpose={}", maskPhone(phone), purpose, e);
            return false;
        }
    }

    /**
     * 验证短信验证码
     * 
     * @param phone 手机号
     * @param code 验证码
     * @param purpose 用途
     * @return 是否验证成功
     */
    public boolean verifyCode(String phone, String code, String purpose) {
        if (!StringUtils.hasText(phone) || !StringUtils.hasText(code) || !StringUtils.hasText(purpose)) {
            return false;
        }
        
        String redisKey = SMS_CODE_KEY_PREFIX + phone + ":" + purpose;
        String storedCode = redisTemplate.opsForValue().get(redisKey);
        
        if (storedCode == null) {
            log.debug("短信验证码已过期或不存在: phone={}, purpose={}", maskPhone(phone), purpose);
            return false;
        }
        
        // 验证后删除验证码（一次性使用）
        redisTemplate.delete(redisKey);
        
        boolean isValid = storedCode.equals(code.trim());
        log.debug("短信验证码验证结果: phone={}, purpose={}, input={}, stored={}, valid={}", 
                 maskPhone(phone), purpose, code, storedCode, isValid);
        
        return isValid;
    }

    /**
     * 发送短信
     * 
     * @param phone 手机号
     * @param code 验证码
     * @param purpose 用途
     * @return 是否发送成功
     */
    private boolean sendSms(String phone, String code, String purpose) {
        String content = getSmsContent(code, purpose);
        
        switch (smsProvider.toLowerCase()) {
            case "aliyun":
                return sendAliyunSms(phone, code, purpose);
            case "tencent":
                return sendTencentSms(phone, code, purpose);
            case "mock":
            default:
                return sendMockSms(phone, content);
        }
    }

    /**
     * 发送阿里云短信
     * 
     * @param phone 手机号
     * @param code 验证码
     * @param purpose 用途
     * @return 是否发送成功
     */
    private boolean sendAliyunSms(String phone, String code, String purpose) {
        // TODO: 集成阿里云短信服务
        log.info("阿里云短信发送: phone={}, code={}, purpose={}", maskPhone(phone), code, purpose);
        
        // 模拟发送成功
        return true;
    }

    /**
     * 发送腾讯云短信
     * 
     * @param phone 手机号
     * @param code 验证码
     * @param purpose 用途
     * @return 是否发送成功
     */
    private boolean sendTencentSms(String phone, String code, String purpose) {
        // TODO: 集成腾讯云短信服务
        log.info("腾讯云短信发送: phone={}, code={}, purpose={}", maskPhone(phone), code, purpose);
        
        // 模拟发送成功
        return true;
    }

    /**
     * 发送模拟短信（用于开发测试）
     * 
     * @param phone 手机号
     * @param content 短信内容
     * @return 是否发送成功
     */
    private boolean sendMockSms(String phone, String content) {
        log.info("模拟短信发送: phone={}, content={}", maskPhone(phone), content);
        
        // 在开发环境下，将验证码输出到日志
        if (content.contains("验证码")) {
            String code = extractCodeFromContent(content);
            log.warn("【开发模式】短信验证码: {}", code);
        }
        
        return true;
    }

    /**
     * 从短信内容中提取验证码
     * 
     * @param content 短信内容
     * @return 验证码
     */
    private String extractCodeFromContent(String content) {
        Pattern pattern = Pattern.compile("\\d{" + CODE_LENGTH + "}");
        java.util.regex.Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group();
        }
        return "";
    }

    /**
     * 获取短信内容
     * 
     * @param code 验证码
     * @param purpose 用途
     * @return 短信内容
     */
    private String getSmsContent(String code, String purpose) {
        String action = getActionDescription(purpose);
        return String.format("【%s】您的%s验证码是：%s，%d分钟内有效，请勿泄露给他人。", 
                           signName, action, code, CODE_EXPIRE_MINUTES);
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
                return "注册";
            case "login":
                return "登录";
            case "reset_password":
                return "密码重置";
            case "change_phone":
                return "手机变更";
            case "security":
                return "安全验证";
            default:
                return "身份验证";
        }
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
     * 验证手机号格式
     * 
     * @param phone 手机号
     * @return 是否有效
     */
    private boolean isValidPhone(String phone) {
        return StringUtils.hasText(phone) && PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * 掩码手机号
     * 
     * @param phone 手机号
     * @return 掩码后的手机号
     */
    private String maskPhone(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    /**
     * 检查发送频率限制
     * 
     * @param phone 手机号
     * @return 是否可以发送
     */
    private boolean checkSendLimit(String phone) {
        String limitKey = SMS_SEND_LIMIT_KEY_PREFIX + phone;
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
     * @param phone 手机号
     */
    private void recordSendLimit(String phone) {
        String limitKey = SMS_SEND_LIMIT_KEY_PREFIX + phone;
        String currentTime = String.valueOf(System.currentTimeMillis());
        redisTemplate.opsForValue().set(limitKey, currentTime, 24, TimeUnit.HOURS);
    }

    /**
     * 获取剩余发送次数
     * 
     * @param phone 手机号
     * @return 剩余次数
     */
    public int getRemainingCount(String phone) {
        // TODO: 实现每日发送次数统计
        return DAILY_SEND_LIMIT;
    }

    /**
     * 获取下次可发送时间
     * 
     * @param phone 手机号
     * @return 下次可发送时间（毫秒）
     */
    public long getNextSendTime(String phone) {
        String limitKey = SMS_SEND_LIMIT_KEY_PREFIX + phone;
        String lastSendTime = redisTemplate.opsForValue().get(limitKey);
        
        if (lastSendTime != null) {
            long lastTime = Long.parseLong(lastSendTime);
            return lastTime + SEND_LIMIT_MINUTES * 60 * 1000;
        }
        
        return 0;
    }
}