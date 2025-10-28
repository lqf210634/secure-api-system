# 部署指南

## 概述

本文档提供了 Secure API System 的完整部署指南，包括本地开发环境、测试环境和生产环境的部署方法。

## 系统要求

### 最低要求
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Linux (Ubuntu 20.04+), macOS, Windows 10+

### 推荐配置
- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 稳定的互联网连接

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 18+ (开发环境)
- Java 17+ (开发环境)
- Maven 3.8+ (开发环境)

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-org/secure-api-system.git
cd secure-api-system
```

### 2. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 3. 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080/api
- **API 文档**: http://localhost:8080/swagger-ui.html
- **监控面板**: http://localhost:3001 (Grafana)

## 环境配置

### 开发环境

#### 本地开发设置
```bash
# 前端开发
cd frontend
npm install
npm run dev

# 后端开发
cd backend
mvn spring-boot:run
```

#### 环境变量
```bash
# .env.development
NODE_ENV=development
API_BASE_URL=http://localhost:8080/api
DB_HOST=localhost
DB_PORT=3306
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=debug
```

### 测试环境

#### Docker Compose 部署
```bash
# 启动测试环境
docker-compose -f docker-compose.yml up -d

# 运行测试
npm run test:e2e
```

#### 环境变量
```bash
# .env.staging
NODE_ENV=staging
API_BASE_URL=https://api-staging.example.com
DB_HOST=staging-db.example.com
REDIS_HOST=staging-redis.example.com
LOG_LEVEL=info
```

### 生产环境

#### 生产部署
```bash
# 使用生产配置
docker-compose -f docker-compose.prod.yml up -d

# 或使用部署脚本
./scripts/deploy.sh production v1.0.0
```

#### 环境变量
```bash
# .env.production
NODE_ENV=production
API_BASE_URL=https://api.example.com
DB_HOST=prod-db.example.com
REDIS_HOST=prod-redis.example.com
LOG_LEVEL=warn
```

## 详细部署步骤

### 1. 数据库设置

#### MySQL 配置
```sql
-- 创建数据库
CREATE DATABASE secure_api_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'apiuser'@'%' IDENTIFIED BY 'secure-password';
GRANT ALL PRIVILEGES ON secure_api_db.* TO 'apiuser'@'%';
FLUSH PRIVILEGES;
```

#### Redis 配置
```bash
# redis.conf
bind 0.0.0.0
port 6379
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 2. 应用配置

#### 前端配置
```javascript
// config.js
window.APP_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || '/api',
  APP_TITLE: process.env.APP_TITLE || 'Secure API System',
  VERSION: process.env.APP_VERSION || '1.0.0',
  DEBUG: process.env.NODE_ENV === 'development'
};
```

#### 后端配置
```yaml
# application.yml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:production}
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:secure_api_db}
    username: ${DB_USERNAME:apiuser}
    password: ${DB_PASSWORD:password}
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
```

### 3. 反向代理配置

#### Nginx 配置
```nginx
# nginx.conf
upstream backend {
    server backend:8080;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name example.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL 配置
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    # API 代理
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 前端代理
    location / {
        proxy_pass http://frontend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 容器化部署

### Docker 镜像构建

#### 前端镜像
```bash
# 构建前端镜像
docker build -t secure-api-frontend:latest ./frontend

# 推送到仓库
docker tag secure-api-frontend:latest your-registry/secure-api-frontend:v1.0.0
docker push your-registry/secure-api-frontend:v1.0.0
```

#### 后端镜像
```bash
# 构建后端镜像
docker build -t secure-api-backend:latest ./backend

# 推送到仓库
docker tag secure-api-backend:latest your-registry/secure-api-backend:v1.0.0
docker push your-registry/secure-api-backend:v1.0.0
```

### Docker Compose 部署

#### 基础服务
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  mysql_data:
  redis_data:
```

#### 应用服务
```yaml
# docker-compose.app.yml
version: '3.8'

services:
  backend:
    image: secure-api-backend:latest
    environment:
      SPRING_PROFILES_ACTIVE: production
      DB_HOST: mysql
      REDIS_HOST: redis
    depends_on:
      - mysql
      - redis
    ports:
      - "8080:8080"

  frontend:
    image: secure-api-frontend:latest
    environment:
      API_BASE_URL: http://backend:8080/api
    depends_on:
      - backend
    ports:
      - "3000:80"
```

## Kubernetes 部署

### 命名空间
```yaml
# namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: secure-api-system
```

### ConfigMap
```yaml
# configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: secure-api-system
data:
  API_BASE_URL: "https://api.example.com"
  APP_TITLE: "Secure API System"
  LOG_LEVEL: "info"
```

