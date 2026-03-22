//! 测试模块
//!
//! 包含所有测试文件：
//! - integration_tests: 集成测试
//! - security_tests: 安全性测试
//! - stress_tests: 压力测试
//! - extreme_stress_tests: 极端压力测试
//! - data_consistency_tests: 数据一致性测试
//! - chaos_engineering_tests: 混沌工程测试
//! - fuzzing_tests: 模糊测试
//! - performance_benchmarks: 性能基准测试
//! - api_features_tests: API 功能测试（新增）
//! - unit: 单元测试（新增）
//! - security: 增强的安全测试（新增）
//! - e2e: 端到端测试（新增）
//! - helpers: 测试辅助模块（新增）

mod chaos_engineering_tests;
mod data_consistency_tests;
mod extreme_stress_tests;
mod fuzzing_tests;
mod integration_tests;
mod performance_benchmarks;
mod security_tests;
mod stress_tests;

// 新增测试模块
mod api_features_tests;
mod e2e;
mod helpers;
mod security;
mod unit;
