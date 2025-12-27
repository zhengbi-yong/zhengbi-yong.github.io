//! 性能基准测试
//! 
//! 严格的性能要求和基准测试
//! 
//! 测试包括：
//! - 响应时间基准
//! - 吞吐量测试
//! - 延迟分布测试
//! - 资源使用测试

use reqwest::Client;
use serde_json::json;
use std::time::{Duration, Instant};
use std::collections::HashMap;

const BASE_URL: &str = "http://localhost:3000";
const TEST_PASSWORD: &str = "test_password_123_STRICT";

/// 性能基准配置
struct PerformanceBenchmark {
    max_avg_response_time: Duration,
    max_p95_response_time: Duration,
    max_p99_response_time: Duration,
    min_throughput: f64, // 请求/秒
}

impl Default for PerformanceBenchmark {
    fn default() -> Self {
        Self {
            max_avg_response_time: Duration::from_millis(100),
            max_p95_response_time: Duration::from_millis(200),
            max_p99_response_time: Duration::from_millis(500),
            min_throughput: 100.0, // 至少100 QPS
        }
    }
}

/// 测试1: 健康检查性能基准
#[tokio::test]
#[serial_test::serial]
async fn test_health_check_performance() {
    let client = Client::new();
    const REQUESTS: usize = 1000;
    let benchmark = PerformanceBenchmark::default();

    let mut response_times = Vec::new();
    let start_time = Instant::now();

    for _ in 0..REQUESTS {
        let request_start = Instant::now();
        let response = client
            .get(&format!("{}/healthz", BASE_URL))
            .send()
            .await;

        let request_duration = request_start.elapsed();

        match response {
            Ok(resp) => {
                assert!(resp.status().is_success(), "健康检查应该成功");
                response_times.push(request_duration);
            }
            Err(e) => {
                panic!("健康检查请求失败: {:?}", e);
            }
        }
    }

    let total_duration = start_time.elapsed();
    let throughput = REQUESTS as f64 / total_duration.as_secs_f64();

    // 计算统计信息
    response_times.sort();
    let avg_response_time: Duration = response_times.iter().sum::<Duration>() / response_times.len() as u32;
    let p95_index = (response_times.len() * 95) / 100;
    let p99_index = (response_times.len() * 99) / 100;
    let p95_response_time = response_times[p95_index];
    let p99_response_time = response_times[p99_index];

    println!("健康检查性能基准:");
    println!("  总请求数: {}", REQUESTS);
    println!("  总耗时: {:?}", total_duration);
    println!("  平均响应时间: {:?}", avg_response_time);
    println!("  P95响应时间: {:?}", p95_response_time);
    println!("  P99响应时间: {:?}", p99_response_time);
    println!("  吞吐量: {:.2} QPS", throughput);

    // 严格断言：平均响应时间必须 < 100ms
    assert!(
        avg_response_time < benchmark.max_avg_response_time,
        "平均响应时间必须 < {:?}，实际: {:?}",
        benchmark.max_avg_response_time,
        avg_response_time
    );

    // 严格断言：P95响应时间必须 < 200ms
    assert!(
        p95_response_time < benchmark.max_p95_response_time,
        "P95响应时间必须 < {:?}，实际: {:?}",
        benchmark.max_p95_response_time,
        p95_response_time
    );

    // 严格断言：P99响应时间必须 < 500ms
    assert!(
        p99_response_time < benchmark.max_p99_response_time,
        "P99响应时间必须 < {:?}，实际: {:?}",
        benchmark.max_p99_response_time,
        p99_response_time
    );

    // 严格断言：吞吐量必须 > 100 QPS
    assert!(
        throughput >= benchmark.min_throughput,
        "吞吐量必须 >= {:.2} QPS，实际: {:.2} QPS",
        benchmark.min_throughput,
        throughput
    );
}

