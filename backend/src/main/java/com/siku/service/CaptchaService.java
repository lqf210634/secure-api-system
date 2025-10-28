package com.siku.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 验证码服务
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private final StringRedisTemplate redisTemplate;
    
    private static final String CAPTCHA_KEY_PREFIX = "captcha:";
    private static final int CAPTCHA_WIDTH = 120;
    private static final int CAPTCHA_HEIGHT = 40;
    private static final int CAPTCHA_LENGTH = 4;
    private static final int CAPTCHA_EXPIRE_MINUTES = 5;
    
    private static final String CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * 生成图形验证码
     * 
     * @return 验证码信息（包含ID和Base64图片）
     */
    public Map<String, Object> generateCaptcha() {
        String captchaId = UUID.randomUUID().toString();
        String captchaCode = generateRandomCode();
        
        try {
            // 生成验证码图片
            BufferedImage image = createCaptchaImage(captchaCode);
            String base64Image = imageToBase64(image);
            
            // 存储到Redis
            String redisKey = CAPTCHA_KEY_PREFIX + captchaId;
            redisTemplate.opsForValue().set(redisKey, captchaCode.toLowerCase(), 
                                          CAPTCHA_EXPIRE_MINUTES, TimeUnit.MINUTES);
            
            Map<String, Object> result = new HashMap<>();
            result.put("captchaId", captchaId);
            result.put("captchaImage", "data:image/png;base64," + base64Image);
            result.put("expireTime", CAPTCHA_EXPIRE_MINUTES * 60); // 秒
            
            log.debug("生成验证码: id={}, code={}", captchaId, captchaCode);
            return result;
            
        } catch (Exception e) {
            log.error("生成验证码失败", e);
            throw new RuntimeException("生成验证码失败");
        }
    }

    /**
     * 验证验证码
     * 
     * @param captchaId 验证码ID
     * @param captchaCode 用户输入的验证码
     * @return 是否验证成功
     */
    public boolean verifyCaptcha(String captchaId, String captchaCode) {
        if (captchaId == null || captchaCode == null) {
            return false;
        }
        
        String redisKey = CAPTCHA_KEY_PREFIX + captchaId;
        String storedCode = redisTemplate.opsForValue().get(redisKey);
        
        if (storedCode == null) {
            log.debug("验证码已过期或不存在: id={}", captchaId);
            return false;
        }
        
        // 验证后删除验证码（一次性使用）
        redisTemplate.delete(redisKey);
        
        boolean isValid = storedCode.equalsIgnoreCase(captchaCode.trim());
        log.debug("验证码验证结果: id={}, input={}, stored={}, valid={}", 
                 captchaId, captchaCode, storedCode, isValid);
        
        return isValid;
    }

    /**
     * 生成随机验证码字符串
     * 
     * @return 验证码字符串
     */
    private String generateRandomCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CAPTCHA_LENGTH; i++) {
            code.append(CAPTCHA_CHARS.charAt(RANDOM.nextInt(CAPTCHA_CHARS.length())));
        }
        return code.toString();
    }

    /**
     * 创建验证码图片
     * 
     * @param code 验证码字符串
     * @return 验证码图片
     */
    private BufferedImage createCaptchaImage(String code) {
        BufferedImage image = new BufferedImage(CAPTCHA_WIDTH, CAPTCHA_HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        
        // 设置抗锯齿
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        // 填充背景
        g2d.setColor(getRandomColor(200, 250));
        g2d.fillRect(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
        
        // 绘制干扰线
        drawInterferenceLines(g2d);
        
        // 绘制验证码字符
        drawCaptchaText(g2d, code);
        
        // 添加噪点
        drawNoise(g2d);
        
        g2d.dispose();
        return image;
    }

    /**
     * 绘制干扰线
     * 
     * @param g2d 图形上下文
     */
    private void drawInterferenceLines(Graphics2D g2d) {
        for (int i = 0; i < 5; i++) {
            g2d.setColor(getRandomColor(100, 160));
            g2d.setStroke(new BasicStroke(RANDOM.nextFloat() * 2 + 1));
            
            int x1 = RANDOM.nextInt(CAPTCHA_WIDTH);
            int y1 = RANDOM.nextInt(CAPTCHA_HEIGHT);
            int x2 = RANDOM.nextInt(CAPTCHA_WIDTH);
            int y2 = RANDOM.nextInt(CAPTCHA_HEIGHT);
            
            g2d.drawLine(x1, y1, x2, y2);
        }
    }

    /**
     * 绘制验证码文字
     * 
     * @param g2d 图形上下文
     * @param code 验证码字符串
     */
    private void drawCaptchaText(Graphics2D g2d, String code) {
        String[] fontNames = {"Arial", "Times New Roman", "Courier New"};
        
        for (int i = 0; i < code.length(); i++) {
            // 随机字体
            String fontName = fontNames[RANDOM.nextInt(fontNames.length)];
            int fontSize = 20 + RANDOM.nextInt(8);
            int fontStyle = RANDOM.nextBoolean() ? Font.BOLD : Font.PLAIN;
            Font font = new Font(fontName, fontStyle, fontSize);
            g2d.setFont(font);
            
            // 随机颜色
            g2d.setColor(getRandomColor(20, 130));
            
            // 随机位置和角度
            int x = 15 + i * 25 + RANDOM.nextInt(10);
            int y = 25 + RANDOM.nextInt(10);
            
            // 随机旋转
            double angle = (RANDOM.nextDouble() - 0.5) * 0.4;
            g2d.rotate(angle, x, y);
            
            g2d.drawString(String.valueOf(code.charAt(i)), x, y);
            
            // 恢复旋转
            g2d.rotate(-angle, x, y);
        }
    }

    /**
     * 绘制噪点
     * 
     * @param g2d 图形上下文
     */
    private void drawNoise(Graphics2D g2d) {
        for (int i = 0; i < 50; i++) {
            g2d.setColor(getRandomColor(50, 200));
            int x = RANDOM.nextInt(CAPTCHA_WIDTH);
            int y = RANDOM.nextInt(CAPTCHA_HEIGHT);
            g2d.fillOval(x, y, 1, 1);
        }
    }

    /**
     * 获取随机颜色
     * 
     * @param min 最小值
     * @param max 最大值
     * @return 随机颜色
     */
    private Color getRandomColor(int min, int max) {
        int range = max - min;
        int r = min + RANDOM.nextInt(range);
        int g = min + RANDOM.nextInt(range);
        int b = min + RANDOM.nextInt(range);
        return new Color(r, g, b);
    }

    /**
     * 将图片转换为Base64字符串
     * 
     * @param image 图片
     * @return Base64字符串
     * @throws IOException IO异常
     */
    private String imageToBase64(BufferedImage image) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] imageBytes = baos.toByteArray();
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * 清理过期的验证码
     */
    public void cleanExpiredCaptcha() {
        // Redis的TTL会自动清理过期的key，这里可以添加额外的清理逻辑
        log.debug("清理过期验证码任务执行");
    }
}