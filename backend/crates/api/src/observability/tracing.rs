use opentelemetry::trace::TracerProvider;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::runtime::Tokio;
use opentelemetry_sdk::trace::SdkTracerProvider;
use opentelemetry_sdk::Resource;
use std::time::Duration;

/// Initialize OpenTelemetry tracer with OTLP exporter
///
/// Environment variables:
/// - OTEL_EXPORTER_OTLP_ENDPOINT: OTLP endpoint (default: http://localhost:4318)
/// - OTEL_SERVICE_NAME: Service name (default: blog-api)
/// - OTEL_SERVICE_VERSION: Service version
/// - OTEL_ENABLED: Enable OTel (default: true in production)
pub fn init_tracer() -> Option<()> {
    // Check if OTel is enabled
    let enabled = std::env::var("OTEL_ENABLED")
        .map(|v| v == "true")
        .unwrap_or_else(|_| {
            // Default: enabled in production
            std::env::var("ENVIRONMENT")
                .map(|e| e == "production")
                .unwrap_or(false)
        });

    if !enabled {
        tracing::info!("OpenTelemetry is disabled");
        return None;
    }

    let endpoint = std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:4318".to_string());

    let service_name =
        std::env::var("OTEL_SERVICE_NAME").unwrap_or_else(|_| "blog-api".to_string());

    let service_version = std::env::var("OTEL_SERVICE_VERSION")
        .unwrap_or_else(|_| env!("CARGO_PKG_VERSION").to_string());

    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_http()
        .with_endpoint(endpoint.clone())
        .with_timeout(Duration::from_secs(3))
        .build()
        .ok()?;

    let resource = Resource::builder()
        .with_attributes(vec![
            opentelemetry::KeyValue::new("service.name", service_name.clone()),
            opentelemetry::KeyValue::new("service.version", service_version),
            opentelemetry::KeyValue::new(
                "deployment.environment",
                std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
            ),
        ])
        .build();

    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(exporter)
        .with_resource(resource)
        .build();

    // Set the global tracer provider
    opentelemetry::global::set_tracer_provider(provider);

    tracing::info!(
        "OpenTelemetry tracer initialized with endpoint: {}",
        endpoint
    );

    Some(())
}

/// Shutdown OpenTelemetry gracefully
pub fn shutdown_tracer() {
    // The global tracer provider will be dropped automatically on program exit
    // This function exists for explicit shutdown if needed in the future
}