/// 测试2: 认证端点性能基准
#[tokio::test]
#[serial_test::serial]
async fn test_auth_endpoint_performance() {
    let client = Client::new();
    const REQUESTS: usize = 500;
    let benchmark = PerformanceBenchmark {
        max_avg_response_time: Duration::from_millis(200), // 认证端点允许稍慢
        max_p95_response_time: Duration::from_millis(500),
        max_p99_response_time: Duration::from_millis(1000),
        min_throughput: 50.0, // 认证端点吞吐量要求较低
    };

    let mut response_times = Vec::new();
    let start_time = Instant::now();

    for i in 0..REQUESTS {
        let email = format!("perf_{}@benchmark.test", i);
        let username = format!("perf_user_{}", i);

        let request_start = Instant::now();
        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": TEST_PASSWORD
            }))
            .send()
            .await;

        let request_duration = request_start.elapsed();

        match response {
            Ok(resp) => {
                if resp.status().is_success() || resp.status().as_u16() == 409 {
                    response_times.push(request_duration);
                }
            }
            Err(_) => {}
        }
    }

    let total_duration = start_time.elapsed();
    let throughput = REQUESTS as f64 / total_duration.as_secs_f64();

    // 计算统计信息
    response_times.sort();
    if !response_times.is_empty() {
        let avg_response_time: Duration = response_times.iter().sum::<Duration>() / response_times.len() as u32;
        let p95_index = (response_times.len() * 95) / 100;
        let p99_index = (response_times.len() * 99) / 100;
        let p95_response_time = response_times[p95_index];
        let p99_response_time = response_times[p99_index];

        println!("认证端点性能基准:");
        println!("  总请求数: {}", REQUESTS);
        println!("  成功请求数: {}", response_times.len());
        println!("  总耗时: {:?}", total_duration);
        println!("  平均响应时间: {:?}", avg_response_time);
        println!("  P95响应时间: {:?}", p95_response_time);
        println!("  P99响应时间: {:?}", p99_response_time);
        println!("  吞吐量: {:.2} QPS", throughput);

        // 严格断言
        assert!(
            avg_response_time < benchmark.max_avg_response_time,
            "平均响应时间必须 < {:?}，实际: {:?}",
            benchmark.max_avg_response_time,
            avg_response_time
        );

        assert!(
            p95_response_time < benchmark.max_p95_response_time,
            "P95响应时间必须 < {:?}，实际: {:?}",
            benchmark.max_p95_response_time,
            p95_response_time
        );

        assert!(
            p99_response_time < benchmark.max_p99_response_time,
            "P99响应时间必须 < {:?}，实际: {:?}",
            benchmark.max_p99_response_time,
            p99_response_time
        );
    }

    assert!(
        throughput >= benchmark.min_throughput,
        "吞吐量必须 >= {:.2} QPS，实际: {:.2} QPS",
        benchmark.min_throughput,
        throughput
    );
}

/// 测试3: 并发性能测试
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_performance() {
    let client = Client::new();
    const CONCURRENT_REQUESTS: usize = 200;
    const REQUESTS_PER_CONNECTION: usize = 10;

    let start_time = Instant::now();
    let mut handles = Vec::new();
    let success_counter = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));

    // 创建并发连接
    for _ in 0..CONCURRENT_REQUESTS {
        let client_clone = client.clone();
        let counter = success_counter.clone();

        handles.push(tokio::spawn(async move {
            for _ in 0..REQUESTS_PER_CONNECTION {
                let response = client_clone
                    .get(&format!("{}/healthz", BASE_URL))
                    .send()
                    .await;

                if let Ok(resp) = response {
                    if resp.status().is_success() {
                        counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    }
                }
            }
        }));
    }

    // 等待所有连接完成
    for handle in handles {
        let _ = handle.await;
    }

    let total_duration = start_time.elapsed();
    let total_requests = CONCURRENT_REQUESTS * REQUESTS_PER_CONNECTION;
    let success_count = success_counter.load(std::sync::atomic::Ordering::Relaxed);
    let throughput = success_count as f64 / total_duration.as_secs_f64();

    println!("并发性能测试:");
    println!("  并发连接数: {}", CONCURRENT_REQUESTS);
    println!("  每连接请求数: {}", REQUESTS_PER_CONNECTION);
    println!("  总请求数: {}", total_requests);
    println!("  成功请求数: {}", success_count);
    println!("  总耗时: {:?}", total_duration);
    println!("  吞吐量: {:.2} QPS", throughput);

    // 严格断言：成功率必须 > 99%
    let success_rate = success_count as f64 / total_requests as f64;
    assert!(
        success_rate > 0.99,
        "并发性能测试成功率必须 > 99%，实际: {:.2}%",
        success_rate * 100.0
    );

    // 严格断言：吞吐量必须 > 500 QPS
    assert!(
        throughput > 500.0,
        "并发性能测试吞吐量必须 > 500 QPS，实际: {:.2} QPS",
        throughput
    );
}

