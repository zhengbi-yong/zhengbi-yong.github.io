#!/bin/bash

# Quick start script for the blog backend
# This script helps you get the backend running quickly

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Blog Backend Quick Start${NC}"
echo "=============================="
echo

# Source cargo env
source ~/.cargo/env 2>/dev/null || true

echo -e "${YELLOW}Checking Rust...${NC}"
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: Rust is not installed. Please install Rust first.${NC}"
    exit 1
fi
echo -e "${GREEN}Rust is installed${NC}"

echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL is not installed. You can:${NC}"
    echo "  1. Install it locally: sudo apt install postgresql postgresql-contrib"
    echo "  2. Or use Docker after fixing permissions"
    echo
    echo -e "${YELLOW}Trying to use Docker (with sudo)...${NC}"
    if sudo docker compose up -d; then
        echo -e "${GREEN}Docker containers started successfully${NC}"
    else
        echo -e "${RED}Failed to start Docker containers${NC}"
        echo -e "${YELLOW}Please install PostgreSQL locally or fix Docker permissions${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}PostgreSQL is installed${NC}"
fi

echo
echo -e "${YELLOW}Please choose how to run the migrations:${NC}"
echo "1. Use Docker (requires sudo)"
echo "2. Use local PostgreSQL"
echo "3. Skip migrations and run with SQLX_OFFLINE=true"
echo
read -p "Enter your choice (1/2/3): " choice

case $choice in
    1)
        echo -e "${YELLOW}Running migrations with Docker...${NC}"
        sudo docker compose exec -T postgres psql -U blog_user -d blog_db < /dev/null 2>/dev/null || echo "Database will be created on first run"
        ;;
    2)
        echo -e "${YELLOW}Running migrations on local PostgreSQL...${NC}"
        # You'll need to manually create the database if it doesn't exist
        echo -e "${YELLOW}Make sure your local PostgreSQL is running and configured${NC}"
        echo -e "${YELLOW}Run: sudo -u postgres createdb blog_db${NC}"
        echo -e "${YELLOW}Run: sudo -u postgres createuser blog_user${NC}"
        echo -e "${YELLOW}Run: sudo -u postgres psql -c \"ALTER USER blog_user PASSWORD 'blog_password'\"${NC}"
        echo -e "${YELLOW}Run: sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user\"${NC}"
        ;;
    3)
        export SQLX_OFFLINE=true
        echo -e "${YELLOW}Running with offline mode (no database connection needed for compilation)${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo
echo -e "${YELLOW}Building the project...${NC}"
cargo check

echo
echo -e "${GREEN}Build successful!${NC}"
echo
echo -e "${YELLOW}To run the server:${NC}"
echo "  cargo run"
echo
echo -e "${YELLOW}To run with hot reload:${NC}"
echo "  cargo install cargo-watch"
echo "  cargo watch -x run"
echo
echo -e "${YELLOW}API Documentation:${NC}"
echo "  http://localhost:3000/swagger-ui/"
echo
echo -e "${YELLOW}Health check:${NC}"
echo "  http://localhost:3000/healthz"
echo
echo -e "${YELLOW}Note: If you get database connection errors,${NC}"
echo -e "${YELLOW}make sure your DATABASE_URL in .env is correct.${NC}"
echo
echo -e "${YELLOW}For Docker issues, you may need to:${NC}"
echo "  1. Log out and log back in (for docker group permissions)"
echo "  2. Or run: newgrp docker"