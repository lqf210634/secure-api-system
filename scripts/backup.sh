#!/bin/bash

# 数据库备份脚本
# 支持 MySQL 和 Redis 的备份与恢复

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
DEFAULT_BACKUP_DIR="/backup"
DEFAULT_RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 显示帮助信息
show_help() {
    echo "数据库备份脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  backup      创建备份 (默认)"
    echo "  restore     恢复备份"
    echo "  list        列出备份文件"
    echo "  cleanup     清理过期备份"
    echo "  verify      验证备份文件"
    echo ""
    echo "选项:"
    echo "  --mysql-host HOST       MySQL 主机地址 (默认: localhost)"
    echo "  --mysql-port PORT       MySQL 端口 (默认: 3306)"
    echo "  --mysql-user USER       MySQL 用户名 (默认: root)"
    echo "  --mysql-password PASS   MySQL 密码"
    echo "  --mysql-database DB     MySQL 数据库名"
    echo "  --redis-host HOST       Redis 主机地址 (默认: localhost)"
    echo "  --redis-port PORT       Redis 端口 (默认: 6379)"
    echo "  --redis-password PASS   Redis 密码"
    echo "  --backup-dir DIR        备份目录 (默认: $DEFAULT_BACKUP_DIR)"
    echo "  --retention-days DAYS   备份保留天数 (默认: $DEFAULT_RETENTION_DAYS)"
    echo "  --compress              压缩备份文件"
    echo "  --encrypt               加密备份文件"
    echo "  --s3-bucket BUCKET      上传到 S3 存储桶"
    echo "  --help                  显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE"
    echo "  REDIS_HOST, REDIS_PORT, REDIS_PASSWORD"
    echo "  BACKUP_DIR, RETENTION_DAYS"
    echo "  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION"
    echo ""
    echo "示例:"
    echo "  $0 backup --mysql-database myapp --compress"
    echo "  $0 restore --file backup_20231201_120000.sql.gz"
    echo "  $0 cleanup --retention-days 7"
}

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_dependencies() {
    local missing_tools=()
    
    if ! command -v mysqldump &> /dev/null; then
        missing_tools+=("mysqldump")
    fi
    
    if ! command -v mysql &> /dev/null; then
        missing_tools+=("mysql")
    fi
    
    if ! command -v redis-cli &> /dev/null; then
        missing_tools+=("redis-cli")
    fi
    
    if [ "$COMPRESS" = true ] && ! command -v gzip &> /dev/null; then
        missing_tools+=("gzip")
    fi
    
    if [ "$ENCRYPT" = true ] && ! command -v gpg &> /dev/null; then
        missing_tools+=("gpg")
    fi
    
    if [ -n "$S3_BUCKET" ] && ! command -v aws &> /dev/null; then
        missing_tools+=("aws")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必要的工具: ${missing_tools[*]}"
        log_error "请安装这些工具后重试"
        exit 1
    fi
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "创建备份目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# MySQL 备份
backup_mysql() {
    local backup_file="${BACKUP_DIR}/mysql_${MYSQL_DATABASE}_${TIMESTAMP}.sql"
    
    log_info "开始备份 MySQL 数据库: $MYSQL_DATABASE"
    
    # 构建 mysqldump 命令
    local mysqldump_cmd="mysqldump"
    mysqldump_cmd+=" --host=$MYSQL_HOST"
    mysqldump_cmd+=" --port=$MYSQL_PORT"
    mysqldump_cmd+=" --user=$MYSQL_USER"
    
    if [ -n "$MYSQL_PASSWORD" ]; then
        mysqldump_cmd+=" --password=$MYSQL_PASSWORD"
    fi
    
    mysqldump_cmd+=" --single-transaction"
    mysqldump_cmd+=" --routines"
    mysqldump_cmd+=" --triggers"
    mysqldump_cmd+=" --events"
    mysqldump_cmd+=" --hex-blob"
    mysqldump_cmd+=" --add-drop-database"
    mysqldump_cmd+=" --databases $MYSQL_DATABASE"
    
    # 执行备份
    if eval "$mysqldump_cmd" > "$backup_file"; then
        log_success "MySQL 备份完成: $backup_file"
        
        # 压缩备份文件
        if [ "$COMPRESS" = true ]; then
            log_info "压缩备份文件..."
            gzip "$backup_file"
            backup_file="${backup_file}.gz"
            log_success "备份文件已压缩: $backup_file"
        fi
        
        # 加密备份文件
        if [ "$ENCRYPT" = true ]; then
            log_info "加密备份文件..."
            gpg --symmetric --cipher-algo AES256 "$backup_file"
            rm "$backup_file"
            backup_file="${backup_file}.gpg"
            log_success "备份文件已加密: $backup_file"
        fi
        
        # 上传到 S3
        if [ -n "$S3_BUCKET" ]; then
            upload_to_s3 "$backup_file"
        fi
        
        echo "$backup_file"
    else
        log_error "MySQL 备份失败"
        exit 1
    fi
}

# Redis 备份
backup_redis() {
    local backup_file="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"
    
    log_info "开始备份 Redis 数据"
    
    # 构建 redis-cli 命令
    local redis_cmd="redis-cli"
    redis_cmd+=" -h $REDIS_HOST"
    redis_cmd+=" -p $REDIS_PORT"
    
    if [ -n "$REDIS_PASSWORD" ]; then
        redis_cmd+=" -a $REDIS_PASSWORD"
    fi
    
    # 执行 BGSAVE 命令
    if eval "$redis_cmd BGSAVE" | grep -q "Background saving started"; then
        log_info "等待 Redis 后台保存完成..."
        
        # 等待备份完成
        while eval "$redis_cmd LASTSAVE" | head -1 | grep -q "$(eval "$redis_cmd LASTSAVE" | head -1)"; do
            sleep 1
        done
        
        # 复制 RDB 文件
        local redis_dir=$(eval "$redis_cmd CONFIG GET dir" | tail -1)
        local redis_dbfilename=$(eval "$redis_cmd CONFIG GET dbfilename" | tail -1)
        local source_file="${redis_dir}/${redis_dbfilename}"
        
        if [ -f "$source_file" ]; then
            cp "$source_file" "$backup_file"
            log_success "Redis 备份完成: $backup_file"
            
            # 压缩备份文件
            if [ "$COMPRESS" = true ]; then
                log_info "压缩备份文件..."
                gzip "$backup_file"
                backup_file="${backup_file}.gz"
                log_success "备份文件已压缩: $backup_file"
            fi
            
            # 加密备份文件
            if [ "$ENCRYPT" = true ]; then
                log_info "加密备份文件..."
                gpg --symmetric --cipher-algo AES256 "$backup_file"
                rm "$backup_file"
                backup_file="${backup_file}.gpg"
                log_success "备份文件已加密: $backup_file"
            fi
            
            # 上传到 S3
            if [ -n "$S3_BUCKET" ]; then
                upload_to_s3 "$backup_file"
            fi
            
            echo "$backup_file"
        else
            log_error "找不到 Redis RDB 文件: $source_file"
            exit 1
        fi
    else
        log_error "Redis 备份失败"
        exit 1
    fi
}

# 上传到 S3
upload_to_s3() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    local s3_key="backups/$(date +%Y/%m/%d)/$file_name"
    
    log_info "上传备份文件到 S3: s3://$S3_BUCKET/$s3_key"
    
    if aws s3 cp "$file_path" "s3://$S3_BUCKET/$s3_key"; then
        log_success "备份文件已上传到 S3"
    else
        log_error "上传到 S3 失败"
    fi
}

