#!/bin/sh
set -e

# 环境变量替换函数
replace_env_vars() {
    local file="$1"
    if [ -f "$file" ]; then
        # 替换环境变量占位符
        envsubst '${API_BASE_URL} ${APP_TITLE} ${APP_VERSION}' < "$file" > "$file.tmp"
        mv "$file.tmp" "$file"
    fi
}

# 创建运行时配置
create_runtime_config() {
    cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
    API_BASE_URL: '${API_BASE_URL:-/api}',
    APP_TITLE: '${APP_TITLE:-Secure API System}',
    APP_VERSION: '${APP_VERSION:-1.0.0}',
    ENVIRONMENT: '${NODE_ENV:-production}',
    ENABLE_ANALYTICS: ${ENABLE_ANALYTICS:-false},
    DEBUG_MODE: ${DEBUG_MODE:-false}
};
EOF
}

# 更新index.html中的环境变量
update_index_html() {
    local index_file="/usr/share/nginx/html/index.html"
    if [ -f "$index_file" ]; then
        # 替换页面标题
        sed -i "s/<title>.*<\/title>/<title>${APP_TITLE:-Secure API System}<\/title>/" "$index_file"
        
        # 添加配置脚本引用（如果不存在）
        if ! grep -q "config.js" "$index_file"; then
            sed -i 's/<\/head>/<script src="\/config.js"><\/script><\/head>/' "$index_file"
        fi
    fi
}

# 设置nginx配置
setup_nginx_config() {
    # 如果提供了自定义nginx配置，使用它
    if [ -n "$NGINX_CONFIG" ] && [ -f "$NGINX_CONFIG" ]; then
        cp "$NGINX_CONFIG" /etc/nginx/nginx.conf
    fi
    
    # 替换后端服务地址
    if [ -n "$BACKEND_HOST" ]; then
        sed -i "s/backend:8080/${BACKEND_HOST}/" /etc/nginx/nginx.conf
    fi
}

# 验证nginx配置
validate_nginx_config() {
    nginx -t
    if [ $? -ne 0 ]; then
        echo "Nginx configuration is invalid!"
        exit 1
    fi
}

# 主函数
main() {
    echo "Starting frontend container..."
    
    # 显示环境信息
    echo "Environment: ${NODE_ENV:-production}"
    echo "API Base URL: ${API_BASE_URL:-/api}"
    echo "App Title: ${APP_TITLE:-Secure API System}"
    echo "Backend Host: ${BACKEND_HOST:-backend:8080}"
    
    # 创建运行时配置
    create_runtime_config
    
    # 更新HTML文件
    update_index_html
    
    # 设置nginx配置
    setup_nginx_config
    
    # 验证nginx配置
    validate_nginx_config
    
    echo "Frontend container setup completed."
    
    # 执行传入的命令
    exec "$@"
}

# 如果脚本被直接执行
if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
    set -- nginx -g "daemon off;" "$@"
fi

main "$@"