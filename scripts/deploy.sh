#!/bin/bash

# Secure API System Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
NAMESPACE="secure-api-system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
COMPOSE_FILE=""

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

# 显示帮助信息
show_help() {
    cat << EOF
Usage: $0 [ENVIRONMENT] [IMAGE_TAG]

Deploy Secure API System to specified environment.

Arguments:
    ENVIRONMENT    Target environment (development|staging|production) [default: development]
    IMAGE_TAG      Docker image tag to deploy [default: latest]

Examples:
    $0                          # Deploy to development with latest tag
    $0 staging                  # Deploy to staging with latest tag
    $0 production v1.2.3        # Deploy to production with v1.2.3 tag

Options:
    -h, --help                  Show this help message
    -v, --version              Show version information
    --dry-run                  Show what would be deployed without executing
    --force                    Force deployment without confirmation
    --no-backup                Skip backup before deployment
    --rollback                 Rollback to previous version

EOF
}

# 检查依赖
check_dependencies() {
    log_info "Checking dependencies..."
    
    local deps=("docker" "docker-compose" "curl" "jq")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All dependencies are available."
}

# 验证环境
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        development|dev)
            ENVIRONMENT="development"
            COMPOSE_FILE="docker-compose.yml"
            ;;
        staging|stage)
            ENVIRONMENT="staging"
            COMPOSE_FILE="docker-compose.yml"
            ;;
        production|prod)
            ENVIRONMENT="production"
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    log_success "Environment validated: $ENVIRONMENT"
}

# 检查环境变量文件
check_env_file() {
    local env_file="$PROJECT_ROOT/.env"
    
    if [ ! -f "$env_file" ]; then
        log_warning "Environment file not found: $env_file"
        log_info "Creating from example..."
        
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$env_file"
            log_warning "Please update $env_file with your actual configuration values."
        else
            log_error "Example environment file not found: $PROJECT_ROOT/.env.example"
            exit 1
        fi
    fi
    
    log_success "Environment file found: $env_file"
}

# 备份当前部署
backup_current_deployment() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        log_info "Skipping backup as requested."
        return
    fi
    
    log_info "Creating backup of current deployment..."
    
    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份配置文件
    if [ -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env" "$backup_dir/"
    fi
    
    # 备份数据库（如果是本地部署）
    if docker ps | grep -q "secure-api-mysql"; then
        log_info "Backing up database..."
        docker exec secure-api-mysql mysqldump -u root -p"${DB_ROOT_PASSWORD:-rootpassword}" --all-databases > "$backup_dir/database_backup.sql"
    fi
    
    # 备份上传文件
    if docker volume ls | grep -q "secure-api-system_backend_uploads"; then
        log_info "Backing up uploaded files..."
        docker run --rm -v secure-api-system_backend_uploads:/source -v "$backup_dir":/backup alpine tar czf /backup/uploads_backup.tar.gz -C /source .
    fi
    
    log_success "Backup created: $backup_dir"
}

# 构建镜像
build_images() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Production deployment - skipping local build (using pre-built images)"
        return
    fi
    
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # 构建前端镜像
    log_info "Building frontend image..."
    docker build -t "secure-api-frontend:$IMAGE_TAG" ./frontend
    
    # 构建后端镜像
    log_info "Building backend image..."
    docker build -t "secure-api-backend:$IMAGE_TAG" ./backend
    
    log_success "Images built successfully."
}

# 运行测试
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_info "Skipping tests as requested."
        return
    fi
    
    log_info "Running tests..."
    
    # 前端测试
    log_info "Running frontend tests..."
    cd "$PROJECT_ROOT/frontend"
    npm test -- --run
    
    # 后端测试
    log_info "Running backend tests..."
    cd "$PROJECT_ROOT/backend"
    mvn test
    
    cd "$PROJECT_ROOT"
    log_success "All tests passed."
}

# 部署应用
deploy_application() {
    log_info "Deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # 设置环境变量
    export IMAGE_TAG="$IMAGE_TAG"
    export ENVIRONMENT="$ENVIRONMENT"
    
    # 停止现有服务
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # 清理未使用的镜像和容器
    log_info "Cleaning up unused Docker resources..."
    docker system prune -f
    
    # 启动服务
    log_info "Starting services..."
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d --scale backend=2 --scale frontend=2
    else
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    log_success "Application deployed successfully."
}

