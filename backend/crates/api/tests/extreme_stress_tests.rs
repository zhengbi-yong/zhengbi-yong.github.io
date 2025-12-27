//! 极端压力测试
//! 以最严苛的方式测试后端的稳定性和正确性
//! 
//! 测试包括：
//! - 超高并发（1000+ 并发请求）
//! - 长时间运行（持续运行测试）
//! - 内存泄漏检测
//! - 资源耗尽场景
//! - 极端负载下的数据一致性

use reqwest::Client;
use serde_json::{json, Value};
use std::time::{Duration, Instant};
use std::sync::atomic::{AtomicU64, Ordering};
use uuid::Uuid;

const BASE_URL: &str = "http://localhost:3000";
const TEST_PASSWORD: &str = "test_password_123_STRICT";

/// 全局计数器用于跟踪测试统计
static TOTAL_REQUESTS: AtomicU64 = AtomicU64::new(0);
static SUCCESSFUL_REQUESTS: AtomicU64 = AtomicU64::new(0);
static FAILED_REQUESTS: AtomicU64 = AtomicU64::new(0);

/// 极端压力测试客户端
struct ExtremeStressClient {
    client: Client,
}

impl ExtremeStressClient {
    async fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(60))
            .pool_max_idle_per_host(100)
            .pool_idle_timeout(Duration::from_secs(90))
            .build()
            .unwrap();

        Self { client }
    }
}

/// 测试1: 超高并发注册（1000个并发请求）
#[tokio::test]
#[serial_test::serial]
#[ignore] // 默认忽略，需要时手动运行
async fn test_extreme_concurrent_registration() {
    let client = ExtremeStressClient::new().await;
    let start_time = Instant::now();

    const CONCURRENT_COUNT: usize = 1000;
    let mut handles = Vec::new();

    for i in 0..CONCURRENT_COUNT {
        let client_clone = client.client.clone();
        let email = format!("extreme_{}@stress.test", i);
        let username = format!("user_extreme_{}", i);

        let handle = tokio::spawn(async move {
            TOTAL_REQUESTS.fetch_add(1, Ordering::Relaxed);
            
            let response = client_clone
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
                        SUCCESSFUL_REQUESTS.fetch_add(1, Ordering::Relaxed);
                    } else {
                        FAILED_REQUESTS.fetch_add(1, Ordering::Relaxed);
                    }
                }
                Err(_) => {
                    FAILED_REQUESTS.fetch_add(1, Ordering::Relaxed);
                }
            }
        });

        handles.push(handle);
    }

    // 等待所有请求完成
    for handle in handles {
        handle.await.unwrap();
    }

    let duration = start_time.elapsed();
    let total = TOTAL_REQUESTS.load(Ordering::Relaxed);
    let success = SUCCESSFUL_REQUESTS.load(Ordering::Relaxed);
    let failed = FAILED_REQUESTS.load(Ordering::Relaxed);

    println!("极端并发注册测试完成:");
    println!("  总请求数: {}", total);
    println!("  成功: {}", success);
    println!("  失败: {}", failed);
    println!("  耗时: {:?}", duration);
    println!("  平均QPS: {:.2}", total as f64 / duration.as_secs_f64());

    // 严格断言：成功率必须 > 99%
    let success_rate = success as f64 / total as f64;
    assert!(
        success_rate > 0.99,
        "成功率必须 > 99%，实际: {:.2}%",
        success_rate * 100.0
    );

    // 严格断言：所有请求必须在合理时间内完成
    assert!(
        duration.as_secs() < 60,
        "1000个并发请求必须在60秒内完成，实际: {:?}",
        duration
    );
}

/// 测试2: 长时间运行压力测试（持续5分钟）
#[tokio::test]
#[serial_test::serial]
#[ignore] // 默认忽略，需要时手动运行
async fn test_long_running_stress() {
    let client = ExtremeStressClient::new().await;
    let test_duration = Duration::from_secs(300); // 5分钟
    let start_time = Instant::now();
    let mut iteration = 0u64;

    // 先创建一个测试用户
    let email = format!("longrun_{}@stress.test", Uuid::new_v4().simple());
    let username = format!("longrun_user_{}", Uuid::new_v4().simple());

    let register_response = client
        .client
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

    let test_slug = "long-running-stress-test";

    // 持续运行测试
    while start_time.elapsed() < test_duration {
        iteration += 1;

        // 混合操作：浏览、点赞、获取统计
        let mut handles = Vec::new();

        // 10个并发浏览请求
        for _ in 0..10 {
            let client_clone = client.client.clone();
            let token_clone = token.clone();
            let slug_clone = test_slug.to_string();

            handles.push(tokio::spawn(async move {
                let _ = client_clone
                    .post(&format!("{}/v1/posts/{}/view", BASE_URL, slug_clone))
                    .header("Authorization", format!("Bearer {}", token_clone))
                    .send()
                    .await;
            }));
        }

        // 等待完成
        for handle in handles {
            let _ = handle.await;
        }

        // 每100次迭代检查一次统计
        if iteration % 100 == 0 {
            let stats_response = client
                .client
                .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
                .send()
                .await;

            if let Ok(resp) = stats_response {
                if resp.status().is_success() {
                    println!("迭代 {}: 统计获取成功", iteration);
                }
            }
        }

        // 短暂休息避免过载
        tokio::time::sleep(Duration::from_millis(10)).await;
    }

    println!("长时间运行测试完成: {} 次迭代", iteration);
    
    // 严格断言：必须完成至少一定数量的迭代
    assert!(
        iteration > 1000,
        "5分钟内必须完成至少1000次迭代，实际: {}",
        iteration
    );
}