# 恢复 MySQL 备份
restore_mysql() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_info "开始恢复 MySQL 数据库: $MYSQL_DATABASE"
    log_warning "这将覆盖现有数据，请确认操作"
    
    read -p "确认恢复? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "恢复操作已取消"
        exit 0
    fi
    
    # 处理压缩和加密的文件
    local temp_file="$backup_file"
    
    if [[ "$backup_file" == *.gpg ]]; then
        log_info "解密备份文件..."
        temp_file="${backup_file%.gpg}"
        gpg --decrypt "$backup_file" > "$temp_file"
    fi
    
    if [[ "$temp_file" == *.gz ]]; then
        log_info "解压备份文件..."
        local uncompressed_file="${temp_file%.gz}"
        gunzip -c "$temp_file" > "$uncompressed_file"
        temp_file="$uncompressed_file"
    fi
    
    # 构建 mysql 命令
    local mysql_cmd="mysql"
    mysql_cmd+=" --host=$MYSQL_HOST"
    mysql_cmd+=" --port=$MYSQL_PORT"
    mysql_cmd+=" --user=$MYSQL_USER"
    
    if [ -n "$MYSQL_PASSWORD" ]; then
        mysql_cmd+=" --password=$MYSQL_PASSWORD"
    fi
    
    # 执行恢复
    if eval "$mysql_cmd" < "$temp_file"; then
        log_success "MySQL 数据库恢复完成"
    else
        log_error "MySQL 数据库恢复失败"
        exit 1
    fi
    
    # 清理临时文件
    if [ "$temp_file" != "$backup_file" ]; then
        rm -f "$temp_file"
    fi
}

# 列出备份文件
list_backups() {
    log_info "备份文件列表:"
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.sql*" -o -name "*.rdb*" | sort -r | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" 2>/dev/null || stat -f %Sm "$file" 2>/dev/null)
            echo "  $(basename "$file") ($size) - $date"
        done
    else
        log_warning "备份目录不存在: $BACKUP_DIR"
    fi
}