/// 测试4: 延迟分布测试
#[tokio::test]
#[serial_test::serial]
async fn test_latency_distribution() {
    let client = Client::new();
    const REQUESTS: usize = 1000;

    let mut response_times = Vec::new();

    for _ in 0..REQUESTS {
        let start = Instant::now();
        let response = client
            .get(&format!("{}/healthz", BASE_URL))
            .send()
            .await;

        let duration = start.elapsed();

        if let Ok(resp) = response {
            if resp.status().is_success() {
                response_times.push(duration);
            }
        }
    }

    response_times.sort();

    // 计算百分位数
    let percentiles = vec![50, 75, 90, 95, 99, 99.9];
    let mut latency_distribution = HashMap::new();

    for p in &percentiles {
        let index = ((response_times.len() as f64 * p / 100.0) as usize).min(response_times.len() - 1);
        latency_distribution.insert(*p, response_times[index]);
    }

    println!("延迟分布测试:");
    for (percentile, latency) in &latency_distribution {
        println!("  P{}: {:?}", percentile, latency);
    }

    // 严格断言：P50必须 < 50ms
    if let Some(p50) = latency_distribution.get(&50.0) {
        assert!(
            *p50 < Duration::from_millis(50),
            "P50延迟必须 < 50ms，实际: {:?}",
            p50
        );
    }

    // 严格断言：P99必须 < 500ms
    if let Some(p99) = latency_distribution.get(&99.0) {
        assert!(
            *p99 < Duration::from_millis(500),
            "P99延迟必须 < 500ms，实际: {:?}",
            p99
        );
    }
}

/// 测试5: 持续负载性能测试
#[tokio::test]
#[serial_test::serial]
#[ignore] // 长时间运行，默认忽略
async fn test_sustained_load_performance() {
    let client = Client::new();
    const DURATION_SECONDS: u64 = 60; // 持续1分钟
    const REQUESTS_PER_SECOND: usize = 50;

    let start_time = Instant::now();
    let mut total_requests = 0u64;
    let mut successful_requests = 0u64;
    let mut response_times = Vec::new();

    while start_time.elapsed().as_secs() < DURATION_SECONDS {
        let mut handles = Vec::new();

        // 每秒发送指定数量的请求
        for _ in 0..REQUESTS_PER_SECOND {
            total_requests += 1;
            let client_clone = client.clone();
            let request_start = Instant::now();

            handles.push(tokio::spawn(async move {
                let response = client_clone
                    .get(&format!("{}/healthz", BASE_URL))
                    .send()
                    .await;

                (response, request_start.elapsed())
            }));
        }

        // 等待这批请求完成
        for handle in handles {
            if let Ok((response, duration)) = handle.await.unwrap() {
                if let Ok(resp) = response {
                    if resp.status().is_success() {
                        successful_requests += 1;
                        response_times.push(duration);
                    }
                }
            }
        }

        // 等待1秒
        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    let total_duration = start_time.elapsed();
    let throughput = successful_requests as f64 / total_duration.as_secs_f64();
    let success_rate = successful_requests as f64 / total_requests as f64;

    response_times.sort();
    let avg_response_time: Duration = if !response_times.is_empty() {
        response_times.iter().sum::<Duration>() / response_times.len() as u32
    } else {
        Duration::ZERO
    };

    println!("持续负载性能测试:");
    println!("  持续时间: {:?}", total_duration);
    println!("  总请求数: {}", total_requests);
    println!("  成功请求数: {}", successful_requests);
    println!("  成功率: {:.2}%", success_rate * 100.0);
    println!("  平均响应时间: {:?}", avg_response_time);
    println!("  吞吐量: {:.2} QPS", throughput);

    // 严格断言：成功率必须 > 99%
    assert!(
        success_rate > 0.99,
        "持续负载下成功率必须 > 99%，实际: {:.2}%",
        success_rate * 100.0
    );

    // 严格断言：平均响应时间必须 < 200ms
    if !response_times.is_empty() {
        assert!(
            avg_response_time < Duration::from_millis(200),
            "持续负载下平均响应时间必须 < 200ms，实际: {:?}",
            avg_response_time
        );
    }

    // 严格断言：吞吐量必须接近目标
    assert!(
        throughput >= REQUESTS_PER_SECOND as f64 * 0.9,
        "持续负载下吞吐量必须 >= {:.2} QPS，实际: {:.2} QPS",
        REQUESTS_PER_SECOND as f64 * 0.9,
        throughput
    );
}

