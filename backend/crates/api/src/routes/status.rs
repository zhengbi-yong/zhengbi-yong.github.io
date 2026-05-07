use crate::state::AppState;
use axum::{
    extract::{Json, Query, State},
    response::IntoResponse,
};
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use utoipa::ToSchema;

use chrono::{DateTime, Datelike, Duration, FixedOffset, NaiveDate, TimeZone, Timelike, Utc};

const TZ: FixedOffset = match FixedOffset::east_opt(8 * 3600) {
    Some(tz) => tz,
    None => panic!("Invalid timezone offset"),
};

/// A single test result
#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct TestResultItem {
    pub feature_id: String,
    pub feature_name: String,
    pub module: String,
    pub status: bool,
    pub response_time_ms: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tested_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct TestRunSummary { pub total: i32, pub passed: i32, pub failed: i32 }

#[derive(Debug, Deserialize, ToSchema)]
pub struct StoreTestResultsRequest { pub results: Vec<TestResultItem>, pub summary: TestRunSummary }

#[derive(Debug, Serialize, ToSchema, sqlx::FromRow)]
pub struct TestHistoryRow { pub run_at: DateTime<Utc>, pub total: i32, pub passed: i32, pub failed: i32 }

#[derive(Debug, Deserialize)]
pub struct TestHistoryQuery { #[serde(default = "default_hours")] pub hours: i64 }
fn default_hours() -> i64 { 24 }

#[derive(Debug, Deserialize)]
pub struct AggregatedQuery {
    pub granularity: String,
    #[serde(default)] pub year: Option<i32>,
    #[serde(default)] pub month: Option<i32>,
    #[serde(default)] pub day: Option<i32>,
    #[serde(default)] pub hour: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct AggBucket { pub label: String, pub timestamp: String, pub total_runs: i64, pub fully_passed: i64, pub partially_failed: i64 }

#[derive(Debug, Serialize)]
pub struct FailedFeature { pub feature_id: String, pub feature_name: String, pub module: String, #[serde(skip_serializing_if = "Option::is_none")] pub error_message: Option<String> }

#[derive(Debug, Serialize)]
pub struct MinuteBucket { pub label: String, pub timestamp: String, pub total: i32, pub passed: i32, pub failed: i32, #[serde(skip_serializing_if = "Option::is_none")] pub failed_features: Option<Vec<FailedFeature>> }

// ── Routes ──

#[utoipa::path(post, path = "/api/v1/status/test-results", tag = "status", request_body = StoreTestResultsRequest, responses((status = 201), (status = 500)))]
pub async fn store_test_results(State(state): State<AppState>, Json(body): Json<StoreTestResultsRequest>) -> Result<impl IntoResponse, AppError> {
    let json = serde_json::to_value(&body.results).map_err(|_| AppError::InternalError)?;
    sqlx::query("INSERT INTO feature_test_history (total,passed,failed,results) VALUES ($1,$2,$3,$4)")
        .bind(body.summary.total).bind(body.summary.passed).bind(body.summary.failed).bind(&json)
        .execute(&state.db).await.map_err(|e| { tracing::error!("Store failed: {}", e); AppError::InternalError })?;
    Ok((axum::http::StatusCode::CREATED, Json(serde_json::json!({"stored":true}))))
}

#[utoipa::path(get, path = "/api/v1/status/test-history", tag = "status", params(("hours" = Option<i64>, Query)), responses((status = 200, body = Vec<TestHistoryRow>)))]
pub async fn get_test_history(State(state): State<AppState>, Query(params): Query<TestHistoryQuery>) -> Result<Json<Vec<TestHistoryRow>>, AppError> {
    let since = Utc::now() - Duration::hours(params.hours);
    let rows = sqlx::query_as::<_, TestHistoryRow>("SELECT run_at,total,passed,failed FROM feature_test_history WHERE run_at>=$1 ORDER BY run_at LIMIT 2000")
        .bind(since).fetch_all(&state.db).await.map_err(|e| { tracing::error!("History: {}", e); AppError::InternalError })?;
    Ok(Json(rows))
}

/// GET /api/v1/status/test-history/aggregated — all times in Asia/Shanghai (UTC+8)
pub async fn get_aggregated_history(State(state): State<AppState>, Query(params): Query<AggregatedQuery>) -> Result<Json<serde_json::Value>, AppError> {
    let now_sh = Utc::now().with_timezone(&TZ);

    // Helper: build UTC timestamp range from UTC+8 year/month/day/hour
    fn utc_range(y: i32, mo: u32, d: u32, h: u32) -> (DateTime<Utc>, DateTime<Utc>) {
        let naive_sh = NaiveDate::from_ymd_opt(y, mo, d).unwrap().and_hms_opt(h, 0, 0).unwrap();
        let start_utc = DateTime::from_naive_utc_and_offset(naive_sh - Duration::hours(8), Utc);
        (start_utc, start_utc + Duration::hours(1))
    }

    fn utc_day_range(y: i32, mo: u32, d: u32) -> (DateTime<Utc>, DateTime<Utc>) { utc_range(y, mo, d, 0); (utc_range(y,mo,d,0).0, utc_range(y,mo,d,0).0 + Duration::days(1)) }

    fn utc_month_range(y: i32, mo: u32) -> (DateTime<Utc>, DateTime<Utc>) {
        let naive = NaiveDate::from_ymd_opt(y, mo, 1).unwrap().and_hms_opt(0, 0, 0).unwrap();
        let start = DateTime::from_naive_utc_and_offset(naive - Duration::hours(8), Utc);
        let end = if mo == 12 {
            NaiveDate::from_ymd_opt(y + 1, 1, 1).unwrap().and_hms_opt(0, 0, 0).unwrap()
        } else {
            NaiveDate::from_ymd_opt(y, mo + 1, 1).unwrap().and_hms_opt(0, 0, 0).unwrap()
        };
        (start, DateTime::from_naive_utc_and_offset(end - Duration::hours(8), Utc))
    }

    fn utc_year_range(y: i32) -> (DateTime<Utc>, DateTime<Utc>) {
        let start = DateTime::from_naive_utc_and_offset(
            NaiveDate::from_ymd_opt(y, 1, 1).unwrap().and_hms_opt(0, 0, 0).unwrap() - Duration::hours(8), Utc);
        let end = DateTime::from_naive_utc_and_offset(
            NaiveDate::from_ymd_opt(y + 1, 1, 1).unwrap().and_hms_opt(0, 0, 0).unwrap() - Duration::hours(8), Utc);
        (start, end)
    }

    match params.granularity.as_str() {
        "year" => {
            let y = params.year.unwrap_or(now_sh.year());
            let (start, end) = utc_year_range(y);
            let rows = sqlx::query(
                "SELECT EXTRACT(MONTH FROM run_at AT TIME ZONE 'Asia/Shanghai')::int as bucket, COUNT(*)::bigint as total_runs, COUNT(*) FILTER (WHERE failed=0)::bigint as fully_passed, COUNT(*) FILTER (WHERE failed>0)::bigint as partially_failed FROM feature_test_history WHERE run_at>=$1 AND run_at<$2 GROUP BY bucket ORDER BY bucket"
            ).bind(start).bind(end).fetch_all(&state.db).await.map_err(|e| { tracing::error!("Agg: {}", e); AppError::InternalError })?;
            let buckets: Vec<AggBucket> = rows.iter().map(|r| {
                let m: i32 = r.get("bucket");
                AggBucket { label: format!("{}月", m), timestamp: format!("{:04}-{:02}-01T00:00:00+08:00", y, m), total_runs: r.get("total_runs"), fully_passed: r.get("fully_passed"), partially_failed: r.get("partially_failed") }
            }).collect();
            Ok(Json(serde_json::json!({"granularity":"year","year":y,"buckets":buckets})))
        }

        "month" => {
            let y = params.year.unwrap_or(now_sh.year());
            let mo = params.month.unwrap_or(now_sh.month() as i32) as u32;
            let (start, end) = utc_month_range(y, mo);
            let rows = sqlx::query(
                "SELECT EXTRACT(DAY FROM run_at AT TIME ZONE 'Asia/Shanghai')::int as bucket, COUNT(*)::bigint as total_runs, COUNT(*) FILTER (WHERE failed=0)::bigint as fully_passed, COUNT(*) FILTER (WHERE failed>0)::bigint as partially_failed FROM feature_test_history WHERE run_at>=$1 AND run_at<$2 GROUP BY bucket ORDER BY bucket"
            ).bind(start).bind(end).fetch_all(&state.db).await.map_err(|e| { tracing::error!("Agg: {}", e); AppError::InternalError })?;
            let buckets: Vec<AggBucket> = rows.iter().map(|r| {
                let d: i32 = r.get("bucket");
                AggBucket { label: format!("{}日", d), timestamp: format!("{:04}-{:02}-{:02}T00:00:00+08:00", y, mo, d), total_runs: r.get("total_runs"), fully_passed: r.get("fully_passed"), partially_failed: r.get("partially_failed") }
            }).collect();
            Ok(Json(serde_json::json!({"granularity":"month","year":y,"month":mo,"buckets":buckets})))
        }

        "day" => {
            let y = params.year.unwrap_or(now_sh.year());
            let mo = params.month.unwrap_or(now_sh.month() as i32) as u32;
            let d = params.day.unwrap_or(now_sh.day() as i32) as u32;
            let (start, end) = utc_day_range(y, mo, d);
            let rows = sqlx::query(
                "SELECT EXTRACT(HOUR FROM run_at AT TIME ZONE 'Asia/Shanghai')::int as bucket, COUNT(*)::bigint as total_runs, COUNT(*) FILTER (WHERE failed=0)::bigint as fully_passed, COUNT(*) FILTER (WHERE failed>0)::bigint as partially_failed FROM feature_test_history WHERE run_at>=$1 AND run_at<$2 GROUP BY bucket ORDER BY bucket"
            ).bind(start).bind(end).fetch_all(&state.db).await.map_err(|e| { tracing::error!("Agg: {}", e); AppError::InternalError })?;
            let buckets: Vec<AggBucket> = rows.iter().map(|r| {
                let h: i32 = r.get("bucket");
                AggBucket { label: format!("{:02}:00", h), timestamp: format!("{:04}-{:02}-{:02}T{:02}:00:00+08:00", y, mo, d, h), total_runs: r.get("total_runs"), fully_passed: r.get("fully_passed"), partially_failed: r.get("partially_failed") }
            }).collect();
            Ok(Json(serde_json::json!({"granularity":"day","year":y,"month":mo,"day":d,"buckets":buckets})))
        }

        "hour" => {
            let y = params.year.unwrap_or(now_sh.year());
            let mo = params.month.unwrap_or(now_sh.month() as i32) as u32;
            let d = params.day.unwrap_or(now_sh.day() as i32) as u32;
            let h = params.hour.unwrap_or(now_sh.hour() as i32) as u32;
            let (start, end) = utc_range(y, mo, d, h);

            #[derive(sqlx::FromRow)] struct RawRun { run_at: DateTime<Utc>, total: i32, passed: i32, failed: i32, results: Option<serde_json::Value> }
            let rows = sqlx::query_as::<_, RawRun>("SELECT run_at,total,passed,failed,results FROM feature_test_history WHERE run_at>=$1 AND run_at<$2 ORDER BY run_at")
                .bind(start).bind(end).fetch_all(&state.db).await.map_err(|e| { tracing::error!("Hour: {}", e); AppError::InternalError })?;

            let buckets: Vec<MinuteBucket> = rows.iter().map(|r| {
                let sh_time = r.run_at.with_timezone(&TZ);
                let minute = sh_time.format("%M").to_string();
                let ts = sh_time.format("%Y-%m-%dT%H:%M:%S+08:00").to_string();
                let mut ff = None;
                if r.failed > 0 {
                    if let Some(ref arr) = r.results.as_ref().and_then(|v| v.as_array()) {
                        let features: Vec<FailedFeature> = arr.iter().filter(|i| !i.get("status").and_then(|s| s.as_bool()).unwrap_or(true)).map(|i| FailedFeature {
                            feature_id: i.get("feature_id").and_then(|v| v.as_str()).unwrap_or("?").into(),
                            feature_name: i.get("feature_name").and_then(|v| v.as_str()).unwrap_or("?").into(),
                            module: i.get("module").and_then(|v| v.as_str()).unwrap_or("?").into(),
                            error_message: i.get("error_message").and_then(|v| v.as_str()).map(|s| s.into()),
                        }).collect();
                        if !features.is_empty() { ff = Some(features); }
                    }
                }
                MinuteBucket { label: format!(":{}", minute), timestamp: ts, total: r.total, passed: r.passed, failed: r.failed, failed_features: ff }
            }).collect();
            Ok(Json(serde_json::json!({"granularity":"hour","year":y,"month":mo,"day":d,"hour":h,"buckets":buckets})))
        }

        _ => Err(AppError::BadRequest("Invalid granularity. Use: year, month, day, hour".into())),
    }
}
