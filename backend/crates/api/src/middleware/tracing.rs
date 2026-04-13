//! W3C Trace Context propagation middleware
//!
//! Implements W3C Trace Context specification for distributed tracing.
//! See: https://www.w3.org/TR/trace-context/
//!
//! Traceparent header format: `version-trace_id-span_id-trace_flags`
//! Example: `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01`
//!
//! - version: 2 hex digits (currently 00)
//! - trace_id: 32 hex digits (128-bit)
//! - span_id: 16 hex digits (64-bit)
//! - trace_flags: 2 hex digits (01 = sampled)

use axum::{extract::Request, http::HeaderValue, middleware::Next, response::Response};
use std::sync::Arc;
use tracing::Span;

/// W3C Trace Context traceparent header name
pub const TRACEPARENT_HEADER: &str = "traceparent";

/// Trace context extracted from traceparent header
#[derive(Debug, Clone)]
pub struct TraceContext {
    /// Full traceparent header value
    pub traceparent: String,
    /// 128-bit trace ID (32 hex chars)
    pub trace_id: String,
    /// 64-bit span ID (16 hex chars)
    pub span_id: String,
    /// Trace flags (01 = sampled)
    pub trace_flags: String,
    /// W3C version (currently "00")
    pub version: String,
}

impl TraceContext {
    /// Parse traceparent header value
    ///
    /// Format: `version-trace_id-span_id-trace_flags`
    /// Example: `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01`
    pub fn parse(traceparent: &str) -> Option<Self> {
        let parts: Vec<&str> = traceparent.split('-').collect();
        if parts.len() != 4 {
            return None;
        }

        let (version, trace_id, span_id, trace_flags) = (parts[0], parts[1], parts[2], parts[3]);

        // Validate lengths
        if version.len() != 2
            || trace_id.len() != 32
            || span_id.len() != 16
            || trace_flags.len() != 2
        {
            return None;
        }

        // Validate hex characters
        if !trace_id.chars().all(|c| c.is_ascii_hexdigit())
            || !span_id.chars().all(|c| c.is_ascii_hexdigit())
            || !trace_flags.chars().all(|c| c.is_ascii_hexdigit())
        {
            return None;
        }

        Some(TraceContext {
            traceparent: traceparent.to_string(),
            trace_id: trace_id.to_string(),
            span_id: span_id.to_string(),
            trace_flags: trace_flags.to_string(),
            version: version.to_string(),
        })
    }

    /// Format traceparent for downstream propagation
    ///
    /// When propagating to child spans, we:
    /// - Keep the same trace_id
    /// - Generate a new span_id
    /// - Keep the same trace_flags (sampled status)
    pub fn format_for_propagation(&self, new_span_id: &str) -> String {
        format!(
            "{}-{}-{}-{}",
            self.version, self.trace_id, new_span_id, self.trace_flags
        )
    }
}

/// Generate a new 64-bit span ID (16 hex chars)
pub fn generate_span_id() -> String {
    use uuid::Uuid;
    let uuid = Uuid::new_v4();
    let bytes = uuid.as_bytes();
    // Use first 8 bytes for 64-bit span ID
    format!(
        "{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]
    )
}

/// Extract trace ID from traceparent header
pub fn extract_trace_id(traceparent: Option<&str>) -> Option<String> {
    traceparent
        .and_then(TraceContext::parse)
        .map(|ctx| ctx.trace_id)
}

