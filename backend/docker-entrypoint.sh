#!/bin/bash
set -e

# 等待数据库连接的函数
wait_for_database() {
    local host="$1"
    local port="$2"
    local timeout="${3:-30}"
    
    echo "Waiting for database at $host:$port..."
    
    for i in $(seq 1 $timeout); do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "Database is ready!"
            return 0
        fi
        echo "Waiting for database... ($i/$timeout)"
        sleep 1
    done
    
    echo "Database connection timeout!"
    return 1
}

# 等待Redis连接的函数
wait_for_redis() {
    local host="$1"
    local port="$2"
    local timeout="${3:-30}"
    
    echo "Waiting for Redis at $host:$port..."
    
    for i in $(seq 1 $timeout); do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "Redis is ready!"
            return 0
        fi
        echo "Waiting for Redis... ($i/$timeout)"
        sleep 1
    done
    
    echo "Redis connection timeout!"
    return 1
}

# 设置JVM参数
setup_jvm_options() {
    # 基础JVM参数
    local jvm_opts="$JAVA_OPTS"
    
    # 根据容器内存自动调整堆大小
    if [ -z "$JAVA_OPTS" ]; then
        local mem_limit=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "2147483648")
        local heap_size=$((mem_limit / 1024 / 1024 * 70 / 100))  # 70% of container memory
        
        if [ $heap_size -gt 1024 ]; then
            jvm_opts="-Xms512m -Xmx${heap_size}m"
        else
            jvm_opts="-Xms256m -Xmx512m"
        fi
        
        # 添加GC和性能参数
        jvm_opts="$jvm_opts -XX:+UseG1GC -XX:G1HeapRegionSize=16m"
        jvm_opts="$jvm_opts -XX:+UseStringDeduplication"
        jvm_opts="$jvm_opts -XX:+PrintGCDetails -XX:+PrintGCTimeStamps"
        jvm_opts="$jvm_opts -Xloggc:/app/logs/gc.log"
    fi
    
    # 添加调试和监控参数
    if [ "$ENABLE_DEBUG" = "true" ]; then
        jvm_opts="$jvm_opts -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
    fi
    
    if [ "$ENABLE_JMX" = "true" ]; then
        jvm_opts="$jvm_opts -Dcom.sun.management.jmxremote"
        jvm_opts="$jvm_opts -Dcom.sun.management.jmxremote.port=9999"
        jvm_opts="$jvm_opts -Dcom.sun.management.jmxremote.authenticate=false"
        jvm_opts="$jvm_opts -Dcom.sun.management.jmxremote.ssl=false"
    fi
    
    export JAVA_OPTS="$jvm_opts"
}

# 设置Spring Boot配置
setup_spring_config() {
    # 设置活动配置文件
    export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-docker}"
    
    # 数据库配置
    if [ -n "$DB_HOST" ]; then
        export SPRING_DATASOURCE_URL="jdbc:mysql://${DB_HOST}:${DB_PORT:-3306}/${DB_NAME:-secure_api}"
        export SPRING_DATASOURCE_USERNAME="${DB_USERNAME:-root}"
        export SPRING_DATASOURCE_PASSWORD="${DB_PASSWORD}"
    fi
    
    # Redis配置
    if [ -n "$REDIS_HOST" ]; then
        export SPRING_REDIS_HOST="${REDIS_HOST}"
        export SPRING_REDIS_PORT="${REDIS_PORT:-6379}"
        export SPRING_REDIS_PASSWORD="${REDIS_PASSWORD}"
    fi
    
    # 日志配置
    export LOGGING_FILE_PATH="/app/logs"
    export LOGGING_LEVEL_ROOT="${LOG_LEVEL:-INFO}"
    
    # 安全配置
    if [ -n "$JWT_SECRET" ]; then
        export APP_JWT_SECRET="$JWT_SECRET"
    fi
    
    if [ -n "$ENCRYPTION_KEY" ]; then
        export APP_ENCRYPTION_KEY="$ENCRYPTION_KEY"
    fi
}

# 创建必要的目录
create_directories() {
    mkdir -p /app/logs
    mkdir -p /app/temp
    mkdir -p /app/uploads
}

# 验证配置
validate_config() {
    echo "Validating configuration..."
    
    # 检查必要的环境变量
    if [ -z "$DB_HOST" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
        echo "Warning: No database configuration found"
    fi
    
    if [ -z "$REDIS_HOST" ] && [ -z "$SPRING_REDIS_HOST" ]; then
        echo "Warning: No Redis configuration found"
    fi
    
    # 检查JAR文件
    if [ ! -f "/app/app.jar" ]; then
        echo "Error: Application JAR file not found!"
        exit 1
    fi
}

# 主函数
main() {
    echo "Starting backend container..."
    
    # 显示环境信息
    echo "Environment: ${SPRING_PROFILES_ACTIVE:-docker}"
    echo "Java Version: $(java -version 2>&1 | head -n 1)"
    echo "Database Host: ${DB_HOST:-not configured}"
    echo "Redis Host: ${REDIS_HOST:-not configured}"
    
    # 创建目录
    create_directories
    
    # 设置配置
    setup_jvm_options
    setup_spring_config
    
    # 验证配置
    validate_config
    
    # 等待依赖服务
    if [ -n "$DB_HOST" ]; then
        wait_for_database "$DB_HOST" "${DB_PORT:-3306}" 60
    fi
    
    if [ -n "$REDIS_HOST" ]; then
        wait_for_redis "$REDIS_HOST" "${REDIS_PORT:-6379}" 30
    fi
    
    echo "Backend container setup completed."
    echo "Starting application with JAVA_OPTS: $JAVA_OPTS"
    
    # 执行传入的命令
    exec "$@"
}

# 如果脚本被直接执行
if [ "$1" = "java" ]; then
    main "$@"
else
    exec "$@"
fi