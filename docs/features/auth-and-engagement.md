# Auth and Engagement

## Purpose

This area covers user identity, session refresh, comments, reading progress, and reader interaction features.

## Authentication model

- access tokens are created by the backend JWT service
- refresh tokens are stored server-side and returned in HTTP-only cookies
- login revokes old refresh tokens before issuing a new token family

Key code:

- [routes/auth.rs](../../../../../backend/crates/api/src/routes/auth.rs#L1)
- [middleware/auth.rs](../../../../../backend/crates/api/src/middleware/auth.rs)
- [core/auth.rs](../../../../../backend/crates/core/src/auth.rs)

## Comment system

- comments are attached to post slugs
- user-submitted HTML is sanitized before persistence
- nested comments are stored with path/depth metadata
- new comments start in `pending` status and require moderation

Key code:

- [routes/comments.rs](../../../../../backend/crates/api/src/routes/comments.rs#L1)
- [frontend/src/components/Comments.tsx](../../../../../frontend/src/components/Comments.tsx)
- [frontend/src/components/post](../../../../../frontend/src/components/post)

## Reading and personalization

- reading history, reading list, notifications, and profile pages exist in the app router
- reading progress APIs and UI live across frontend components and backend route modules

Relevant routes:

- [frontend/src/app/profile/page.tsx](../../../../../frontend/src/app/profile/page.tsx)
- [frontend/src/app/reading-history/page.tsx](../../../../../frontend/src/app/reading-history/page.tsx)
- [frontend/src/app/reading-list/page.tsx](../../../../../frontend/src/app/reading-list/page.tsx)
- [routes/reading_progress.rs](../../../../../backend/crates/api/src/routes/reading_progress.rs)

## Scaling properties

- stateless API replicas can serve auth and engagement traffic as long as they share PostgreSQL and Redis
- refresh token validation is database-backed, which supports multi-node deployments
- comment moderation workflow is asynchronous enough for moderate traffic, but high-volume comment systems will need stronger abuse controls

## Known boundaries

- password reset and forgot-password flows are still missing from the current product
- comment creation still uses a placeholder IP path and has a TODO for real IP extraction
- server-side session/token validation in middleware still has documented security gaps
