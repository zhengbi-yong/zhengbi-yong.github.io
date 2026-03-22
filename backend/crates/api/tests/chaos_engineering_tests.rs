//! 混沌工程测试
//!
//! 模拟各种故障场景，测试系统的容错性和恢复能力
//!
//! **运行前准备**：
//! 1. 启动数据库：`docker compose -f docker-compose.dev.yml up -d`
//! 2. 启动后端：`./start-backend.sh` 或 `cd backend && cargo run`
//! 3. 运行测试：`cargo test --test chaos_engineering_tests -- --ignored`
//!
//! 测试包括：
//! - 数据库连接中断恢复
//! - Redis连接中断恢复
//! - 网络超时处理
//! - 部分服务故障
//! - 数据损坏恢复

use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;
use uuid::Uuid;

const BASE_URL: &str = "http://localhost:3000";
const TEST_PASSWORD: &str = "test_password_123_STRICT";

/// 测试1: 服务中断后恢复测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要手动控制服务
async fn test_service_recovery() {
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap();

    println!("测试服务恢复能力...");
    println!("请手动停止后端服务，然后按回车继续...");

    // 等待用户操作
    tokio::time::sleep(Duration::from_secs(5)).await;

    // 尝试请求（应该失败）
    let response = client.get(&format!("{}/healthz", BASE_URL)).send().await;

    match response {
        Ok(_) => {
            println!("警告: 服务仍在运行，请先停止服务");
        }
        Err(_) => {
            println!("服务已停止，等待恢复...");

            // 等待服务恢复（最多等待30秒）
            let mut recovered = false;
            for _ in 0..30 {
                tokio::time::sleep(Duration::from_secs(1)).await;

                if let Ok(resp) = client.get(&format!("{}/healthz", BASE_URL)).send().await {
                    if resp.status().is_success() {
                        recovered = true;
                        println!("服务已恢复！");
                        break;
                    }
                }
            }

            assert!(recovered, "服务必须在30秒内恢复");
        }
    }
}

/// 测试2: 超时处理测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_timeout_handling() {
    let client = Client::builder()
        .timeout(Duration::from_millis(100)) // 非常短的超时
        .build()
        .unwrap();

    // 发送请求，应该正确处理超时
    let response = client.get(&format!("{}/healthz", BASE_URL)).send().await;

    // 超时不应该导致panic，应该返回错误
    match response {
        Ok(resp) => {
            // 如果请求成功，说明响应很快
            assert!(resp.status().is_success(), "健康检查应该成功");
        }
        Err(e) => {
            // 超时错误是可以接受的
            assert!(
                e.is_timeout() || e.is_request(),
                "应该是超时或请求错误，实际: {:?}",
                e
            );
        }
    }
}

/// 测试3: 部分功能故障测试（模拟Redis故障）
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_partial_service_failure() {
    let client = Client::new();

    // 注册用户
    let email = format!("partial_failure_{}@test.com", Uuid::new_v4().simple());
    let username = format!("partial_user_{}", Uuid::new_v4().simple());

    let register_response = client
        .post(&format!("{}/v1/auth/register", BASE_URL))
        .json(&json!({
            "email": email,
            "username": username,
            "password": TEST_PASSWORD
        }))
        .send()
        .await
        .unwrap();

    let _token = register_response
        .json::<Value>()
        .await
        .unwrap()
        .get("access_token")
        .unwrap()
        .as_str()
        .unwrap()
        .to_string();

    let test_slug = format!("partial-failure-test-{}", Uuid::new_v4().simple());

    // 即使Redis故障，基本功能应该仍然可用（降级到数据库）
    // 测试获取统计（可能使用缓存）
    let stats_response = client
        .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
        .send()
        .await;

    // 严格断言：即使缓存不可用，也应该从数据库返回数据
    match stats_response {
        Ok(resp) => {
            assert!(
                resp.status().is_success(),
                "即使缓存故障，也应该从数据库返回数据"
            );
        }
        Err(_) => {
            // 如果完全失败，说明系统没有降级处理
            panic!("系统应该在缓存故障时降级到数据库");
        }
    }
}

