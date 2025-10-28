#!/bin/bash

# 系统监控脚本
# 监控应用健康状态、性能指标和资源使用情况

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
DEFAULT_CHECK_INTERVAL=30
DEFAULT_ALERT_THRESHOLD_CPU=80
DEFAULT_ALERT_THRESHOLD_MEMORY=85
DEFAULT_ALERT_THRESHOLD_DISK=90
DEFAULT_LOG_FILE="/var/log/monitor.log"

# 显示帮助信息
show_help() {
    echo "系统监控脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  health      检查应用健康状态 (默认)"
    echo "  metrics     显示性能指标"
    echo "  resources   显示资源使用情况"
    echo "  alerts      检查告警条件"
    echo "  watch       持续监控模式"
    echo "  report      生成监控报告"
    echo ""
    echo "选项:"
    echo "  --frontend-url URL      前端服务地址 (默认: http://localhost:3000)"
    echo "  --backend-url URL       后端服务地址 (默认: http://localhost:8080)"
    echo "  --mysql-host HOST       MySQL 主机地址 (默认: localhost)"
    echo "  --mysql-port PORT       MySQL 端口 (默认: 3306)"
    echo "  --redis-host HOST       Redis 主机地址 (默认: localhost)"
    echo "  --redis-port PORT       Redis 端口 (默认: 6379)"
    echo "  --interval SECONDS      检查间隔 (默认: $DEFAULT_CHECK_INTERVAL)"
    echo "  --cpu-threshold PERCENT CPU 告警阈值 (默认: $DEFAULT_ALERT_THRESHOLD_CPU)"
    echo "  --memory-threshold PERCENT 内存告警阈值 (默认: $DEFAULT_ALERT_THRESHOLD_MEMORY)"
    echo "  --disk-threshold PERCENT 磁盘告警阈值 (默认: $DEFAULT_ALERT_THRESHOLD_DISK)"
    echo "  --log-file FILE         日志文件路径 (默认: $DEFAULT_LOG_FILE)"
    echo "  --json                  JSON 格式输出"
    echo "  --quiet                 静默模式"
    echo "  --help                  显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 health --json"
    echo "  $0 watch --interval 60"
    echo "  $0 alerts --cpu-threshold 70"
}