### Secret
```yaml
# secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: secure-api-system
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
  REDIS_PASSWORD: <base64-encoded-password>
```

### 部署配置
```yaml
# deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: secure-api-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: secure-api-backend:v1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 服务配置
```yaml
# service.yml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: secure-api-system
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
  type: ClusterIP
```

### Ingress 配置
```yaml
# ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: secure-api-system
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

## 监控和日志

### Prometheus 配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/actuator/prometheus'

  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'
```

### Grafana 仪表板
```json
{
  "dashboard": {
    "title": "Secure API System",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
```

### 日志配置
```yaml
# logback-spring.xml
<configuration>
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
      <providers>
        <timestamp/>
        <logLevel/>
        <loggerName/>
        <message/>
        <mdc/>
      </providers>
    </encoder>
  </appender>
  
  <root level="INFO">
    <appender-ref ref="STDOUT"/>
  </root>
</configuration>
```

## 安全配置

### SSL/TLS 配置
```bash
# 生成自签名证书（开发环境）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private.key -out certificate.crt

# 使用 Let's Encrypt（生产环境）
certbot certonly --webroot -w /var/www/html -d example.com
```

### 防火墙配置
```bash
# UFW 配置
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 安全头配置
```nginx
# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## 备份和恢复

### 数据库备份
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="secure_api_db"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### 应用数据备份
```bash
#!/bin/bash
# backup-app.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/app"

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/uploads

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /app/config
```

### 恢复流程
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# 停止应用
docker-compose down

# 恢复数据库
gunzip -c $BACKUP_FILE | docker exec -i mysql mysql -u root -p$MYSQL_ROOT_PASSWORD secure_api_db

# 启动应用
docker-compose up -d
```

## 性能优化

### 数据库优化
```sql
-- MySQL 配置优化
SET GLOBAL innodb_buffer_pool_size = 1073741824;  -- 1GB
SET GLOBAL query_cache_size = 268435456;          -- 256MB
SET GLOBAL max_connections = 200;
```

### 应用优化
```yaml
# JVM 优化
JAVA_OPTS: >
  -Xms512m
  -Xmx1g
  -XX:+UseG1GC
  -XX:MaxGCPauseMillis=200
  -XX:+HeapDumpOnOutOfMemoryError
```

### 缓存配置
```yaml
# Redis 缓存配置
spring:
  cache:
    type: redis
    redis:
      time-to-live: 600000  # 10 minutes
      cache-null-values: false
```

## 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 检查容器状态
docker ps -a

# 查看容器日志
docker logs <container-name>

# 检查资源使用
docker stats
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
docker exec mysql mysqladmin -u root -p status

# 测试连接
docker exec backend nc -zv mysql 3306
```

#### 3. 内存不足
```bash
# 检查内存使用
free -h
docker stats

# 清理未使用的镜像
docker system prune -a
```

### 调试命令
```bash
# 进入容器调试
docker exec -it <container-name> /bin/bash

# 查看网络配置
docker network ls
docker network inspect <network-name>

# 查看卷挂载
docker volume ls
docker volume inspect <volume-name>

# 查看端口映射
docker port <container-name>
```

## 维护任务

### 定期维护
```bash
#!/bin/bash
# maintenance.sh

# 清理 Docker 资源
docker system prune -f

# 更新镜像
docker-compose pull

# 重启服务
docker-compose restart

# 检查磁盘空间
df -h

# 检查日志大小
du -sh /var/log/
```

### 健康检查
```bash
#!/bin/bash
# health-check.sh

# 检查服务状态
curl -f http://localhost:8080/actuator/health || exit 1
curl -f http://localhost:3000/ || exit 1

# 检查数据库连接
docker exec mysql mysqladmin -u root -p$MYSQL_ROOT_PASSWORD ping || exit 1

# 检查 Redis 连接
docker exec redis redis-cli -a $REDIS_PASSWORD ping || exit 1
```

## 联系支持

如果遇到部署问题，请联系：
- **技术支持**: support@example.com
- **运维团队**: ops@example.com
- **紧急联系**: +1-555-0123

## 附录

### 端口列表
- **3000**: 前端应用
- **8080**: 后端 API
- **3306**: MySQL 数据库
- **6379**: Redis 缓存
- **9090**: Prometheus
- **3001**: Grafana

### 环境变量参考
详细的环境变量配置请参考 `.env.example` 文件。

### 版本兼容性
- Node.js: 18.x
- Java: 17+
- MySQL: 8.0+
- Redis: 7.0+
- Docker: 20.10+