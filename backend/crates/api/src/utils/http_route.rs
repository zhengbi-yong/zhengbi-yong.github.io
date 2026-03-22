use axum::extract::{MatchedPath, Request};

pub fn normalized_route_label(request: &Request) -> String {
    request
        .extensions()
        .get::<MatchedPath>()
        .map(|matched| normalize_route_pattern(matched.as_str()))
        .unwrap_or_else(|| normalize_route_pattern(request.uri().path()))
}

pub fn normalize_route_pattern(path: &str) -> String {
    let normalized = path
        .strip_prefix("/api/v1")
        .or_else(|| path.strip_prefix("/v1"))
        .unwrap_or(path);

    normalized
        .split('/')
        .map(|segment| {
            if segment.is_empty() {
                ""
            } else if (segment.starts_with('{') && segment.ends_with('}'))
                || segment.parse::<uuid::Uuid>().is_ok()
                || segment.parse::<u64>().is_ok()
            {
                "*"
            } else {
                segment
            }
        })
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
mod tests {
    use super::normalize_route_pattern;

    #[test]
    fn strips_api_prefixes_and_normalizes_ids() {
        assert_eq!(
            normalize_route_pattern("/api/v1/posts/{slug}/comments"),
            "/posts/*/comments"
        );
        assert_eq!(
            normalize_route_pattern("/v1/comments/550e8400-e29b-41d4-a716-446655440000/like"),
            "/comments/*/like"
        );
        assert_eq!(normalize_route_pattern("/posts/42/view"), "/posts/*/view");
        assert_eq!(
            normalize_route_pattern("/health/detailed"),
            "/health/detailed"
        );
    }
}