# 日志函数
log_info() {
    if [ "$QUIET" != true ]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    if [ "$QUIET" != true ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $1"
    fi
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    if [ "$QUIET" != true ]; then
        echo -e "${YELLOW}[WARNING]${NC} $1"
    fi
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    if [ "$QUIET" != true ]; then
        echo -e "${RED}[ERROR]${NC} $1"
    fi
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

# 检查必要的工具
check_dependencies() {
    local missing_tools=()
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if ! command -v mysql &> /dev/null; then
        missing_tools+=("mysql")
    fi
    
    if ! command -v redis-cli &> /dev/null; then
        missing_tools+=("redis-cli")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必要的工具: ${missing_tools[*]}"
        log_error "请安装这些工具后重试"
        exit 1
    fi
}

# 检查前端健康状态
check_frontend_health() {
    local url="$1"
    local status_code
    local response_time
    
    log_info "检查前端服务: $url"
    
    # 检查 HTTP 状态码和响应时间
    local curl_output
    curl_output=$(curl -o /dev/null -s -w "%{http_code},%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "000,0")
    
    status_code=$(echo "$curl_output" | cut -d',' -f1)
    response_time=$(echo "$curl_output" | cut -d',' -f2)
    
    if [ "$status_code" = "200" ]; then
        log_success "前端服务正常 (响应时间: ${response_time}s)"
        echo "frontend_status=healthy,frontend_response_time=$response_time"
    else
        log_error "前端服务异常 (状态码: $status_code)"
        echo "frontend_status=unhealthy,frontend_response_time=$response_time"
    fi
}

# 检查后端健康状态
check_backend_health() {
    local url="$1"
    local health_endpoint="${url}/actuator/health"
    local status_code
    local response_time
    local health_status
    
    log_info "检查后端服务: $health_endpoint"
    
    # 检查健康端点
    local curl_output
    curl_output=$(curl -s -w "%{http_code},%{time_total}" --max-time 10 "$health_endpoint" 2>/dev/null || echo "000,0")
    
    status_code=$(echo "$curl_output" | head -n -1)
    local metrics=$(echo "$curl_output" | tail -n 1)
    response_time=$(echo "$metrics" | cut -d',' -f2)
    
    if [ "$(echo "$metrics" | cut -d',' -f1)" = "200" ]; then
        health_status=$(echo "$status_code" | jq -r '.status // "UNKNOWN"' 2>/dev/null || echo "UNKNOWN")
        
        if [ "$health_status" = "UP" ]; then
            log_success "后端服务正常 (响应时间: ${response_time}s)"
            echo "backend_status=healthy,backend_response_time=$response_time"
        else
            log_warning "后端服务状态异常: $health_status"
            echo "backend_status=degraded,backend_response_time=$response_time"
        fi
    else
        log_error "后端服务不可访问 (状态码: $(echo "$metrics" | cut -d',' -f1))"
        echo "backend_status=unhealthy,backend_response_time=$response_time"
    fi
}

# 检查 MySQL 健康状态
check_mysql_health() {
    local host="$1"
    local port="$2"
    
    log_info "检查 MySQL 服务: $host:$port"
    
    # 检查连接
    if mysql -h "$host" -P "$port" -u root -e "SELECT 1;" &>/dev/null; then
        # 获取连接数和状态
        local connections
        local uptime
        connections=$(mysql -h "$host" -P "$port" -u root -e "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null | tail -n 1 | awk '{print $2}')
        uptime=$(mysql -h "$host" -P "$port" -u root -e "SHOW STATUS LIKE 'Uptime';" 2>/dev/null | tail -n 1 | awk '{print $2}')
        
        log_success "MySQL 服务正常 (连接数: $connections, 运行时间: ${uptime}s)"
        echo "mysql_status=healthy,mysql_connections=$connections,mysql_uptime=$uptime"
    else
        log_error "MySQL 服务不可访问"
        echo "mysql_status=unhealthy,mysql_connections=0,mysql_uptime=0"
    fi
}

# 检查 Redis 健康状态
check_redis_health() {
    local host="$1"
    local port="$2"
    
    log_info "检查 Redis 服务: $host:$port"
    
    # 检查连接
    if redis-cli -h "$host" -p "$port" ping &>/dev/null; then
        # 获取连接数和内存使用
        local connections
        local memory_used
        connections=$(redis-cli -h "$host" -p "$port" info clients | grep "connected_clients:" | cut -d':' -f2 | tr -d '\r')
        memory_used=$(redis-cli -h "$host" -p "$port" info memory | grep "used_memory_human:" | cut -d':' -f2 | tr -d '\r')
        
        log_success "Redis 服务正常 (连接数: $connections, 内存使用: $memory_used)"
        echo "redis_status=healthy,redis_connections=$connections,redis_memory=$memory_used"
    else
        log_error "Redis 服务不可访问"
        echo "redis_status=unhealthy,redis_connections=0,redis_memory=0"
    fi
}

# 获取系统资源使用情况
get_system_resources() {
    log_info "获取系统资源使用情况"
    
    # CPU 使用率
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    
    # 内存使用率
    local memory_info
    memory_info=$(free | grep Mem)
    local memory_total=$(echo "$memory_info" | awk '{print $2}')
    local memory_used=$(echo "$memory_info" | awk '{print $3}')
    local memory_usage=$((memory_used * 100 / memory_total))
    
    # 磁盘使用率
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    # 负载平均值
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | cut -d',' -f1)
    
    log_info "CPU 使用率: ${cpu_usage}%"
    log_info "内存使用率: ${memory_usage}%"
    log_info "磁盘使用率: ${disk_usage}%"
    log_info "负载平均值: $load_avg"
    
    echo "cpu_usage=$cpu_usage,memory_usage=$memory_usage,disk_usage=$disk_usage,load_avg=$load_avg"
}

# 检查告警条件
check_alerts() {
    log_info "检查告警条件"
    
    local alerts=()
    
    # 获取系统资源
    local resources
    resources=$(get_system_resources)
    
    local cpu_usage=$(echo "$resources" | grep -o 'cpu_usage=[0-9]*' | cut -d'=' -f2)
    local memory_usage=$(echo "$resources" | grep -o 'memory_usage=[0-9]*' | cut -d'=' -f2)
    local disk_usage=$(echo "$resources" | grep -o 'disk_usage=[0-9]*' | cut -d'=' -f2)
    
    # 检查 CPU 使用率
    if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
        alerts+=("CPU 使用率过高: ${cpu_usage}% (阈值: ${CPU_THRESHOLD}%)")
    fi
    
    # 检查内存使用率
    if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
        alerts+=("内存使用率过高: ${memory_usage}% (阈值: ${MEMORY_THRESHOLD}%)")
    fi
    
    # 检查磁盘使用率
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        alerts+=("磁盘使用率过高: ${disk_usage}% (阈值: ${DISK_THRESHOLD}%)")
    fi
    
    # 输出告警
    if [ ${#alerts[@]} -gt 0 ]; then
        log_warning "发现 ${#alerts[@]} 个告警:"
        for alert in "${alerts[@]}"; do
            log_warning "  - $alert"
        done
        echo "alerts_count=${#alerts[@]}"
    else
        log_success "所有指标正常"
        echo "alerts_count=0"
    fi
}

# 生成监控报告
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="monitor-report-$(date +%Y%m%d_%H%M%S).json"
    
    log_info "生成监控报告: $report_file"
    
    # 收集所有监控数据
    local frontend_health
    local backend_health
    local mysql_health
    local redis_health
    local system_resources
    local alerts_info
    
    frontend_health=$(check_frontend_health "$FRONTEND_URL")
    backend_health=$(check_backend_health "$BACKEND_URL")
    mysql_health=$(check_mysql_health "$MYSQL_HOST" "$MYSQL_PORT")
    redis_health=$(check_redis_health "$REDIS_HOST" "$REDIS_PORT")
    system_resources=$(get_system_resources)
    alerts_info=$(check_alerts)
    
    # 生成 JSON 报告
    cat > "$report_file" << EOF
{
  "timestamp": "$timestamp",
  "services": {
    "frontend": {
      "status": "$(echo "$frontend_health" | grep -o 'frontend_status=[^,]*' | cut -d'=' -f2)",
      "response_time": "$(echo "$frontend_health" | grep -o 'frontend_response_time=[^,]*' | cut -d'=' -f2)"
    },
    "backend": {
      "status": "$(echo "$backend_health" | grep -o 'backend_status=[^,]*' | cut -d'=' -f2)",
      "response_time": "$(echo "$backend_health" | grep -o 'backend_response_time=[^,]*' | cut -d'=' -f2)"
    },
    "mysql": {
      "status": "$(echo "$mysql_health" | grep -o 'mysql_status=[^,]*' | cut -d'=' -f2)",
      "connections": "$(echo "$mysql_health" | grep -o 'mysql_connections=[^,]*' | cut -d'=' -f2)",
      "uptime": "$(echo "$mysql_health" | grep -o 'mysql_uptime=[^,]*' | cut -d'=' -f2)"
    },
    "redis": {
      "status": "$(echo "$redis_health" | grep -o 'redis_status=[^,]*' | cut -d'=' -f2)",
      "connections": "$(echo "$redis_health" | grep -o 'redis_connections=[^,]*' | cut -d'=' -f2)",
      "memory": "$(echo "$redis_health" | grep -o 'redis_memory=[^,]*' | cut -d'=' -f2)"
    }
  },
  "system": {
    "cpu_usage": "$(echo "$system_resources" | grep -o 'cpu_usage=[^,]*' | cut -d'=' -f2)",
    "memory_usage": "$(echo "$system_resources" | grep -o 'memory_usage=[^,]*' | cut -d'=' -f2)",
    "disk_usage": "$(echo "$system_resources" | grep -o 'disk_usage=[^,]*' | cut -d'=' -f2)",
    "load_avg": "$(echo "$system_resources" | grep -o 'load_avg=[^,]*' | cut -d'=' -f2)"
  },
  "alerts": {
    "count": "$(echo "$alerts_info" | grep -o 'alerts_count=[^,]*' | cut -d'=' -f2)"
  }
}
EOF
    
    log_success "监控报告已生成: $report_file"
    
    if [ "$JSON_OUTPUT" = true ]; then
        cat "$report_file"
    fi
}

# 持续监控模式
watch_mode() {
    log_info "启动持续监控模式 (间隔: ${CHECK_INTERVAL}s)"
    
    while true; do
        echo "==================== $(date '+%Y-%m-%d %H:%M:%S') ===================="
        
        check_frontend_health "$FRONTEND_URL"
        check_backend_health "$BACKEND_URL"
        check_mysql_health "$MYSQL_HOST" "$MYSQL_PORT"
        check_redis_health "$REDIS_HOST" "$REDIS_PORT"
        get_system_resources
        check_alerts
        
        echo ""
        sleep "$CHECK_INTERVAL"
    done
}

# 主函数
main() {
    # 设置默认值
    COMMAND="health"
    FRONTEND_URL="http://localhost:3000"
    BACKEND_URL="http://localhost:8080"
    MYSQL_HOST="localhost"
    MYSQL_PORT="3306"
    REDIS_HOST="localhost"
    REDIS_PORT="6379"
    CHECK_INTERVAL="$DEFAULT_CHECK_INTERVAL"
    CPU_THRESHOLD="$DEFAULT_ALERT_THRESHOLD_CPU"
    MEMORY_THRESHOLD="$DEFAULT_ALERT_THRESHOLD_MEMORY"
    DISK_THRESHOLD="$DEFAULT_ALERT_THRESHOLD_DISK"
    LOG_FILE="$DEFAULT_LOG_FILE"
    JSON_OUTPUT=false
    QUIET=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            health|metrics|resources|alerts|watch|report)
                COMMAND="$1"
                shift
                ;;
            --frontend-url)
                FRONTEND_URL="$2"
                shift 2
                ;;
            --backend-url)
                BACKEND_URL="$2"
                shift 2
                ;;
            --mysql-host)
                MYSQL_HOST="$2"
                shift 2
                ;;
            --mysql-port)
                MYSQL_PORT="$2"
                shift 2
                ;;
            --redis-host)
                REDIS_HOST="$2"
                shift 2
                ;;
            --redis-port)
                REDIS_PORT="$2"
                shift 2
                ;;
            --interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            --cpu-threshold)
                CPU_THRESHOLD="$2"
                shift 2
                ;;
            --memory-threshold)
                MEMORY_THRESHOLD="$2"
                shift 2
                ;;
            --disk-threshold)
                DISK_THRESHOLD="$2"
                shift 2
                ;;
            --log-file)
                LOG_FILE="$2"
                shift 2
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # 检查依赖
    check_dependencies
    
    # 执行命令
    case $COMMAND in
        health)
            check_frontend_health "$FRONTEND_URL"
            check_backend_health "$BACKEND_URL"
            check_mysql_health "$MYSQL_HOST" "$MYSQL_PORT"
            check_redis_health "$REDIS_HOST" "$REDIS_PORT"
            ;;
        metrics)
            check_backend_health "$BACKEND_URL"
            ;;
        resources)
            get_system_resources
            ;;
        alerts)
            check_alerts
            ;;
        watch)
            watch_mode
            ;;
        report)
            generate_report
            ;;
    esac
    
    log_success "监控检查完成!"
}

# 执行主函数
main "$@"