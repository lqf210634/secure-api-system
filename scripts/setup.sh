#!/bin/bash

# Secure API System - Setup Script
# This script sets up the development environment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${ENVIRONMENT:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Help function
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --help          Show this help message
    -e, --environment   Set environment (development, staging, production)
    --skip-deps         Skip dependency installation
    --skip-docker       Skip Docker setup
    --skip-db           Skip database setup
    --clean             Clean existing setup before starting

Environment Variables:
    ENVIRONMENT         Target environment (default: development)
    SKIP_DEPS          Skip dependency installation
    SKIP_DOCKER        Skip Docker setup
    SKIP_DB            Skip database setup

Examples:
    $0                              # Full setup for development
    $0 -e staging                   # Setup for staging environment
    $0 --skip-deps                  # Setup without installing dependencies
    $0 --clean                      # Clean setup
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --clean)
                CLEAN=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Check system requirements
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Check operating system
    OS="$(uname -s)"
    case "${OS}" in
        Linux*)     MACHINE=Linux;;
        Darwin*)    MACHINE=Mac;;
        CYGWIN*)    MACHINE=Cygwin;;
        MINGW*)     MACHINE=MinGw;;
        *)          MACHINE="UNKNOWN:${OS}"
    esac
    log_info "Operating System: $MACHINE"
    
    # Check required tools
    REQUIRED_TOOLS=("git" "curl" "wget")
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "$tool is not installed. Please install $tool and try again."
            exit 1
        fi
    done
    
    log_success "System requirements check completed"
}

# Install Node.js and npm
install_nodejs() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_info "Node.js is already installed: $NODE_VERSION"
        
        # Check if version is compatible (>= 18)
        MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
        if [[ $MAJOR_VERSION -lt 18 ]]; then
            log_warning "Node.js version $NODE_VERSION is too old. Please upgrade to version 18 or higher."
        fi
    else
        log_info "Installing Node.js..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install node
            else
                log_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
                exit 1
            fi
        elif [[ "$MACHINE" == "Linux" ]]; then
            # Install Node.js using NodeSource repository
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            log_error "Automatic Node.js installation not supported on $MACHINE. Please install manually from https://nodejs.org/"
            exit 1
        fi
        
        log_success "Node.js installed successfully"
    fi
}

# Install Java
install_java() {
    if command -v java >/dev/null 2>&1; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        log_info "Java is already installed: $JAVA_VERSION"
        
        # Check if version is compatible (>= 17)
        MAJOR_VERSION=$(echo "$JAVA_VERSION" | cut -d'.' -f1)
        if [[ $MAJOR_VERSION -lt 17 ]]; then
            log_warning "Java version $JAVA_VERSION is too old. Please upgrade to version 17 or higher."
        fi
    else
        log_info "Installing Java..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install openjdk@17
                echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
            else
                log_error "Homebrew not found. Please install Java manually."
                exit 1
            fi
        elif [[ "$MACHINE" == "Linux" ]]; then
            sudo apt-get update
            sudo apt-get install -y openjdk-17-jdk
        else
            log_error "Automatic Java installation not supported on $MACHINE. Please install manually."
            exit 1
        fi
        
        log_success "Java installed successfully"
    fi
}

# Install Maven
install_maven() {
    if command -v mvn >/dev/null 2>&1; then
        MAVEN_VERSION=$(mvn --version | head -n 1 | cut -d' ' -f3)
        log_info "Maven is already installed: $MAVEN_VERSION"
    else
        log_info "Installing Maven..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install maven
            else
                log_error "Homebrew not found. Please install Maven manually."
                exit 1
            fi
        elif [[ "$MACHINE" == "Linux" ]]; then
            sudo apt-get update
            sudo apt-get install -y maven
        else
            log_error "Automatic Maven installation not supported on $MACHINE. Please install manually."
            exit 1
        fi
        
        log_success "Maven installed successfully"
    fi
}

# Install Docker
install_docker() {
    if [[ "$SKIP_DOCKER" == "true" ]]; then
        log_info "Skipping Docker installation"
        return
    fi
    
    if command -v docker >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        log_info "Docker is already installed: $DOCKER_VERSION"
        
        # Check if Docker is running
        if ! docker info >/dev/null 2>&1; then
            log_warning "Docker is installed but not running. Please start Docker."
        fi
    else
        log_info "Installing Docker..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            log_info "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
            log_warning "Manual installation required for macOS"
        elif [[ "$MACHINE" == "Linux" ]]; then
            # Install Docker using official script
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
            
            # Install Docker Compose
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            
            log_success "Docker installed successfully"
            log_warning "Please log out and log back in for Docker group changes to take effect"
        else
            log_error "Automatic Docker installation not supported on $MACHINE. Please install manually."
            exit 1
        fi
    fi
}

