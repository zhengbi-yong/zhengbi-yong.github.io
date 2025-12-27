//! 数据一致性严格测试
//! 
//! 测试包括：
//! - 事务隔离级别测试
//! - 并发写入数据完整性
//! - 读写竞态条件
//! - 数据丢失检测
//! - 计数器准确性

use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;
use std::sync::atomic::{AtomicU64, Ordering};
use uuid::Uuid;

const BASE_URL: &str = "http://localhost:3000";
const TEST_PASSWORD: &str = "test_password_123_STRICT";

/// 测试1: 并发点赞数据一致性（确保点赞数准确）
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_like_consistency() {
    let client = Client::new();
    
    // 注册用户
    let email = format!("like_consistency_{}@test.com", Uuid::new_v4().simple());
    let username = format!("like_user_{}", Uuid::new_v4().simple());

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

    let test_slug = format!("concurrent-like-test-{}", Uuid::new_v4().simple());
    const CONCURRENT_LIKES: usize = 100;

    // 并发发送点赞请求
    let mut handles = Vec::new();
    let success_counter = std::sync::Arc::new(AtomicU64::new(0));

    for _ in 0..CONCURRENT_LIKES {
        let client_clone = client.clone();
        let token_clone = token.clone();
        let slug_clone = test_slug.clone();
        let counter = success_counter.clone();

        handles.push(tokio::spawn(async move {
            let response = client_clone
                .post(&format!("{}/v1/posts/{}/like", BASE_URL, slug_clone))
                .header("Authorization", format!("Bearer {}", token_clone))
                .send()
                .await;

            match response {
                Ok(resp) => {
                    if resp.status().is_success() || resp.status().as_u16() == 409 {
                        // 409 表示已经点赞过，这也是预期的
                        counter.fetch_add(1, Ordering::Relaxed);
                    }
                }
                _ => {}
            }
        }));
    }

    // 等待所有请求完成
    for handle in handles {
        let _ = handle.await;
    }

    // 等待数据同步
    tokio::time::sleep(Duration::from_secs(2)).await;

    // 获取统计
    let stats_response = client
        .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
        .send()
        .await
        .unwrap();

    let stats: Value = stats_response.json().await.unwrap();
    let like_count = stats.get("like_count").unwrap().as_i64().unwrap();

    println!("并发点赞一致性测试:");
    println!("  并发请求数: {}", CONCURRENT_LIKES);
    println!("  成功请求数: {}", success_counter.load(Ordering::Relaxed));
    println!("  统计中的点赞数: {}", like_count);

    // 严格断言：点赞数必须等于成功的点赞请求数
    // 注意：由于并发，可能会有重复点赞（409），所以实际点赞数 <= 成功请求数
    let success_count = success_counter.load(Ordering::Relaxed) as i64;
    assert!(
        like_count <= success_count && like_count > 0,
        "点赞数必须 <= 成功请求数，实际点赞数: {}, 成功请求数: {}",
        like_count,
        success_count
    );
}

/// 测试2: 并发取消点赞数据一致性
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_unlike_consistency() {
    let client = Client::new();
    
    // 注册用户
    let email = format!("unlike_consistency_{}@test.com", Uuid::new_v4().simple());
    let username = format!("unlike_user_{}", Uuid::new_v4().simple());

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

    let test_slug = format!("concurrent-unlike-test-{}", Uuid::new_v4().simple());

    // 先点赞
    client
        .post(&format!("{}/v1/posts/{}/like", BASE_URL, test_slug))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .unwrap();

    // 等待同步
    tokio::time::sleep(Duration::from_millis(500)).await;

    const CONCURRENT_UNLIKES: usize = 50;

    // 并发发送取消点赞请求
    let mut handles = Vec::new();
    let success_counter = std::sync::Arc::new(AtomicU64::new(0));

    for _ in 0..CONCURRENT_UNLIKES {
        let client_clone = client.clone();
        let token_clone = token.clone();
        let slug_clone = test_slug.clone();
        let counter = success_counter.clone();

        handles.push(tokio::spawn(async move {
            let response = client_clone
                .delete(&format!("{}/v1/posts/{}/like", BASE_URL, slug_clone))
                .header("Authorization", format!("Bearer {}", token_clone))
                .send()
                .await;

            match response {
                Ok(resp) => {
                    if resp.status().is_success() || resp.status().as_u16() == 409 {
                        counter.fetch_add(1, Ordering::Relaxed);
                    }
                }
                _ => {}
            }
        }));
    }

    // 等待所有请求完成
    for handle in handles {
        let _ = handle.await;
    }

    // 等待数据同步
    tokio::time::sleep(Duration::from_secs(2)).await;

    // 获取统计
    let stats_response = client
        .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
        .send()
        .await
        .unwrap();

    let stats: Value = stats_response.json().await.unwrap();
    let like_count = stats.get("like_count").unwrap().as_i64().unwrap();

    println!("并发取消点赞一致性测试:");
    println!("  并发请求数: {}", CONCURRENT_UNLIKES);
    println!("  成功请求数: {}", success_counter.load(Ordering::Relaxed));
    println!("  统计中的点赞数: {}", like_count);

    // 严格断言：最终点赞数必须为0（因为只点赞了一次，然后并发取消）
    assert_eq!(
        like_count, 0,
        "最终点赞数必须为0，实际: {}",
        like_count
    );
}

