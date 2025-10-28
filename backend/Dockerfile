# 多阶段构建 - 构建阶段
FROM maven:3.9-openjdk-17-slim AS builder

# 设置工作目录
WORKDIR /app

# 复制pom.xml文件
COPY pom.xml .

# 下载依赖（利用Docker缓存层）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 构建应用
RUN mvn clean package -DskipTests -B

# 生产阶段
FROM openjdk:17-jre-slim AS production

# 安装必要的工具和创建用户
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        dumb-init && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r spring && \
    useradd -r -g spring spring

# 设置工作目录
WORKDIR /app

# 从构建阶段复制JAR文件
COPY --from=builder /app/target/*.jar app.jar

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 创建日志目录
RUN mkdir -p /app/logs && \
    chown -R spring:spring /app

# 设置JVM参数
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:G1HeapRegionSize=16m -XX:+UseStringDeduplication"

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 切换到非root用户
USER spring

# 启动命令
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/docker-entrypoint.sh"]
CMD ["java", "-jar", "app.jar"]