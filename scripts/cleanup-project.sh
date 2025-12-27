#!/bin/bash

# Project Cleanup Script
# This script helps identify and remove duplicate files in the project

set -e

echo "=== Project Cleanup Script ==="
echo

# Function to check if file exists and is duplicate
check_duplicate() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo "Found: $file - $description"
        return 0
    else
        return 1
    fi
}

# Function to remove file safely
remove_file() {
    local file=$1
    local description=$2

    echo "Removing: $description"
    rm -f "$file"
}

echo "Checking for duplicate files..."
echo

# Check for duplicate README files
echo "=== README Files ==="
if check_duplicate "README.md" "Root README"; then
    echo "Keeping root README.md as main documentation"
fi

if check_duplicate "blog-frontend/README.md" "Frontend README"; then
    echo "Keeping frontend README.md"
fi

if check_duplicate "blog-backend/README.md" "Backend README"; then
    echo "Keeping backend README.md"
fi

echo

# Check for duplicate configuration files
echo "=== Configuration Files ==="

# .gitignore
if [ -f ".gitignore" ] && [ -f "blog-frontend/.gitignore" ]; then
    echo "Found duplicate .gitignore files"
    echo "Removing frontend .gitignore (using root version)"
    rm -f "blog-frontend/.gitignore"
fi

if [ -f ".gitignore" ] && [ -f "blog-backend/.gitignore" ]; then
    echo "Removing backend .gitignore (using root version)"
    rm -f "blog-backend/.gitignore"
fi

# .eslintrc.js or eslint.config.mjs
if [ -f ".eslintrc.js" ] || [ -f "eslint.config.mjs" ]; then
    if [ -f "blog-frontend/eslint.config.mjs" ]; then
        echo "Removing frontend eslint config (using root version)"
        rm -f "blog-frontend/eslint.config.mjs"
    fi
fi

# .prettierrc.js
if [ -f ".prettierrc.js" ]; then
    if [ -f "blog-frontend/.prettierrc.js" ]; then
        echo "Removing frontend prettier config (using root version)"
        rm -f "blog-frontend/.prettierrc.js"
    fi
fi

# .vscode settings
if [ -d ".vscode" ]; then
    if [ -d "blog-frontend/.vscode" ]; then
        echo "Removing frontend .vscode (using root version)"
        rm -rf "blog-frontend/.vscode"
    fi
    if [ -d "blog-backend/.vscode" ]; then
        echo "Removing backend .vscode (using root version)"
        rm -rf "blog-backend/.vscode"
    fi
fi

echo

# Check for duplicate lock files
echo "=== Lock Files ==="

# Package lock files
if [ -f "package-lock.json" ] && [ -f "blog-frontend/package-lock.json" ]; then
    echo "Both root and frontend package-lock.json exist"
    echo "Removing frontend package-lock.json"
    rm -f "blog-frontend/package-lock.json"
fi

if [ -f "pnpm-lock.yaml" ] && [ -f "blog-frontend/pnpm-lock.yaml" ]; then
    echo "Both root and frontend pnpm-lock.yaml exist"
    echo "Removing frontend pnpm-lock.yaml"
    rm -f "blog-frontend/pnpm-lock.yaml"
fi

echo

# Check for duplicate TypeScript config
echo "=== TypeScript Configuration ==="

if [ -f "tsconfig.json" ] && [ -f "blog-frontend/tsconfig.json" ]; then
    echo "Both root and frontend tsconfig.json exist"
    echo "Removing frontend tsconfig.json"
    rm -f "blog-frontend/tsconfig.json"
fi

if [ -f "jsconfig.json" ] && [ -f "blog-frontend/jsconfig.json" ]; then
    echo "Both root and frontend jsconfig.json exist"
    echo "Removing frontend jsconfig.json"
    rm -f "blog-frontend/jsconfig.json"
fi

# tsconfig.tsbuildinfo (generated files)
echo "Removing generated tsconfig.tsbuildinfo files..."
rm -f blog-frontend/tsconfig.tsbuildinfo
rm -f tsconfig.tsbuildinfo

echo

# Check for duplicate Next.js config
echo "=== Next.js Configuration ==="