# 清理过期备份
cleanup_backups() {
    log_info "清理 $RETENTION_DAYS 天前的备份文件"
    
    if [ -d "$BACKUP_DIR" ]; then
        local deleted_count=0
        
        find "$BACKUP_DIR" -name "*.sql*" -o -name "*.rdb*" | while read -r file; do
            if [ -f "$file" ] && [ $(($(date +%s) - $(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null))) -gt $((RETENTION_DAYS * 86400)) ]; then
                log_info "删除过期备份: $(basename "$file")"
                rm -f "$file"
                ((deleted_count++))
            fi
        done
        
        log_success "清理完成，删除了 $deleted_count 个过期备份文件"
    else
        log_warning "备份目录不存在: $BACKUP_DIR"
    fi
}

# 验证备份文件
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_info "验证备份文件: $(basename "$backup_file")"
    
    # 检查文件大小
    local file_size=$(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file" 2>/dev/null)
    if [ "$file_size" -eq 0 ]; then
        log_error "备份文件为空"
        exit 1
    fi
    
    # 检查文件类型
    if [[ "$backup_file" == *.sql* ]]; then
        # 验证 SQL 文件
        if [[ "$backup_file" == *.gz ]]; then
            if gunzip -t "$backup_file" 2>/dev/null; then
                log_success "压缩文件完整性验证通过"
            else
                log_error "压缩文件损坏"
                exit 1
            fi
        fi
        
        # 检查 SQL 语法
        local temp_file="/tmp/backup_verify_$$.sql"
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -c "$backup_file" > "$temp_file"
        else
            cp "$backup_file" "$temp_file"
        fi
        
        if grep -q "CREATE DATABASE\|INSERT INTO\|CREATE TABLE" "$temp_file"; then
            log_success "SQL 备份文件格式验证通过"
        else
            log_error "SQL 备份文件格式异常"
            exit 1
        fi
        
        rm -f "$temp_file"
        
    elif [[ "$backup_file" == *.rdb* ]]; then
        # 验证 RDB 文件
        if [[ "$backup_file" == *.gz ]]; then
            if gunzip -t "$backup_file" 2>/dev/null; then
                log_success "压缩文件完整性验证通过"
            else
                log_error "压缩文件损坏"
                exit 1
            fi
        fi
        
        log_success "RDB 备份文件验证通过"
    fi
    
    log_success "备份文件验证完成"
}

# 主函数
main() {
    # 设置默认值
    COMMAND="backup"
    MYSQL_HOST="${MYSQL_HOST:-localhost}"
    MYSQL_PORT="${MYSQL_PORT:-3306}"
    MYSQL_USER="${MYSQL_USER:-root}"
    MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
    MYSQL_DATABASE="${MYSQL_DATABASE:-}"
    REDIS_HOST="${REDIS_HOST:-localhost}"
    REDIS_PORT="${REDIS_PORT:-6379}"
    REDIS_PASSWORD="${REDIS_PASSWORD:-}"
    BACKUP_DIR="${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}"
    RETENTION_DAYS="${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}"
    COMPRESS=false
    ENCRYPT=false
    S3_BUCKET=""
    RESTORE_FILE=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            backup|restore|list|cleanup|verify)
                COMMAND="$1"
                shift
                ;;
            --mysql-host)
                MYSQL_HOST="$2"
                shift 2
                ;;
            --mysql-port)
                MYSQL_PORT="$2"
                shift 2
                ;;
            --mysql-user)
                MYSQL_USER="$2"
                shift 2
                ;;
            --mysql-password)
                MYSQL_PASSWORD="$2"
                shift 2
                ;;
            --mysql-database)
                MYSQL_DATABASE="$2"
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
            --redis-password)
                REDIS_PASSWORD="$2"
                shift 2
                ;;
            --backup-dir)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --retention-days)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --file)
                RESTORE_FILE="$2"
                shift 2
                ;;
            --compress)
                COMPRESS=true
                shift
                ;;
            --encrypt)
                ENCRYPT=true
                shift
                ;;
            --s3-bucket)
                S3_BUCKET="$2"
                shift 2
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
    
    # 检查依赖
    check_dependencies
    
    # 创建备份目录
    create_backup_dir
    
    # 执行命令
    case $COMMAND in
        backup)
            if [ -n "$MYSQL_DATABASE" ]; then
                backup_mysql
            fi
            backup_redis
            ;;
        restore)
            if [ -z "$RESTORE_FILE" ]; then
                log_error "请指定要恢复的备份文件 (--file)"
                exit 1
            fi
            
            if [[ "$RESTORE_FILE" == *mysql* ]]; then
                restore_mysql "$RESTORE_FILE"
            else
                log_error "暂不支持 Redis 恢复"
                exit 1
            fi
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_backups
            ;;
        verify)
            if [ -z "$RESTORE_FILE" ]; then
                log_error "请指定要验证的备份文件 (--file)"
                exit 1
            fi
            verify_backup "$RESTORE_FILE"
            ;;
    esac
    
    log_success "操作完成!"
}

# 执行主函数
main "$@"