#!/bin/bash
# 严格测试运行脚本
# 运行所有严格测试套件

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    后端严格测试套件${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查后端服务是否运行
echo -e "${YELLOW}检查后端服务状态...${NC}"
if curl -s --max-time 5 "http://localhost:3000/healthz" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务正在运行${NC}"
else
    echo -e "${RED}✗ 后端服务未运行，请先启动后端服务${NC}"
    echo -e "${YELLOW}  运行命令: cd backend && cargo run${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}开始运行严格测试...${NC}"
echo ""

# 运行不同类型的测试
declare -a test_suites=(
    "integration_tests:集成测试"
    "security_tests:安全性测试"
    "stress_tests:压力测试"
    "data_consistency_tests:数据一致性测试"
    "performance_benchmarks:性能基准测试"
    "fuzzing_tests:模糊测试"
)

declare -a results=()

for suite_info in "${test_suites[@]}"; do
    IFS=':' read -r test_name display_name <<< "$suite_info"
    echo -e "${CYAN}运行 ${display_name}...${NC}"
    
    start_time=$(date +%s)
    
    if cargo test --test "$test_name" --release 2>&1; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${GREEN}✓ ${display_name} 通过 (耗时: ${duration}秒)${NC}"
        results+=("${display_name}:通过:${duration}")
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${RED}✗ ${display_name} 失败${NC}"
        results+=("${display_name}:失败:${duration}")
    fi
    echo ""
done

# 显示总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    测试结果总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

all_passed=true
for result in "${results[@]}"; do
    IFS=':' read -r name status duration <<< "$result"
    if [ "$status" = "通过" ]; then
        echo -e "${GREEN}${name}: ${status} (耗时: ${duration}秒)${NC}"
    else
        echo -e "${RED}${name}: ${status} (耗时: ${duration}秒)${NC}"
        all_passed=false
    fi
done

echo ""

# 极端测试提示
echo -e "${YELLOW}注意: 以下测试需要手动运行（使用 --ignored 标志）:${NC}"
echo -e "${YELLOW}  - 极端压力测试: cargo test --test extreme_stress_tests -- --ignored --release${NC}"
echo -e "${YELLOW}  - 混沌工程测试: cargo test --test chaos_engineering_tests -- --ignored --release${NC}"
echo -e "${YELLOW}  - 长时间性能测试: cargo test --test performance_benchmarks -- --ignored --release${NC}"
echo ""

if [ "$all_passed" = true ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 部分测试失败${NC}"
    exit 1
fi