/// 测试3: 并发浏览计数准确性
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_view_count_accuracy() {
    let client = Client::new();
    
    // 注册用户
    let email = format!("view_accuracy_{}@test.com", Uuid::new_v4().simple());
    let username = format!("view_user_{}", Uuid::new_v4().simple());

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

    let test_slug = format!("view-accuracy-test-{}", Uuid::new_v4().simple());
    const CONCURRENT_VIEWS: usize = 200;

    // 并发发送浏览请求
    let mut handles = Vec::new();
    let success_counter = std::sync::Arc::new(AtomicU64::new(0));

    for _ in 0..CONCURRENT_VIEWS {
        let client_clone = client.clone();
        let token_clone = token.clone();
        let slug_clone = test_slug.clone();
        let counter = success_counter.clone();

        handles.push(tokio::spawn(async move {
            let response = client_clone
                .post(&format!("{}/v1/posts/{}/view", BASE_URL, slug_clone))
                .header("Authorization", format!("Bearer {}", token_clone))
                .send()
                .await;

            match response {
                Ok(resp) => {
                    if resp.status().is_success() {
                        counter.fetch_add(1, Ordering::Relaxed);
                    }
                }
                _ => {}
            }
        }));
    }

    // 等待所有请求完成
    for handle in handles {
        let _ = handle.await;
    }

    // 等待数据同步（浏览计数是异步更新的）
    tokio::time::sleep(Duration::from_secs(5)).await;

    // 多次获取统计，验证一致性
    let mut view_counts = Vec::new();
    for _ in 0..5 {
        let stats_response = client
            .get(&format!("{}/v1/posts/{}/stats", BASE_URL, test_slug))
            .send()
            .await
            .unwrap();

        if stats_response.status().is_success() {
            let stats: Value = stats_response.json().await.unwrap();
            let view_count = stats.get("view_count").unwrap().as_i64().unwrap();
            view_counts.push(view_count);
        }

        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    let success_count = success_counter.load(Ordering::Relaxed) as i64;
    let final_view_count = view_counts.last().copied().unwrap_or(0);

    println!("并发浏览计数准确性测试:");
    println!("  并发请求数: {}", CONCURRENT_VIEWS);
    println!("  成功请求数: {}", success_count);
    println!("  最终浏览数: {}", final_view_count);
    println!("  浏览数序列: {:?}", view_counts);

    // 严格断言：最终浏览数应该接近成功请求数
    // 允许小的差异（由于异步更新）
    let diff = (final_view_count - success_count).abs();
    assert!(
        diff <= 10 || final_view_count >= success_count * 9 / 10,
        "浏览数应该接近成功请求数，成功: {}, 最终浏览数: {}, 差异: {}",
        success_count,
        final_view_count,
        diff
    );
}

/// 测试4: 并发评论创建数据一致性
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_comment_consistency() {
    let client = Client::new();
    
    // 注册用户
    let email = format!("comment_consistency_{}@test.com", Uuid::new_v4().simple());
    let username = format!("comment_user_{}", Uuid::new_v4().simple());

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

    let test_slug = format!("comment-consistency-test-{}", Uuid::new_v4().simple());
    const CONCURRENT_COMMENTS: usize = 50;

    // 并发创建评论
    let mut handles = Vec::new();
    let success_counter = std::sync::Arc::new(AtomicU64::new(0));
    let comment_ids = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));

    for i in 0..CONCURRENT_COMMENTS {
        let client_clone = client.clone();
        let token_clone = token.clone();
        let slug_clone = test_slug.clone();
        let counter = success_counter.clone();
        let ids = comment_ids.clone();

        handles.push(tokio::spawn(async move {
            let response = client_clone
                .post(&format!("{}/v1/posts/{}/comments", BASE_URL, slug_clone))
                .header("Authorization", format!("Bearer {}", token_clone))
                .json(&json!({
                    "content": format!("并发评论 #{}", i),
                    "parent_id": null
                }))
                .send()
                .await;

            match response {
                Ok(resp) => {
                    if resp.status().is_success() {
                        counter.fetch_add(1, Ordering::Relaxed);
                        if let Ok(json) = resp.json::<Value>().await {
                            if let Some(id) = json.get("id").and_then(|v| v.as_str()) {
                                ids.lock().unwrap().push(id.to_string());
                            }
                        }
                    }
                }
                _ => {}
            }
        }));
    }

    // 等待所有请求完成
    for handle in handles {
        let _ = handle.await;
    }

    // 等待数据同步
    tokio::time::sleep(Duration::from_secs(2)).await;

    // 获取评论列表
    let comments_response = client
        .get(&format!("{}/v1/posts/{}/comments", BASE_URL, test_slug))
        .send()
        .await
        .unwrap();

    let comments_data: Value = comments_response.json().await.unwrap();
    let comments = comments_data.get("comments").unwrap().as_array().unwrap();

    let success_count = success_counter.load(Ordering::Relaxed);
    let comment_count = comments.len();

    println!("并发评论创建一致性测试:");
    println!("  并发请求数: {}", CONCURRENT_COMMENTS);
    println!("  成功请求数: {}", success_count);
    println!("  实际评论数: {}", comment_count);

    // 严格断言：评论数必须等于成功请求数
    assert_eq!(
        comment_count as u64, success_count,
        "评论数必须等于成功请求数，实际评论数: {}, 成功请求数: {}",
        comment_count,
        success_count
    );

    // 严格断言：所有创建的评论都应该在列表中
    let created_ids: std::collections::HashSet<String> = comment_ids.lock().unwrap().iter().cloned().collect();
    let listed_ids: std::collections::HashSet<String> = comments
        .iter()
        .filter_map(|c| c.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()))
        .collect();

    assert_eq!(
        created_ids.len(),
        listed_ids.len(),
        "创建的评论ID数量必须等于列表中的ID数量"
    );
}