# 健康检查
health_check() {
    log_info "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # 检查后端健康状态
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
            log_success "Backend is healthy."
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend health check failed after $max_attempts attempts."
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # 检查前端健康状态
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        log_info "Frontend health check attempt $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:80/health > /dev/null 2>&1; then
            log_success "Frontend is healthy."
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Frontend health check failed after $max_attempts attempts."
            return 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    log_success "All health checks passed."
}

# 运行冒烟测试
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # 测试API端点
    local api_endpoints=(
        "http://localhost:8080/actuator/health"
        "http://localhost:8080/api/auth/captcha"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        if ! curl -f -s "$endpoint" > /dev/null; then
            log_error "Smoke test failed for endpoint: $endpoint"
            return 1
        fi
    done
    
    # 测试前端页面
    log_info "Testing frontend page..."
    if ! curl -f -s http://localhost:80 > /dev/null; then
        log_error "Frontend smoke test failed."
        return 1
    fi
    
    log_success "All smoke tests passed."
}

# 显示部署信息
show_deployment_info() {
    log_success "Deployment completed successfully!"
    
    echo ""
    echo "=== Deployment Information ==="
    echo "Environment: $ENVIRONMENT"
    echo "Image Tag: $IMAGE_TAG"
    echo "Compose File: $COMPOSE_FILE"
    echo ""
    echo "=== Service URLs ==="
    echo "Frontend: http://localhost:80"
    echo "Backend API: http://localhost:8080"
    echo "Backend Health: http://localhost:8080/actuator/health"
    
    if [ "$ENVIRONMENT" != "production" ]; then
        echo "Prometheus: http://localhost:9090"
        echo "Grafana: http://localhost:3000"
    fi
    
    echo ""
    echo "=== Useful Commands ==="
    echo "View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "Restart services: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# 回滚部署
rollback_deployment() {
    log_info "Rolling back deployment..."
    
    local backup_dir=$(ls -1t "$PROJECT_ROOT/backups/" | head -n 1)
    if [ -z "$backup_dir" ]; then
        log_error "No backup found for rollback."
        exit 1
    fi
    
    log_info "Rolling back to: $backup_dir"
    
    # 恢复配置文件
    if [ -f "$PROJECT_ROOT/backups/$backup_dir/.env" ]; then
        cp "$PROJECT_ROOT/backups/$backup_dir/.env" "$PROJECT_ROOT/"
    fi
    
    # 恢复数据库
    if [ -f "$PROJECT_ROOT/backups/$backup_dir/database_backup.sql" ]; then
        log_info "Restoring database..."
        docker exec -i secure-api-mysql mysql -u root -p"${DB_ROOT_PASSWORD:-rootpassword}" < "$PROJECT_ROOT/backups/$backup_dir/database_backup.sql"
    fi
    
    # 恢复上传文件
    if [ -f "$PROJECT_ROOT/backups/$backup_dir/uploads_backup.tar.gz" ]; then
        log_info "Restoring uploaded files..."
        docker run --rm -v secure-api-system_backend_uploads:/target -v "$PROJECT_ROOT/backups/$backup_dir":/backup alpine tar xzf /backup/uploads_backup.tar.gz -C /target
    fi
    
    log_success "Rollback completed."
}

# 主函数
main() {
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                echo "Secure API System Deployment Script v1.0.0"
                exit 0
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --no-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --no-tests)
                SKIP_TESTS=true
                shift
                ;;
            --rollback)
                rollback_deployment
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    # 设置环境和镜像标签
    ENVIRONMENT="${1:-development}"
    IMAGE_TAG="${2:-latest}"
    
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Image Tag: $IMAGE_TAG"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN MODE - No actual deployment will be performed"
    fi
    
    # 确认部署（生产环境）
    if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE" != "true" ]; then
        echo ""
        log_warning "You are about to deploy to PRODUCTION environment!"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Deployment cancelled."
            exit 0
        fi
    fi
    
    if [ "$DRY_RUN" != "true" ]; then
        # 执行部署步骤
        check_dependencies
        validate_environment
        check_env_file
        backup_current_deployment
        build_images
        run_tests
        deploy_application
        health_check
        run_smoke_tests
        show_deployment_info
    else
        log_info "DRY RUN: Would execute deployment steps for $ENVIRONMENT environment with tag $IMAGE_TAG"
    fi
    
    log_success "Deployment process completed!"
}

# 错误处理
trap 'log_error "Deployment failed! Check the logs above for details."; exit 1' ERR

# 执行主函数
main "$@"