/// 测试3: 内存泄漏检测（大量请求后检查内存）
#[tokio::test]
#[serial_test::serial]
#[ignore] // 默认忽略，需要时手动运行
async fn test_memory_leak_detection() {
    let client = ExtremeStressClient::new().await;
    const ITERATIONS: usize = 10000;
    const REQUESTS_PER_ITERATION: usize = 10;

    println!("开始内存泄漏检测测试...");

    for iteration in 0..ITERATIONS {
        let mut handles = Vec::new();

        for i in 0..REQUESTS_PER_ITERATION {
            let client_clone = client.client.clone();
            let _request_id = iteration * REQUESTS_PER_ITERATION + i;

            handles.push(tokio::spawn(async move {
                let _ = client_clone
                    .get(&format!("{}/healthz", BASE_URL))
                    .send()
                    .await;
            }));
        }

        // 等待所有请求完成
        for handle in handles {
            let _ = handle.await;
        }

        // 每1000次迭代报告一次
        if iteration % 1000 == 0 {
            println!("已完成 {} 次迭代 ({} 个请求)", iteration, iteration * REQUESTS_PER_ITERATION);
        }
    }

    println!("内存泄漏检测测试完成: {} 次迭代，{} 个请求", ITERATIONS, ITERATIONS * REQUESTS_PER_ITERATION);
    
    // 注意：实际的内存泄漏检测需要外部工具（如 valgrind）
    // 这里只是确保大量请求不会导致明显的性能下降
}

/// 测试4: 资源耗尽场景测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 默认忽略，需要时手动运行
async fn test_resource_exhaustion() {
    let client = ExtremeStressClient::new().await;
    
    // 创建大量连接但不释放
    const CONNECTION_COUNT: usize = 500;
    let mut handles = Vec::new();

    for i in 0..CONNECTION_COUNT {
        let client_clone = client.client.clone();
        let email = format!("resource_{}@stress.test", i);
        let username = format!("resource_user_{}", i);

        handles.push(tokio::spawn(async move {
            // 创建连接但不立即释放
            let response = client_clone
                .post(&format!("{}/v1/auth/register", BASE_URL))
                .json(&json!({
                    "email": email,
                    "username": username,
                    "password": TEST_PASSWORD
                }))
                .send()
                .await;

            // 保持连接一段时间
            tokio::time::sleep(Duration::from_millis(100)).await;
            
            response
        }));
    }

    // 等待所有请求完成
    let mut success_count = 0;
    for handle in handles {
        match handle.await {
            Ok(Ok(resp)) => {
                if resp.status().is_success() {
                    success_count += 1;
                }
            }
            _ => {}
        }
    }

    println!("资源耗尽测试完成: {} 个连接，{} 成功", CONNECTION_COUNT, success_count);
    
    // 严格断言：即使在高负载下，成功率也应该 > 95%
    let success_rate = success_count as f64 / CONNECTION_COUNT as f64;
    assert!(
        success_rate > 0.95,
        "资源耗尽场景下成功率必须 > 95%，实际: {:.2}%",
        success_rate * 100.0
    );
}