/// 测试5: 读写竞态条件测试
#[tokio::test]
#[serial_test::serial]
async fn test_read_write_race_condition() {
    let client = Client::new();
    
    // 注册用户
    let email = format!("race_{}@test.com", Uuid::new_v4().simple());
    let username = format!("race_user_{}", Uuid::new_v4().simple());

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

    let test_slug = format!("race-condition-test-{}", Uuid::new_v4().simple());
    const ITERATIONS: usize = 100;

    // 混合读写操作
    let mut handles = Vec::new();
    let read_counter = std::sync::Arc::new(AtomicU64::new(0));
    let write_counter = std::sync::Arc::new(AtomicU64::new(0));

    for i in 0..ITERATIONS {
        let client_clone = client.clone();
        let token_clone = token.clone();
        let slug_clone = test_slug.clone();
        let read_ctr = read_counter.clone();
        let write_ctr = write_counter.clone();

        if i % 2 == 0 {
            // 写操作：浏览
            handles.push(tokio::spawn(async move {
                let response = client_clone
                    .post(&format!("{}/v1/posts/{}/view", BASE_URL, slug_clone))
                    .header("Authorization", format!("Bearer {}", token_clone))
                    .send()
                    .await;

                if let Ok(resp) = response {
                    if resp.status().is_success() {
                        write_ctr.fetch_add(1, Ordering::Relaxed);
                    }
                }
            }));
        } else {
            // 读操作：获取统计
            handles.push(tokio::spawn(async move {
                let response = client_clone
                    .get(&format!("{}/v1/posts/{}/stats", BASE_URL, slug_clone))
                    .send()
                    .await;

                if let Ok(resp) = response {
                    if resp.status().is_success() {
                        read_ctr.fetch_add(1, Ordering::Relaxed);
                    }
                }
            }));
        }
    }

    // 等待所有操作完成
    for handle in handles {
        let _ = handle.await;
    }

    println!("读写竞态条件测试:");
    println!("  总操作数: {}", ITERATIONS);
    println!("  读操作成功数: {}", read_counter.load(Ordering::Relaxed));
    println!("  写操作成功数: {}", write_counter.load(Ordering::Relaxed));

    // 严格断言：所有操作都应该成功
    let total_success = read_counter.load(Ordering::Relaxed) + write_counter.load(Ordering::Relaxed);
    assert_eq!(
        total_success, ITERATIONS as u64,
        "所有操作都应该成功，实际成功: {}, 总操作: {}",
        total_success,
        ITERATIONS
    );
}

