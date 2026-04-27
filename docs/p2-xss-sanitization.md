# P2: XSS Sanitization — Defense in Depth

## Threat Model

Three XSS vectors identified:

| # | Vector | Location | Severity | Root Cause |
|---|--------|----------|----------|------------|
| V1 | **Backend raw HTML in `content_mdx`** | Rust API `/posts/{slug}` response | HIGH | `get_post_response()` passes `content_mdx` raw to JSON — malicious HTML goes straight to frontend |
| V2 | **Backend `content_html` field** | Same API response | HIGH | Pre-rendered HTML stored in DB without sanitization |
| V3 | **Shiki output injection** | `mdx-shiki-postprocess.ts` → `dangerouslySetInnerHTML` | MEDIUM | Shiki HTML injected without DOMPurify pass |

> **Note:** V3 is lower severity because Shiki processes **code content** (text nodes), not HTML markup. A `<script>` tag inside a code block would be escaped by Shiki's HTML escaping. However, if the MDX → HTML pipeline has any intermediate step that could inject raw HTML, V3 becomes critical. Defense in depth applies.

---

## V1 + V2: Backend Sanitization (Rust / Ammonia)

### Existing Pattern

`crates/api/src/routes/comments.rs` lines 14-25:

```rust
fn sanitize_comment_html(input: &str) -> String {
    Builder::default()
        .add_tags(&["p", "br", "strong", "em", "code", "pre", "a", "blockquote"])
        .add_tag_attributes("a", &["href", "title"])
        .add_tag_attributes("pre", &["class"])
        .add_tag_attributes("code", &["class"])
        .link_rel(Some("nofollow ugc"))
        .url_relative(ammonia::UrlRelative::PassThrough)
        .clean(input)
        .to_string()
}
```

### Post Content Tag Set

Posts support a richer set of tags than comments (headings, tables, lists, KaTeX, etc.):

```rust
fn sanitize_post_content(input: &str) -> String {
    Builder::default()
        .add_tags(&[
            // Block structure
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "br", "hr",
            // Lists
            "ul", "ol", "li",
            // Semantic
            "strong", "em", "del", "sup", "sub", "mark",
            "code", "pre",
            // Media / links
            "a", "img", "video", "audio",
            // Container
            "blockquote", "details", "summary",
            // Table
            "table", "thead", "tbody", "tfoot",
            "tr", "th", "td",
            // KaTeX / math
            "span", "div",
            // accessibility
            "abbr", "cite", "dfn",
        ])
        .add_tag_attributes("a", &["href", "title", "target", "rel"])
        .add_tag_attributes("img", &["src", "alt", "title", "width", "height"])
        .add_tag_attributes("video", &["src", "controls", "width", "height", "poster"])
        .add_tag_attributes("audio", &["src", "controls"])
        .add_tag_attributes("td", &["colspan", "rowspan"])
        .add_tag_attributes("th", &["colspan", "rowspan", "scope"])
        // KaTeX: preserve math class spans
        .add_tag_attributes("span", &["class", "dir"])
        .add_tag_attributes("div", &["class", "dir"])
        // Prism/Shiki code highlighting
        .add_class(&["pre", "code"], "highlight")
        // Disallow scripts and event handlers
        .link_rel(Some("nofollow noopener ugc"))
        .url_relative(ammonia::UrlRelative::PassThrough)
        .clean(input)
        .to_string()
}
```

### Where to Apply

In `crates/api/src/routes/posts.rs` — `get_post_response()` function (~lines 620-640):

**Before** (current, unsafe):
```rust
let content = { /* raw content_mdx or derived mdx, no sanitization */ };
let content_html = row.content_html.as_ref().map(...);
```

**After** (safe):
```rust
let content = sanitize_post_content(&{ /* raw content_mdx or derived mdx */ });
let content_html = row.content_html.as_ref()
    .map(|h| sanitize_post_content(h));
```

Also apply to `get_posts_response()` list endpoint for consistency.

---

## V3: Frontend Shiki Output Sanitization

### Existing Sanitizer

`frontend/src/lib/security/sanitize.ts` has:

```typescript
import { sanitize } from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    ALLOWED_TAGS: [
      'h1','h2','h3','h4','h5','h6','p','br','hr',
      'ul','ol','li',
      'strong','em','del','sup','sub','mark',
      'code','pre',
      'a','img','video','audio',
      'blockquote','details','summary',
      'table','thead','tbody','tfoot','tr','th','td',
      'span','div',
      'abbr','cite','dfn',
    ],
    ADD_ATTR: ['target', 'rel', 'class', 'dir', 'colspan', 'rowspan', 'scope'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    ALLOW_DATA_ATTR: true,
  });
}
```

### Modification Needed

`mdx-shiki-postprocess.ts` — after Shiki produces HTML, sanitize before JSX injection:

```typescript
import { sanitizeHtml } from '@/lib/security/sanitize';

// In highlightCodeBlocks():
const sanitizedHtml = sanitizeHtml(rawShikiHtml);
```

**Constraint**: `sanitizeHtml` is async (DOMPurify needs DOM), but `highlightCodeBlocks` is synchronous. Options:
1. Use `DOMPurify.sync` via `dompurify` package directly (not `isomorphic-dompurify`)
2. Make `highlightCodeBlocks` async and await sanitization
3. Apply sanitization at a different point in the pipeline

**Recommended**: Use `dompurify` directly (synchronous) in the Shiki postprocess. Check if already installed.

### Performance Note

Since Shiki processes **static code content** (not user-submitted HTML), and Shiki itself escapes HTML-special chars in code text, V3 sanitization is defense-in-depth only. The primary fix is V1+V2.

---

## Testing Strategy

### Backend Tests

Add to `crates/api/src/routes/posts.rs` tests:

```rust
#[test]
fn test_sanitize_post_content_removes_script() {
    let input = r#"<p>Hello</p><script>alert('xss')</script>"#;
    let output = sanitize_post_content(input);
    assert!(!output.contains("<script>"));
    assert!(output.contains("<p>Hello</p>"));
}

#[test]
fn test_sanitize_post_content_allows_katex() {
    let input = r#"<span class="katex"><span class="katex-mathml">...</span></span>"#;
    let output = sanitize_post_content(input);
    assert!(output.contains("katex"));
}

#[test]
fn test_sanitize_post_content_allows_shiki_classes() {
    let input = r#"<pre class="highlight shiki github-dark"><code class="language-python">...</code></pre>"#;
    let output = sanitize_post_content(input);
    assert!(output.contains("shiki"));
}
```

### Frontend Tests

```typescript
// __tests__/lib/security/sanitize.test.ts
describe('sanitizeHtml', () => {
  it('removes script tags', async () => {
    const input = '<p>test</p><script>alert(1)</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>test</p>');
  });

  it('preserves KaTeX spans', async () => {
    const input = '<span class="katex">...</span>';
    const result = sanitizeHtml(input);
    expect(result).toContain('katex');
  });

  it('preserves Shiki classes', async () => {
    const input = '<pre class="shiki github-dark"><code>...</code></pre>';
    const result = sanitizeHtml(input);
    expect(result).toContain('shiki');
  });
});
```

---

## Implementation Checklist

- [ ] **R1**: Add `sanitize_post_content()` function to `crates/api/src/routes/posts.rs`
- [ ] **R2**: Apply sanitization to `content` and `content_html` in `get_post_response()`
- [ ] **R3**: Apply sanitization to list endpoint `get_posts_response()`
- [ ] **R4**: Add Rust tests for `sanitize_post_content()`
- [ ] **R5**: Run `cargo test -p blog-api` — all must pass
- [ ] **F1**: Verify `dompurify` (not `isomorphic-dompurify`) is available for sync API
- [ ] **F2**: Add `sanitizeHtml` pass in `mdx-shiki-postprocess.ts`
- [ ] **F3**: Add frontend tests for sanitizeHtml with KaTeX + Shiki preservation
- [ ] **F4**: Run `pnpm vitest --run` — all must pass
- [ ] **F5**: `pnpm build` — must succeed

---

## Constraints

1. **Ammonia is already in Cargo.toml** — no new Rust deps needed
2. **DOMPurify is already in devDependencies** — check if `dompurify` (sync) or `isomorphic-dompurify` (async) is used
3. **KaTeX spans must be preserved** — `class="katex"`, `class="katex-mathml"` etc.
4. **Shiki classes must be preserved** — `class="shiki github-dark"`, `class="line"` etc.
5. **No breaking changes** — sanitization is invisible to existing functionality
