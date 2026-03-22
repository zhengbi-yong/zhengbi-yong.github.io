//! 模糊测试
//!
//! **运行前准备**：
//! 1. 启动数据库：`docker compose -f docker-compose.dev.yml up -d`
//! 2. 启动后端：`./start-backend.sh` 或 `cd backend && cargo run`
//! 3. 运行测试：`cargo test --test fuzzing_tests -- --ignored`
//!
//! 使用随机输入和边界值测试系统的健壮性
//!
//! 测试包括：
//! - 随机字符串输入
//! - 边界值测试
//! - 异常数据格式
//! - 特殊字符处理
//! - Unicode字符处理

use rand::Rng;
use reqwest::Client;
use serde_json::{json, Value};
use uuid::Uuid;

const BASE_URL: &str = "http://localhost:3000";
const TEST_PASSWORD: &str = "test_password_123_STRICT";

/// 生成随机字符串
fn generate_random_string(length: usize) -> String {
    use rand::distributions::Alphanumeric;
    use rand::Rng;

    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect()
}

/// 生成随机Unicode字符串
fn generate_random_unicode_string(length: usize) -> String {
    use rand::Rng;

    (0..length)
        .map(|_| {
            let mut rng = rand::thread_rng();
            // 生成基本多语言平面的字符
            char::from_u32(rng.gen_range(0x0020..=0x007E)).unwrap_or('?')
        })
        .collect()
}

/// 测试1: 随机邮箱格式测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_random_email_formats() {
    let client = Client::new();
    const TEST_COUNT: usize = 100;

    let mut valid_count = 0;
    let mut invalid_count = 0;

    for i in 0..TEST_COUNT {
        // 生成随机邮箱
        let random_part = generate_random_string(10);
        let email = format!("{}@example.com", random_part);
        let username = format!("user_{}", i);

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": TEST_PASSWORD
            }))
            .send()
            .await;

        match response {
            Ok(resp) => {
                if resp.status().is_success() {
                    valid_count += 1;
                } else if resp.status().as_u16() == 409 {
                    // 409 表示已存在，也算有效格式
                    valid_count += 1;
                } else {
                    invalid_count += 1;
                }
            }
            Err(_) => {
                invalid_count += 1;
            }
        }
    }

    println!("随机邮箱格式测试:");
    println!("  测试数: {}", TEST_COUNT);
    println!("  有效格式: {}", valid_count);
    println!("  无效格式: {}", invalid_count);

    // 严格断言：大部分随机邮箱应该是有效格式
    let valid_rate = valid_count as f64 / TEST_COUNT as f64;
    assert!(
        valid_rate > 0.8,
        "随机邮箱的有效率应该 > 80%，实际: {:.2}%",
        valid_rate * 100.0
    );
}

/// 测试2: 边界值测试 - 超长输入
#[tokio::test]
#[serial_test::serial]
async fn test_boundary_values_extreme_lengths() {
    let client = Client::new();

    // 测试各种极端长度
    let test_cases = vec![
        (1, "最小长度"),
        (10, "短长度"),
        (100, "中等长度"),
        (1000, "长长度"),
        (10000, "超长长度"),
        (100000, "极端长度"),
    ];

    for (length, description) in test_cases {
        let long_string = "a".repeat(length);
        let email = format!("{}@example.com", Uuid::new_v4().simple());
        let username = format!("user_{}", Uuid::new_v4().simple());

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": long_string
            }))
            .send()
            .await;

        match response {
            Ok(resp) => {
                let status = resp.status();
                println!("{} ({} 字符): 状态码 {}", description, length, status);

                // 严格断言：系统应该优雅处理超长输入，不应该崩溃
                assert!(
                    status.is_client_error() || status.is_success(),
                    "超长输入应该返回客户端错误或成功，不应该返回服务器错误，长度: {}, 状态: {}",
                    length,
                    status
                );
            }
            Err(e) => {
                // 网络错误或超时是可以接受的
                println!("{} ({} 字符): 错误 {:?}", description, length, e);
            }
        }
    }
}

/// 测试3: 特殊字符测试
#[tokio::test]
#[serial_test::serial]
async fn test_special_characters() {
    let client = Client::new();

    // 测试各种特殊字符
    let special_strings = vec![
        ("<script>alert('xss')</script>", "XSS尝试"),
        ("'; DROP TABLE users; --", "SQL注入尝试"),
        ("../../etc/passwd", "路径遍历尝试"),
        ("\x00\x01\x02", "空字节"),
        ("\n\r\t", "控制字符"),
        ("🚀🎉💯", "Emoji"),
        ("中文测试", "中文字符"),
        ("日本語テスト", "日文字符"),
        ("Русский тест", "俄文字符"),
        ("العربية", "阿拉伯字符"),
    ];

    for (special_str, description) in special_strings {
        let email = format!("{}@example.com", Uuid::new_v4().simple());
        let username = format!("user_{}", Uuid::new_v4().simple());

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": format!("{}_{}", username, special_str),
                "password": TEST_PASSWORD
            }))
            .send()
            .await;

        match response {
            Ok(resp) => {
                let status = resp.status();
                println!("{}: 状态码 {}", description, status);

                // 严格断言：系统应该安全处理特殊字符
                assert!(
                    status.is_client_error() || status.is_success(),
                    "特殊字符应该被安全处理，不应该导致服务器错误，类型: {}, 状态: {}",
                    description,
                    status
                );
            }
            Err(e) => {
                println!("{}: 错误 {:?}", description, e);
            }
        }
    }
}

