package com.siku;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 安全API系统主启动类
 * 
 * @author SiKu Team
 * @version 1.0
 * @since 2024-01-01
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableTransactionManagement
@MapperScan("com.siku.mapper")
public class SecureApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureApiApplication.class, args);
        System.out.println("""
            
            ========================================
            🚀 安全API系统启动成功！
            ========================================
            📖 API文档: http://localhost:8080/api/swagger-ui.html
            🔍 健康检查: http://localhost:8080/api/actuator/health
            📊 监控指标: http://localhost:8080/api/actuator/metrics
            ========================================
            
            """);
    }
}