# Install additional tools
install_additional_tools() {
    log_info "Installing additional development tools..."
    
    # Install k6 for performance testing
    if ! command -v k6 >/dev/null 2>&1; then
        log_info "Installing k6..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install k6
            fi
        elif [[ "$MACHINE" == "Linux" ]]; then
            sudo gpg -k
            sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        fi
    fi
    
    # Install kubectl for Kubernetes
    if ! command -v kubectl >/dev/null 2>&1; then
        log_info "Installing kubectl..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install kubectl
            fi
        elif [[ "$MACHINE" == "Linux" ]]; then
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
            sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
            rm kubectl
        fi
    fi
    
    log_success "Additional tools installation completed"
}

# Setup project dependencies
setup_dependencies() {
    if [[ "$SKIP_DEPS" == "true" ]]; then
        log_info "Skipping dependency installation"
        return
    fi
    
    log_info "Setting up project dependencies..."
    
    # Frontend dependencies
    if [[ -d "$PROJECT_ROOT/frontend" ]]; then
        log_info "Installing frontend dependencies..."
        cd "$PROJECT_ROOT/frontend"
        npm ci
        log_success "Frontend dependencies installed"
    fi
    
    # Backend dependencies
    if [[ -d "$PROJECT_ROOT/backend" ]]; then
        log_info "Installing backend dependencies..."
        cd "$PROJECT_ROOT/backend"
        mvn dependency:resolve
        log_success "Backend dependencies installed"
    fi
}

# Setup environment files
setup_environment_files() {
    log_info "Setting up environment files..."
    
    # Create .env files if they don't exist
    ENV_FILES=(
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/frontend/.env"
        "$PROJECT_ROOT/backend/.env"
    )
    
    for env_file in "${ENV_FILES[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            ENV_EXAMPLE="${env_file}.example"
            if [[ -f "$ENV_EXAMPLE" ]]; then
                cp "$ENV_EXAMPLE" "$env_file"
                log_info "Created $env_file from example"
            else
                touch "$env_file"
                log_info "Created empty $env_file"
            fi
        fi
    done
    
    # Set environment-specific values
    case "$ENVIRONMENT" in
        "development")
            setup_development_env
            ;;
        "staging")
            setup_staging_env
            ;;
        "production")
            setup_production_env
            ;;
    esac
    
    log_success "Environment files setup completed"
}

# Setup development environment
setup_development_env() {
    log_info "Configuring development environment..."
    
    # Update .env file with development settings
    cat > "$PROJECT_ROOT/.env" << EOF
# Development Environment Configuration
ENVIRONMENT=development
NODE_ENV=development
SPRING_PROFILES_ACTIVE=dev

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=secure_api_dev
DB_USERNAME=root
DB_PASSWORD=rootpassword

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRATION=86400

# API Configuration
API_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=DEBUG
EOF
}

# Setup staging environment
setup_staging_env() {
    log_info "Configuring staging environment..."
    
    cat > "$PROJECT_ROOT/.env" << EOF
# Staging Environment Configuration
ENVIRONMENT=staging
NODE_ENV=production
SPRING_PROFILES_ACTIVE=staging

# Database Configuration (Update with staging values)
DB_HOST=staging-db-host
DB_PORT=3306
DB_NAME=secure_api_staging
DB_USERNAME=staging_user
DB_PASSWORD=staging_password

# Redis Configuration (Update with staging values)
REDIS_HOST=staging-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=staging_redis_password

# JWT Configuration
JWT_SECRET=staging-secret-key
JWT_EXPIRATION=86400

# API Configuration
API_BASE_URL=https://api-staging.example.com
FRONTEND_URL=https://app-staging.example.com

# Logging
LOG_LEVEL=INFO
EOF
}