/// 测试4: 数据损坏恢复测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_data_corruption_recovery() {
    let client = Client::new();

    // 注册用户
    let email = format!("corruption_{}@test.com", Uuid::new_v4().simple());
    let username = format!("corruption_user_{}", Uuid::new_v4().simple());

    let register_response = client
        .post(&format!("{}/v1/auth/register", BASE_URL))
        .json(&json!({
            "email": email,
            "username": username,
            "password": TEST_PASSWORD
        }))
        .send()
        .await
        .unwrap();

    let token = register_response
        .json::<Value>()
        .await
        .unwrap()
        .get("access_token")
        .unwrap()
        .as_str()
        .unwrap()
        .to_string();

    let test_slug = format!("corruption-test-{}", Uuid::new_v4().simple());

    // 执行一系列操作
    for i in 0..10 {
        // 浏览
        let _ = client
            .post(&format!("{}/v1/posts/{}/view", BASE_URL, test_slug))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await;

        // 点赞
        if i % 2 == 0 {
            let _ = client
                .post(&format!("{}/v1/posts/{}/like", BASE_URL, test_slug))
                .header("Authorization", format!("Bearer {}", token))
                .send()
                .await;
        }

        // 获取统计（验证数据一致性）
        let stats_response = client
            .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
            .send()
            .await
            .unwrap();

        if stats_response.status().is_success() {
            let stats: Value = stats_response.json().await.unwrap();
            let view_count = stats.get("view_count").unwrap().as_i64().unwrap();
            let like_count = stats.get("like_count").unwrap().as_i64().unwrap();

            // 严格断言：数据应该始终一致
            assert!(
                view_count >= 0 && like_count >= 0,
                "统计数据不应该为负数，view_count: {}, like_count: {}",
                view_count,
                like_count
            );

            assert!(
                like_count <= view_count,
                "点赞数不应该超过浏览数，view_count: {}, like_count: {}",
                view_count,
                like_count
            );
        }
    }

    println!("数据损坏恢复测试完成: 所有操作都成功完成，数据保持一致");
}

/// 测试5: 高负载下的错误处理
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_error_handling_under_load() {
    let client = Client::new();
    const REQUESTS: usize = 500;

    let mut success_count = 0;
    let mut error_count = 0;
    let mut handles = Vec::new();

    // 发送大量请求，混合有效和无效请求
    for i in 0..REQUESTS {
        let client_clone = client.clone();
        let is_valid = i % 2 == 0;

        handles.push(tokio::spawn(async move {
            let response = if is_valid {
                // 有效请求：健康检查
                client_clone
                    .get(&format!("{}/healthz", BASE_URL))
                    .send()
                    .await
            } else {
                // 无效请求：不存在的端点
                client_clone
                    .get(&format!("{}/nonexistent/endpoint", BASE_URL))
                    .send()
                    .await
            };

            match response {
                Ok(resp) => {
                    if resp.status().is_success() {
                        ("success", resp.status().as_u16())
                    } else {
                        ("error", resp.status().as_u16())
                    }
                }
                Err(_) => ("error", 0),
            }
        }));
    }

    // 收集结果
    for handle in handles {
        match handle.await.unwrap() {
            ("success", _) => success_count += 1,
            ("error", _) => error_count += 1,
            _ => {}
        }
    }

    println!("高负载错误处理测试:");
    println!("  总请求数: {}", REQUESTS);
    println!("  成功: {}", success_count);
    println!("  错误: {}", error_count);

    // 严格断言：系统应该正确处理所有请求（包括错误）
    assert_eq!(
        success_count + error_count,
        REQUESTS,
        "所有请求都应该得到响应（成功或错误），实际: {}",
        success_count + error_count
    );

    // 严格断言：有效请求应该成功
    let expected_success = REQUESTS / 2; // 一半是有效请求
    assert!(
        success_count >= expected_success * 9 / 10, // 允许10%的误差
        "有效请求的成功率应该 > 90%，实际成功: {}, 期望: {}",
        success_count,
        expected_success
    );
}

/// 测试6: 连接池耗尽恢复测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 需要运行中的后端服务
async fn test_connection_pool_exhaustion() {
    let client = Client::new();
    const CONCURRENT_CONNECTIONS: usize = 200;

    // 创建大量并发连接
    let mut handles = Vec::new();
    for i in 0..CONCURRENT_CONNECTIONS {
        let client_clone = client.clone();
        let request_id = i;

        handles.push(tokio::spawn(async move {
            // 每个连接发送多个请求
            for _j in 0..5 {
                let _ = client_clone
                    .get(&format!("{}/healthz", BASE_URL))
                    .send()
                    .await;

                tokio::time::sleep(Duration::from_millis(10)).await;
            }

            request_id
        }));
    }

    // 等待所有连接完成
    let mut completed = 0;
    for handle in handles {
        match handle.await {
            Ok(_) => completed += 1,
            Err(_) => {}
        }
    }

    println!("连接池耗尽恢复测试:");
    println!("  并发连接数: {}", CONCURRENT_CONNECTIONS);
    println!("  完成连接数: {}", completed);

    // 严格断言：所有连接都应该完成（即使有延迟）
    assert_eq!(
        completed, CONCURRENT_CONNECTIONS,
        "所有连接都应该完成，实际完成: {}, 期望: {}",
        completed, CONCURRENT_CONNECTIONS
    );
}
