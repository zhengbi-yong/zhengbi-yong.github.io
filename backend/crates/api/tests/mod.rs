//! 测试模块
//!
//! 测试文件索引：
//! - integration_tests: 集成测试
//! - security_tests: 安全性测试
//! - stress_tests: 压力测试
//! - extreme_stress_tests: 极端压力测试
//! - data_consistency_tests: 数据一致性测试
//! - chaos_engineering_tests: 混沌工程测试
//! - fuzzing_tests: 模糊测试
//! - performance_benchmarks: 性能基准测试
//! - security: 增强的安全测试
//! - helpers: 测试辅助模块
//! - unit: 单元测试模块

mod chaos_engineering_tests;
mod data_consistency_tests;
mod extreme_stress_tests;
mod fuzzing_tests;
mod integration_tests;
mod performance_benchmarks;
mod security_tests;
mod stress_tests;

// 测试辅助模块
mod e2e;
mod helpers;
mod security;
mod unit;