/// Middleware to extract and propagate W3C Trace Context
///
/// This middleware:
/// 1. Extracts traceparent from incoming request headers
/// 2. Parses trace_id and span_id
/// 3. Stores trace context in request extensions
/// 4. Injects traceparent into response headers
/// 5. Adds trace_id to the current span for logging
pub async fn trace_context_middleware(mut request: Request, next: Next) -> Response {
    // Extract traceparent header
    let traceparent = request
        .headers()
        .get(TRACEPARENT_HEADER)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    // Parse trace context
    let trace_context = traceparent
        .as_ref()
        .and_then(|tp| TraceContext::parse(tp))
        .or_else(|| {
            // Generate new trace context if none provided
            let trace_id = generate_trace_id();
            let span_id = generate_span_id();
            Some(TraceContext {
                traceparent: format!("00-{}-{}01", trace_id, span_id),
                trace_id,
                span_id,
                trace_flags: "01".to_string(),
                version: "00".to_string(),
            })
        });

    // Get trace_id for span enrichment
    let trace_id = trace_context
        .as_ref()
        .map(|ctx| ctx.trace_id.clone())
        .unwrap_or_else(generate_trace_id);

    // Record trace_id in the current span for log enrichment
    Span::current().record("trace_id", trace_id.as_str());

    // Store trace context in request extensions
    if let Some(ref ctx) = trace_context {
        request.extensions_mut().insert(Arc::new(ctx.clone()));
    }

    // Continue to next middleware/handler
    let mut response = next.run(request).await;

    // Add traceparent to response headers if we have a trace context
    if let Some(ctx) = &trace_context {
        if let Ok(header_value) = HeaderValue::from_str(&ctx.traceparent) {
            response
                .headers_mut()
                .insert(TRACEPARENT_HEADER, header_value);
        }
    }

    response
}

/// Get trace context from request extensions
pub fn get_trace_context_from_request(request: &Request) -> Option<TraceContext> {
    request
        .extensions()
        .get::<Arc<TraceContext>>()
        .map(|ctx| (*ctx).as_ref().clone())
}

/// Generate a new 128-bit trace ID (32 hex chars)
fn generate_trace_id() -> String {
    use uuid::Uuid;
    let uuid = Uuid::new_v4();
    uuid.to_string().replace("-", "")
}

/// Inject traceparent header into an outgoing request
///
/// Use this when making downstream HTTP calls to propagate trace context.
pub fn inject_traceparent_to_request(request: &mut Request, trace_context: Option<&TraceContext>) {
    if let Some(ctx) = trace_context {
        let span_id = generate_span_id();
        let new_traceparent = ctx.format_for_propagation(&span_id);
        if let Ok(header_value) = HeaderValue::from_str(&new_traceparent) {
            request
                .headers_mut()
                .insert(TRACEPARENT_HEADER, header_value);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trace_context_parse_valid() {
        let tp = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
        let ctx = TraceContext::parse(tp).unwrap();

        assert_eq!(ctx.version, "00");
        assert_eq!(ctx.trace_id, "0af7651916cd43dd8448eb211c80319c");
        assert_eq!(ctx.span_id, "b7ad6b7169203331");
        assert_eq!(ctx.trace_flags, "01");
    }

    #[test]
    fn test_trace_context_parse_invalid() {
        // Invalid: wrong number of parts
        assert!(TraceContext::parse("invalid").is_none());
        // Invalid: trace_id too short
        assert!(
            TraceContext::parse("00-0af7651916cd43dd8448eb211c8031c-b7ad6b7169203331-01").is_none()
        );
        // Invalid: span_id too short
        assert!(
            TraceContext::parse("00-0af7651916cd43dd8448eb211c80319c-b7ad6b716920333-01").is_none()
        );
        // Invalid: non-hex characters
        assert!(
            TraceContext::parse("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-0x")
                .is_none()
        );
    }

    #[test]
    fn test_trace_context_format_for_propagation() {
        let tp = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
        let ctx = TraceContext::parse(tp).unwrap();
        let new_span_id = "1234567890abcdef";
        let new_tp = ctx.format_for_propagation(new_span_id);

        assert_eq!(
            new_tp,
            "00-0af7651916cd43dd8448eb211c80319c-1234567890abcdef-01"
        );
    }

    #[test]
    fn test_generate_span_id() {
        let span_id = generate_span_id();
        assert_eq!(span_id.len(), 16);
        assert!(span_id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_generate_trace_id() {
        let trace_id = generate_trace_id();
        assert_eq!(trace_id.len(), 32);
        assert!(trace_id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_extract_trace_id() {
        let tp = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
        let trace_id = extract_trace_id(Some(tp));
        assert_eq!(
            trace_id,
            Some("0af7651916cd43dd8448eb211c80319c".to_string())
        );

        assert!(extract_trace_id(None).is_none());
    }
}