# Setup production environment
setup_production_env() {
    log_info "Configuring production environment..."
    
    cat > "$PROJECT_ROOT/.env" << EOF
# Production Environment Configuration
ENVIRONMENT=production
NODE_ENV=production
SPRING_PROFILES_ACTIVE=prod

# Database Configuration (Update with production values)
DB_HOST=production-db-host
DB_PORT=3306
DB_NAME=secure_api_prod
DB_USERNAME=prod_user
DB_PASSWORD=CHANGE_ME

# Redis Configuration (Update with production values)
REDIS_HOST=production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME

# JWT Configuration
JWT_SECRET=CHANGE_ME
JWT_EXPIRATION=86400

# API Configuration
API_BASE_URL=https://api.example.com
FRONTEND_URL=https://app.example.com

# Logging
LOG_LEVEL=WARN
EOF
    
    log_warning "Please update production environment variables with actual values!"
}

# Setup database
setup_database() {
    if [[ "$SKIP_DB" == "true" ]]; then
        log_info "Skipping database setup"
        return
    fi
    
    log_info "Setting up database..."
    
    # Start database services
    cd "$PROJECT_ROOT"
    if [[ -f "docker-compose.yml" ]]; then
        docker-compose up -d mysql redis
        
        # Wait for services to be ready
        log_info "Waiting for database services to be ready..."
        sleep 15
        
        # Run database migrations
        if [[ -d "$PROJECT_ROOT/backend" ]]; then
            cd "$PROJECT_ROOT/backend"
            mvn flyway:migrate -Dflyway.configFiles=src/main/resources/db/flyway.conf
        fi
        
        log_success "Database setup completed"
    else
        log_warning "docker-compose.yml not found. Please set up database manually."
    fi
}

# Setup Git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks..."
    
    HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
    
    # Pre-commit hook
    cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit hook for code quality checks

echo "Running pre-commit checks..."

# Check if frontend files changed
if git diff --cached --name-only | grep -q "frontend/"; then
    echo "Frontend files changed, running linting..."
    cd frontend
    npm run lint
    npm run type-check
    cd ..
fi

# Check if backend files changed
if git diff --cached --name-only | grep -q "backend/"; then
    echo "Backend files changed, running checks..."
    cd backend
    mvn checkstyle:check
    cd ..
fi

echo "Pre-commit checks completed"
EOF
    
    chmod +x "$HOOKS_DIR/pre-commit"
    
    log_success "Git hooks setup completed"
}

# Clean existing setup
clean_setup() {
    if [[ "$CLEAN" == "true" ]]; then
        log_info "Cleaning existing setup..."
        
        # Stop and remove containers
        cd "$PROJECT_ROOT"
        docker-compose down -v 2>/dev/null || true
        
        # Clean node_modules
        find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
        
        # Clean Maven target directories
        find . -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
        
        # Clean environment files
        rm -f "$PROJECT_ROOT/.env"
        rm -f "$PROJECT_ROOT/frontend/.env"
        rm -f "$PROJECT_ROOT/backend/.env"
        
        log_success "Cleanup completed"
    fi
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    # Check if all required tools are available
    TOOLS=("node" "npm" "java" "mvn" "docker")
    for tool in "${TOOLS[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            VERSION=$($tool --version 2>&1 | head -n 1)
            log_success "$tool: $VERSION"
        else
            log_error "$tool: Not found"
        fi
    done
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker services are running"
    else
        log_warning "Docker services are not running"
    fi
    
    log_success "Setup verification completed"
}

# Main execution
main() {
    log_info "Starting Secure API System setup..."
    log_info "Environment: $ENVIRONMENT"
    
    # Parse arguments
    parse_args "$@"
    
    # Clean if requested
    clean_setup
    
    # Check system requirements
    check_system_requirements
    
    # Install dependencies
    if [[ "$SKIP_DEPS" != "true" ]]; then
        install_nodejs
        install_java
        install_maven
        install_docker
        install_additional_tools
    fi
    
    # Setup project
    setup_dependencies
    setup_environment_files
    setup_database
    setup_git_hooks
    
    # Verify setup
    verify_setup
    
    log_success "Setup completed successfully!"
    log_info "Next steps:"
    log_info "  1. Review and update environment variables in .env files"
    log_info "  2. Run 'npm run dev' in frontend directory to start development server"
    log_info "  3. Run 'mvn spring-boot:run' in backend directory to start API server"
    log_info "  4. Visit http://localhost:3000 to access the application"
}

# Run main function
main "$@"