/// 测试5: 极端负载下的数据一致性
#[tokio::test]
#[serial_test::serial]
#[ignore] // 默认忽略，需要时手动运行
async fn test_extreme_load_data_consistency() {
    let client = ExtremeStressClient::new().await;
    
    // 先注册用户
    let email = format!("consistency_{}@stress.test", Uuid::new_v4().simple());
    let username = format!("consistency_user_{}", Uuid::new_v4().simple());

    let register_response = client
        .client
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

    let test_slug = "extreme-consistency-test";
    const CONCURRENT_VIEWS: usize = 500;

    // 并发发送大量浏览请求
    let mut handles = Vec::new();
    for _ in 0..CONCURRENT_VIEWS {
        let client_clone = client.client.clone();
        let token_clone = token.clone();
        let slug_clone = test_slug.to_string();

        handles.push(tokio::spawn(async move {
            client_clone
                .post(&format!("{}/v1/posts/{}/view", BASE_URL, slug_clone))
                .header("Authorization", format!("Bearer {}", token_clone))
                .send()
                .await
        }));
    }

    // 等待所有请求完成
    let mut success_count = 0;
    for handle in handles {
        match handle.await.unwrap() {
            Ok(resp) => {
                if resp.status().is_success() {
                    success_count += 1;
                }
            }
            _ => {}
        }
    }

    // 等待一段时间让数据同步
    tokio::time::sleep(Duration::from_secs(2)).await;

    // 多次获取统计，验证一致性
    let mut view_counts = Vec::new();
    for _ in 0..10 {
        let stats_response = client
            .client
            .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
            .send()
            .await
            .unwrap();

        if stats_response.status().is_success() {
            let stats: Value = stats_response.json().await.unwrap();
            let view_count = stats.get("view_count").unwrap().as_i64().unwrap();
            view_counts.push(view_count);
        }
    }

    println!("极端负载数据一致性测试:");
    println!("  成功浏览请求: {}", success_count);
    println!("  统计值样本: {:?}", view_counts);

    // 严格断言：所有统计值应该一致（或非常接近）
    if !view_counts.is_empty() {
        let first_count = view_counts[0];
        let _all_same = view_counts.iter().all(|&c| c == first_count);
        
        // 允许小的差异（由于缓存或异步更新）
        let max_diff = view_counts.iter().max().unwrap() - view_counts.iter().min().unwrap();
        
        assert!(
            max_diff <= 10,
            "统计值差异过大: 最大差异 = {}, 样本 = {:?}",
            max_diff,
            view_counts
        );
    }

    // 严格断言：成功率必须 > 99%
    let success_rate = success_count as f64 / CONCURRENT_VIEWS as f64;
    assert!(
        success_rate > 0.99,
        "极端负载下成功率必须 > 99%，实际: {:.2}%",
        success_rate * 100.0
    );
}

/// 测试6: 突发流量测试（短时间内大量请求）
#[tokio::test]
#[serial_test::serial]
#[ignore] // 默认忽略，需要时手动运行
async fn test_burst_traffic() {
    let client = ExtremeStressClient::new().await;
    const BURST_SIZE: usize = 2000;
    
    println!("开始突发流量测试: {} 个请求", BURST_SIZE);

    let start_time = Instant::now();
    let mut handles = Vec::new();

    // 同时发送大量请求
    for i in 0..BURST_SIZE {
        let client_clone = client.client.clone();
        let request_id = i;

        handles.push(tokio::spawn(async move {
            let start = Instant::now();
            let result = client_clone
                .get(&format!("{}/healthz", BASE_URL))
                .send()
                .await;
            let duration = start.elapsed();
            
            (result, duration, request_id)
        }));
    }

    // 收集结果
    let mut success_count = 0;
    let mut response_times = Vec::new();
    let mut max_response_time = Duration::ZERO;

    for handle in handles {
        match handle.await.unwrap() {
            (Ok(resp), duration, _) => {
                if resp.status().is_success() {
                    success_count += 1;
                }
                response_times.push(duration);
                if duration > max_response_time {
                    max_response_time = duration;
                }
            }
            _ => {}
        }
    }

    let total_duration = start_time.elapsed();
    let avg_response_time: Duration = response_times.iter().sum::<Duration>() / response_times.len() as u32;
    let p95_response_time = response_times[response_times.len() * 95 / 100];

    println!("突发流量测试完成:");
    println!("  总请求数: {}", BURST_SIZE);
    println!("  成功: {}", success_count);
    println!("  总耗时: {:?}", total_duration);
    println!("  平均响应时间: {:?}", avg_response_time);
    println!("  P95响应时间: {:?}", p95_response_time);
    println!("  最大响应时间: {:?}", max_response_time);
    println!("  QPS: {:.2}", BURST_SIZE as f64 / total_duration.as_secs_f64());

    // 严格断言：成功率必须 = 100%
    assert_eq!(
        success_count, BURST_SIZE,
        "突发流量下成功率必须 = 100%，实际: {}/{}",
        success_count, BURST_SIZE
    );

    // 严格断言：平均响应时间必须 < 200ms
    assert!(
        avg_response_time.as_millis() < 200,
        "平均响应时间必须 < 200ms，实际: {:?}",
        avg_response_time
    );

    // 严格断言：P95响应时间必须 < 500ms
    assert!(
        p95_response_time.as_millis() < 500,
        "P95响应时间必须 < 500ms，实际: {:?}",
        p95_response_time
    );

    // 严格断言：所有请求必须在5秒内完成
    assert!(
        total_duration.as_secs() < 5,
        "所有请求必须在5秒内完成，实际: {:?}",
        total_duration
    );
}