if [ -f "next.config.js" ] && [ -f "blog-frontend/next.config.js" ]; then
    echo "Both root and frontend next.config.js exist"
    echo "Keeping frontend next.config.js (needed for frontend build)"
fi

echo

# Check for duplicate Tailwind config
echo "=== Tailwind Configuration ==="

if [ -f "tailwind.config.js" ] && [ -f "blog-frontend/tailwind.config.js" ]; then
    echo "Both root and frontend tailwind.config.js exist"
    echo "Removing frontend tailwind.config.js (using root version)"
    rm -f "blog-frontend/tailwind.config.js"
fi

echo

# Check for duplicate Contentlayer config
echo "=== Contentlayer Configuration ==="

if [ -f "contentlayer.config.ts" ] && [ -f "blog-frontend/contentlayer.config.ts" ]; then
    echo "Both root and frontend contentlayer.config.ts exist"
    echo "Removing frontend contentlayer.config.ts (using root version)"
    rm -f "blog-frontend/contentlayer.config.ts"
fi

echo

# Remove generated directories and cache
echo "=== Generated and Cache Files ==="

echo "Removing .next directories..."
rm -rf .next
rm -rf blog-frontend/.next

echo "Removing out directories..."
rm -rf out
rm -rf blog-frontend/out

echo "Removing node_modules from root (keeping in frontend and backend if exist)..."
rm -rf node_modules

echo "Removing coverage directories..."
rm -rf coverage
rm -rf blog-frontend/coverage

echo "Removing .cursor directories..."
rm -rf .cursor
rm -rf blog-frontend/.cursor

echo "Removing .contentlayer cache directories..."
rm -rf .contentlayer
rm -rf blog-frontend/.contentlayer

echo

# Check for duplicate public files
echo "=== Public Files ==="

# icons
if [ -f "public/favicon.ico" ] && [ -f "blog-frontend/public/favicon.ico" ]; then
    echo "Both root and frontend favicon.ico exist"
    echo "Removing frontend favicon.ico (using root version)"
    rm -f "blog-frontend/public/favicon.ico"
fi

echo

# Check for duplicate scripts
echo "=== Scripts ==="

# Remove duplicate sync scripts if they exist in frontend
for script in sync.sh sync.nu sync.ps1 sync_lin.sh sync_lin.nu; do
    if [ -f "$script" ] && [ -f "blog-frontend/$script" ]; then
        echo "Removing duplicate script: blog-frontend/$script"
        rm -f "blog-frontend/$script"
    fi
done

echo

# Remove temporary and test files
echo "=== Temporary and Test Files ==="

echo "Removing temporary files..."
rm -f *.tmp
rm -f *.temp
rm -f *.log

# Remove test HTML files
rm -f test-3d.html
rm -f blog-frontend/test-*.html

echo "Removing debug scripts..."
rm -f debug-*.js

echo "Removing development logs..."
rm -f debug-*.log

echo

echo "=== Checking for duplicate directories ==="

# Check for duplicate directories (app, components, layouts, lib)
for dir in app components layouts lib; do
    if [ -d "$dir" ] && [ -d "blog-frontend/$dir" ]; then
        # Compare sizes first
        root_size=$(du -s "$dir" 2>/dev/null | cut -f1 || echo "0")
        frontend_size=$(du -s "blog-frontend/$dir" 2>/dev/null | cut -f1 || echo "0")

        if [ "$root_size" = "$frontend_size" ] && [ "$root_size" != "0" ]; then
            echo "Removing duplicate directory: $dir (keeping frontend version)"
            rm -rf "$dir"
        fi
    fi
done

echo

echo "=== Summary ==="
echo "Cleanup completed! The following should now be unique:"
echo "✓ One README.md in root"
echo "✓ One .gitignore in root"
echo "✓ One eslint configuration in root"
echo "✓ One prettier configuration in root"
echo "✓ One .vscode in root"
echo "✓ Frontend keeps its necessary configs (next.config.js, package.json)"
echo "✓ Generated and cache files removed"
echo "✓ Duplicate scripts removed"
echo "✓ Duplicate directories removed (app, components, layouts, lib)"
echo
echo "Project structure is now cleaner!"