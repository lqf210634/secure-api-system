# 部署指南

本文档详细介绍了安全API系统的部署方法，包括开发环境、测试环境和生产环境的部署配置。

## 目录
- [环境要求](#环境要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [Kubernetes部署](#kubernetes部署)
- [监控和日志](#监控和日志)
- [备份和恢复](#备份和恢复)
- [故障排除](#故障排除)

## 环境要求

### 基础环境
- **操作系统**: Linux (推荐 Ubuntu 20.04+ 或 CentOS 8+)
- **Java**: OpenJDK 11 或 Oracle JDK 11+
- **Node.js**: 16.0+ (推荐 18.x LTS)
- **数据库**: MySQL 8.0+ 或 MariaDB 10.6+
- **缓存**: Redis 6.0+
- **Web服务器**: Nginx 1.18+ (生产环境)

### 硬件要求

#### 开发环境
- **CPU**: 2核心
- **内存**: 4GB
- **存储**: 20GB

#### 生产环境（单机）
- **CPU**: 4核心
- **内存**: 8GB
- **存储**: 100GB SSD

#### 生产环境（集群）
- **应用服务器**: 2台 4核8GB
- **数据库服务器**: 1台 8核16GB
- **Redis服务器**: 1台 2核4GB
- **负载均衡器**: 1台 2核4GB

## 开发环境部署

### 1. 环境准备

#### 安装Java
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# CentOS/RHEL
sudo yum install java-11-openjdk-devel

# 验证安装
java -version
javac -version
```

#### 安装Node.js
```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 验证安装
node --version
npm --version
```

#### 安装MySQL
```bash
# Ubuntu/Debian
sudo apt install mysql-server mysql-client

# CentOS/RHEL
sudo yum install mysql-server mysql

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### 安装Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis

# 验证安装
redis-cli ping
```

### 2. 数据库配置

#### 创建数据库和用户
```sql
-- 连接MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE secure_api_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON secure_api_system.* TO 'api_user'@'localhost';
FLUSH PRIVILEGES;

-- 导入表结构
USE secure_api_system;
SOURCE /path/to/docs/database/schema.sql;
```

#### Redis配置
```bash
# 编辑Redis配置
sudo vim /etc/redis/redis.conf

# 修改以下配置
bind 127.0.0.1
port 6379
requirepass your_redis_password
maxmemory 256mb
maxmemory-policy allkeys-lru

# 重启Redis
sudo systemctl restart redis
```

### 3. 后端部署

#### 配置文件
```bash
cd backend/src/main/resources
cp application-example.yml application-dev.yml
```

编辑 `application-dev.yml`:
```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  profiles:
    active: dev
  
  datasource:
    url: jdbc:mysql://localhost:3306/secure_api_system?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: api_user
    password: your_secure_password
    driver-class-name: com.mysql.cj.jdbc.Driver
    
  redis:
    host: localhost
    port: 6379
    password: your_redis_password
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-wait: -1ms
        max-idle: 8
        min-idle: 0

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    
logging:
  level:
    com.siku: DEBUG
    org.springframework.security: DEBUG
  file:
    name: logs/secure-api.log
    
jwt:
  secret: your-jwt-secret-key-at-least-256-bits-long
  expiration: 86400
  
app:
  security:
    password:
      min-length: 8
      require-special-char: true
    login:
      max-fail-count: 5
      lock-duration: 30
```

#### 构建和启动
```bash
cd backend

# 构建项目
mvn clean package -DskipTests

# 启动应用
java -jar target/secure-api-system-1.0.0.jar --spring.profiles.active=dev

# 或使用Maven插件
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 4. 前端部署

#### 安装依赖
```bash
cd frontend
npm install
```

#### 配置文件
编辑 `.env.development`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=安全API系统
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK=false
```

#### 启动开发服务器
```bash
npm run dev
```

## 生产环境部署

### 1. 服务器准备

#### 系统优化
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget vim git htop

# 配置防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3306  # MySQL (仅内网)
sudo ufw allow 6379  # Redis (仅内网)
```

#### 创建应用用户
```bash
# 创建应用用户
sudo useradd -m -s /bin/bash apiuser
sudo usermod -aG sudo apiuser

# 切换到应用用户
sudo su - apiuser
```

### 2. 数据库部署

#### MySQL生产配置
```bash
# 编辑MySQL配置
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# 基础配置
bind-address = 0.0.0.0
port = 3306
max_connections = 200
max_connect_errors = 10

# 字符集配置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# InnoDB配置
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1

# 日志配置
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# 安全配置
local_infile = 0
skip_show_database
```

#### 数据库安全配置
```sql
-- 创建生产用户
CREATE USER 'api_prod'@'%' IDENTIFIED BY 'very_secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON secure_api_system.* TO 'api_prod'@'%';

-- 删除默认用户
DROP USER IF EXISTS ''@'localhost';
DROP USER IF EXISTS ''@'%';
DROP USER IF EXISTS 'root'@'%';

-- 删除测试数据库
DROP DATABASE IF EXISTS test;
```

### 3. Redis生产配置

```bash
# 编辑Redis配置
sudo vim /etc/redis/redis.conf
```

```conf
# 网络配置
bind 127.0.0.1 10.0.0.100  # 内网IP
port 6379
protected-mode yes

# 安全配置
requirepass very_secure_redis_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# 内存配置
maxmemory 1gb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes

# 日志配置
loglevel notice
logfile /var/log/redis/redis-server.log
```

### 4. 后端生产部署

#### 创建生产配置
```yaml
# application-prod.yml
server:
  port: 8080
  
spring:
  profiles:
    active: prod
    
  datasource:
    url: jdbc:mysql://db-server:3306/secure_api_system?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=Asia/Shanghai
    username: api_prod
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      
  redis:
    host: redis-server
    port: 6379
    password: ${REDIS_PASSWORD}
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 20
        max-wait: -1ms
        max-idle: 8
        min-idle: 2

logging:
  level:
    root: INFO
    com.siku: INFO
  file:
    name: /var/log/secure-api/application.log
    max-size: 100MB
    max-history: 30
    
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
      
jwt:
  secret: ${JWT_SECRET}
  expiration: 86400
```

#### 创建systemd服务
```bash
# 创建服务文件
sudo vim /etc/systemd/system/secure-api.service
```

```ini
[Unit]
Description=Secure API System
After=network.target mysql.service redis.service

[Service]
Type=simple
User=apiuser
Group=apiuser
WorkingDirectory=/opt/secure-api
ExecStart=/usr/bin/java -jar -Xms2g -Xmx4g -Dspring.profiles.active=prod /opt/secure-api/secure-api-system.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=secure-api

# 环境变量
Environment=DB_PASSWORD=very_secure_password_here
Environment=REDIS_PASSWORD=very_secure_redis_password
Environment=JWT_SECRET=your-very-long-jwt-secret-key-here

[Install]
WantedBy=multi-user.target
```

#### 部署应用
```bash
# 创建应用目录
sudo mkdir -p /opt/secure-api
sudo chown apiuser:apiuser /opt/secure-api

# 复制应用文件
sudo cp target/secure-api-system-1.0.0.jar /opt/secure-api/secure-api-system.jar
sudo chown apiuser:apiuser /opt/secure-api/secure-api-system.jar

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable secure-api
sudo systemctl start secure-api

# 检查状态
sudo systemctl status secure-api
```

### 5. 前端生产部署

#### 构建前端应用
```bash
cd frontend

# 安装依赖
npm ci --production

# 构建生产版本
npm run build
```

#### Nginx配置
```bash
# 安装Nginx
sudo apt install nginx

# 创建配置文件
sudo vim /etc/nginx/sites-available/secure-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL配置
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 前端静态文件
    location / {
        root /var/www/secure-api;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:8080/actuator/health;
        access_log off;
    }
}
```

#### 部署前端文件
```bash
# 创建Web目录
sudo mkdir -p /var/www/secure-api
sudo chown www-data:www-data /var/www/secure-api

# 复制构建文件
sudo cp -r frontend/dist/* /var/www/secure-api/
sudo chown -R www-data:www-data /var/www/secure-api

# 启用站点
sudo ln -s /etc/nginx/sites-available/secure-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker部署

### 1. 创建Dockerfile

#### 后端Dockerfile
```dockerfile
# backend/Dockerfile
FROM openjdk:11-jre-slim

LABEL maintainer="SiKu Team <support@siku.com>"

# 创建应用目录
WORKDIR /app

# 复制jar文件
COPY target/secure-api-system-*.jar app.jar

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "-Xms1g", "-Xmx2g", "app.jar"]
```

#### 前端Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: secure-api-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: secure_api_system
      MYSQL_USER: api_user
      MYSQL_PASSWORD: api_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docs/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"
    networks:
      - secure-api-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: secure-api-redis
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - secure-api-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: secure-api-backend
    environment:
      SPRING_PROFILES_ACTIVE: docker
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: secure_api_system
      DB_USERNAME: api_user
      DB_PASSWORD: api_password
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: redis_password
      JWT_SECRET: your-jwt-secret-key
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - redis
    networks:
      - secure-api-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: secure-api-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - secure-api-network
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:

networks:
  secure-api-network:
    driver: bridge
```

### 3. 部署命令

```bash
# 构建和启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

## 监控和日志

### 1. 应用监控

#### Prometheus配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'secure-api'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
```

#### Grafana仪表板
导入预配置的仪表板监控以下指标：
- JVM内存使用情况
- HTTP请求统计
- 数据库连接池状态
- Redis连接状态
- 自定义业务指标

### 2. 日志管理

#### ELK Stack配置
```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.17.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## 备份和恢复

### 1. 数据库备份

#### 自动备份脚本
```bash
#!/bin/bash
# backup.sh

# 配置
DB_HOST="localhost"
DB_USER="api_user"
DB_PASS="your_password"
DB_NAME="secure_api_system"
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mysqldump -h$DB_HOST -u$DB_USER -p$DB_PASS \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### 设置定时备份
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh
```

### 2. Redis备份

```bash
#!/bin/bash
# redis-backup.sh

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASS="your_redis_password"
BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 执行BGSAVE
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS BGSAVE

# 等待备份完成
while [ $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS LASTSAVE) -eq $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS LASTSAVE) ]; do
  sleep 1
done

# 复制RDB文件
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb
gzip $BACKUP_DIR/dump_$DATE.rdb

echo "Redis backup completed: dump_$DATE.rdb.gz"
```

## 故障排除

### 1. 常见问题

#### 应用启动失败
```bash
# 检查日志
sudo journalctl -u secure-api -f

# 检查端口占用
sudo netstat -tlnp | grep 8080

# 检查Java进程
ps aux | grep java
```

#### 数据库连接问题
```bash
# 测试数据库连接
mysql -h localhost -u api_user -p secure_api_system

# 检查MySQL状态
sudo systemctl status mysql

# 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log
```

#### Redis连接问题
```bash
# 测试Redis连接
redis-cli -h localhost -p 6379 -a your_password ping

# 检查Redis状态
sudo systemctl status redis

# 查看Redis日志
sudo tail -f /var/log/redis/redis-server.log
```

### 2. 性能优化

#### JVM调优
```bash
# 生产环境JVM参数
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/secure-api/
-Dspring.profiles.active=prod
```

#### 数据库优化
```sql
-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 分析表
ANALYZE TABLE users;
ANALYZE TABLE security_audit_logs;

-- 优化表
OPTIMIZE TABLE users;
```

### 3. 安全检查

#### 定期安全检查清单
- [ ] 更新系统补丁
- [ ] 检查SSL证书有效期
- [ ] 审查用户权限
- [ ] 检查异常登录记录
- [ ] 验证备份完整性
- [ ] 更新密码策略
- [ ] 检查防火墙规则
- [ ] 审查审计日志

## 联系支持

如果在部署过程中遇到问题，请联系：
- 技术支持: support@siku.com
- 文档反馈: docs@siku.com
- 紧急联系: emergency@siku.com