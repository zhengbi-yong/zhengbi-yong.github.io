#!/bin/bash

# Blog Backend Setup Script
# This script automates the setup process for the blog backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Run it as a regular user."
    exit 1
fi

# Check OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get >/dev/null 2>&1; then
            DISTRO="debian"
        elif command -v yum >/dev/null 2>&1; then
            DISTRO="rhel"
        elif command -v pacman >/dev/null 2>&1; then
            DISTRO="arch"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
    print_status "Detected OS: $OS ($DISTRO)"
}

# Install Rust
install_rust() {
    if command -v rustc >/dev/null 2>&1; then
        print_success "Rust is already installed"
        rustc --version
    else
        print_status "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
        print_success "Rust installed successfully"
    fi
}

# Install Docker
install_docker() {
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker is already installed"
        docker --version
    else
        print_status "Installing Docker..."
        if [[ "$DISTRO" == "debian" ]]; then
            # Update package index
            sudo apt-get update

            # Install packages to allow apt to use a repository over HTTPS
            sudo apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release

            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

            # Set up stable repository
            echo \
                "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        else
            print_error "Please install Docker manually for your distribution"
            exit 1
        fi

        # Start and enable Docker
        sudo systemctl start docker
        sudo systemctl enable docker

        # Add user to docker group
        print_warning "Adding user to docker group. You may need to log out and log back in."
        sudo usermod -aG docker $USER

        print_success "Docker installed successfully"
    fi
}

# Create environment file
create_env_file() {
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration (generate a secure secret)
JWT_SECRET=$(openssl rand -base64 64)

# Server Configuration
HOST=127.0.0.1
PORT=3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Environment
RUST_LOG=info
ENVIRONMENT=development

# Security
PASSWORD_PEPPER=$(openssl rand -base64 32)
CORS_ORIGIN=http://localhost:3000
EOF
        print_success ".env file created with random secrets"
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Start database services
start_databases() {
    print_status "Starting database services with Docker..."

    # Check if Docker is installed
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running."
        print_warning "Please start Docker with: sudo service docker start"
        print_warning "Or use local PostgreSQL/Redis installation instead."

        # Offer to continue with local databases
        read -p "Do you want to continue with local database setup? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            start_local_databases
            return
        else
            exit 1
        fi
    fi

    # Start containers
    docker compose up -d

    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    sleep 5

    # Check if PostgreSQL is ready
    for i in {1..30}; do
        if docker exec blog-postgres pg_isready -U blog_user -d blog_db >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        sleep 1
    done

    # Check if Redis is ready
    for i in {1..30}; do
        if docker exec blog-redis redis-cli ping >/dev/null 2>&1; then
            print_success "Redis is ready"
            break
        fi
        sleep 1
    done
}

# Install SQLx CLI
install_sqlx_cli() {
    if command -v sqlx >/dev/null 2>&1; then
        print_success "SQLx CLI is already installed"
    else
        print_status "Installing SQLx CLI..."
        cargo install sqlx-cli --no-default-features --features rustls,postgres
        print_success "SQLx CLI installed successfully"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    if sqlx migrate run; then
        print_success "Migrations completed successfully"
    else
        print_error "Failed to run migrations"
        exit 1
    fi
}

# Prepare SQLx queries for offline compilation
prepare_sqlx() {
    print_status "Preparing SQLx queries for offline compilation..."
    if cargo sqlx prepare; then
        print_success "SQLx queries prepared successfully"
    else
        print_warning "Failed to prepare SQLx queries. You may need to run with SQLX_OFFLINE=true"
    fi
}

# Build the project
build_project() {
    print_status "Building the project..."
    if cargo build; then
        print_success "Project built successfully"
    else
        print_error "Failed to build project"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if cargo test; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed"
    fi
}

# Start local database services
start_local_databases() {
    print_status "Setting up local PostgreSQL and Redis..."

    # Check if PostgreSQL is installed
    if ! command -v psql >/dev/null 2>&1; then
        print_error "PostgreSQL is not installed."
        print_warning "Please install PostgreSQL: sudo apt install postgresql postgresql-contrib"
        exit 1
    fi

    # Check if Redis is installed
    if ! command -v redis-cli >/dev/null 2>&1; then
        print_error "Redis is not installed."
        print_warning "Please install Redis: sudo apt install redis-server"
        exit 1
    fi

    # Start services if not running
    print_status "Starting PostgreSQL..."
    sudo systemctl start postgresql || sudo service postgresql start

    print_status "Starting Redis..."
    sudo systemctl start redis-server || sudo service redis-server start

    # Create database and user
    print_status "Creating database and user..."
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw blog_db; then
        sudo -u postgres createdb blog_db
        print_success "Database 'blog_db' created"
    else
        print_status "Database 'blog_db' already exists"
    fi

    # Check if user exists
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='blog_user'" | grep -q 1; then
        sudo -u postgres createuser blog_user
        sudo -u postgres psql -c "ALTER USER blog_user PASSWORD 'blog_password';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;"
        print_success "User 'blog_user' created"
    else
        print_status "User 'blog_user' already exists"
    fi
}

# Main setup function
main() {
    echo "========================================"
    echo "  Blog Backend Setup Script"
    echo "========================================"
    echo

    detect_os
    install_rust
    install_docker
    create_env_file

    # Source cargo env
    source ~/.cargo/env 2>/dev/null || true

    install_sqlx_cli
    start_databases
    run_migrations
    prepare_sqlx
    build_project
    run_tests

    echo
    echo "========================================"
    print_success "Setup completed successfully!"
    echo "========================================"
    echo
    echo "To run the server:"
    echo "  cargo run"
    echo
    echo "To run with hot reload:"
    echo "  cargo install cargo-watch"
    echo "  cargo watch -x run"
    echo
    echo "API Documentation will be available at:"
    echo "  http://localhost:3000/swagger-ui/"
    echo
    echo "Health check endpoint:"
    echo "  http://localhost:3000/healthz"
    echo
    print_warning "Remember to:"
    echo "  1. Update the .env file with your actual configuration"
    echo "  2. Set up proper CORS origins for production"
    echo "  3. Configure email settings if needed"
}

# Run main function
main