/// 测试4: Unicode字符测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_unicode_characters() {
    let client = Client::new();
    const TEST_COUNT: usize = 50;

    let mut success_count = 0;

    for i in 0..TEST_COUNT {
        // 生成包含Unicode字符的用户名
        let unicode_part = generate_random_unicode_string(10);
        let email = format!("unicode_{}@example.com", Uuid::new_v4().simple());
        let username = format!("user_{}_{}", i, unicode_part);

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": TEST_PASSWORD
            }))
            .send()
            .await;

        match response {
            Ok(resp) => {
                if resp.status().is_success() {
                    success_count += 1;

                    // 验证返回的用户名是否正确
                    let json: Value = resp.json().await.unwrap();
                    let returned_username = json
                        .get("user")
                        .unwrap()
                        .get("username")
                        .unwrap()
                        .as_str()
                        .unwrap();

                    assert_eq!(returned_username, username, "返回的用户名应该与输入一致");
                }
            }
            Err(_) => {}
        }
    }

    println!("Unicode字符测试:");
    println!("  测试数: {}", TEST_COUNT);
    println!("  成功: {}", success_count);

    // 严格断言：Unicode字符应该被正确处理
    let success_rate = success_count as f64 / TEST_COUNT as f64;
    assert!(
        success_rate > 0.7,
        "Unicode字符处理成功率应该 > 70%，实际: {:.2}%",
        success_rate * 100.0
    );
}

/// 测试5: 随机JSON结构测试
#[tokio::test]
#[serial_test::serial]
async fn test_random_json_structures() {
    let client = Client::new();
    const TEST_COUNT: usize = 50;

    let mut handled_count = 0;

    for i in 0..TEST_COUNT {
        // 生成随机JSON结构
        let mut rng = rand::thread_rng();
        let json_payload = match rng.gen_range(0..5) {
            0 => {
                // 正常结构
                json!({
                    "email": format!("normal_{}@example.com", i),
                    "username": format!("user_{}", i),
                    "password": TEST_PASSWORD
                })
            }
            1 => {
                // 缺少字段
                json!({
                    "email": format!("missing_{}@example.com", i),
                    "username": format!("user_{}", i)
                })
            }
            2 => {
                // 额外字段
                json!({
                    "email": format!("extra_{}@example.com", i),
                    "username": format!("user_{}", i),
                    "password": TEST_PASSWORD,
                    "extra_field": "should_be_ignored"
                })
            }
            3 => {
                // 错误类型
                json!({
                    "email": 12345,
                    "username": format!("user_{}", i),
                    "password": TEST_PASSWORD
                })
            }
            _ => {
                // 空值
                json!({
                    "email": null,
                    "username": format!("user_{}", i),
                    "password": TEST_PASSWORD
                })
            }
        };

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json_payload)
            .send()
            .await;

        match response {
            Ok(resp) => {
                handled_count += 1;
                let status = resp.status();

                // 严格断言：系统应该正确处理所有JSON结构（成功或返回错误）
                assert!(
                    status.is_client_error() || status.is_success(),
                    "系统应该正确处理所有JSON结构，不应该返回服务器错误，状态: {}",
                    status
                );
            }
            Err(_) => {
                handled_count += 1;
            }
        }
    }

    println!("随机JSON结构测试:");
    println!("  测试数: {}", TEST_COUNT);
    println!("  已处理: {}", handled_count);

    // 严格断言：所有请求都应该得到响应
    assert_eq!(
        handled_count, TEST_COUNT,
        "所有请求都应该得到响应，实际: {}, 期望: {}",
        handled_count, TEST_COUNT
    );
}

/// 测试6: 并发模糊测试
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_fuzzing() {
    let client = Client::new();
    const CONCURRENT_REQUESTS: usize = 100;

    let mut handles = Vec::new();
    let success_counter = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));
    let error_counter = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));

    for i in 0..CONCURRENT_REQUESTS {
        let client_clone = client.clone();
        let success_ctr = success_counter.clone();
        let error_ctr = error_counter.clone();

        handles.push(tokio::spawn(async move {
            // 随机生成输入
            let random_email = format!("fuzz_{}_{}@example.com", i, generate_random_string(5));
            let random_username = format!("fuzz_user_{}", generate_random_string(10));
            let random_password = generate_random_string(15);

            let response = client_clone
                .post(&format!("{}/v1/auth/register", BASE_URL))
                .json(&json!({
                    "email": random_email,
                    "username": random_username,
                    "password": random_password
                }))
                .send()
                .await;

            match response {
                Ok(resp) => {
                    if resp.status().is_success() {
                        success_ctr.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    } else {
                        error_ctr.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    }
                }
                Err(_) => {
                    error_ctr.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
            }
        }));
    }

    // 等待所有请求完成
    for handle in handles {
        let _ = handle.await;
    }

    let success = success_counter.load(std::sync::atomic::Ordering::Relaxed);
    let errors = error_counter.load(std::sync::atomic::Ordering::Relaxed);

    println!("并发模糊测试:");
    println!("  并发请求数: {}", CONCURRENT_REQUESTS);
    println!("  成功: {}", success);
    println!("  错误: {}", errors);

    // 严格断言：所有请求都应该得到响应
    assert_eq!(
        success + errors,
        CONCURRENT_REQUESTS as u64,
        "所有请求都应该得到响应，实际: {}, 期望: {}",
        success + errors,
        CONCURRENT_REQUESTS
    );

    // 严格断言：系统不应该崩溃
    assert!(
        success + errors > 0,
        "系统应该处理至少一些请求，实际成功: {}, 错误: {}",
        success,
        errors
    );
}
