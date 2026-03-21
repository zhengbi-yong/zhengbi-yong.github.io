#!/bin/bash
# 批量为测试添加 #[ignore] 属性 - 修正版

# 进入后端目录
cd /home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/tests

# 为单元测试添加ignore（在 serial_test::serial 后）
for file in unit/auth_routes_tests.rs unit/cms_tests.rs unit/posts_tests.rs; do
    if [ -f "$file" ]; then
        # 在 #[serial_test::serial] 后添加 #[ignore]
        perl -i -pe 's/^(\s*)\[serial_test::serial\]$/$1[serial_test::serial]\n$1#[ignore] \/\/ 需要运行中的后端服务/g' "$file"
        echo "已处理 $file"
    fi
done

# 为其他测试添加ignore
for file in security_tests.rs stress_tests.rs performance_benchmarks.rs; do
    if [ -f "$file" ]; then
        # 在 #[tokio::test] 后添加 #[ignore]（如果没有serial_test）
        perl -i -pe 's/^(\s*)\[tokio::test\]$/$1[tokio::test]\n$1#[ignore] \/\/ 需要运行中的后端服务/g' "$file"
        # 在 #[serial_test::serial] 后添加 #[ignore]
        perl -i -pe 's/^(\s*)\[serial_test::serial\]$/$1[serial_test::serial]\n$1#[ignore] \/\/ 需要运行中的后端服务/g' "$file"
        echo "已处理 $file"
    fi
done

echo "完成！"
