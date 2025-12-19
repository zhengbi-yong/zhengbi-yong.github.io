# Zhengbi Yong's Blog Platform

A sophisticated blogging platform built with modern web technologies, featuring both a high-performance Rust backend and a Next.js frontend.

## 📁 Project Structure

```
├── blog-backend/          # Rust API backend
│   ├── crates/           # Workspace crates
│   │   ├── api/         # HTTP API layer
│   │   ├── core/        # Core business logic
│   │   ├── db/          # Database models
│   │   ├── shared/      # Shared utilities
│   │   └── worker/      # Background jobs
│   ├── migrations/       # Database migrations
│   ├── docs/            # API documentation
│   └── .github/workflows/ # CI/CD pipelines
│
└── blog-frontend/        # Next.js frontend
    ├── app/             # App router pages
    ├── components/      # React components
    ├── lib/             # Utility functions
    ├── layouts/         # Page layouts
    ├── styles/          # Global styles
    ├── public/          # Static assets
    └── data/            # Blog content (MDX)
```

## 🚀 Getting Started

### Backend (Rust)

```bash
cd blog-backend
cargo build --release
cargo run
```

The API will be available at `http://localhost:3000`

### Frontend (Next.js)

```bash
cd blog-frontend
pnpm install
pnpm dev
```

The frontend will be available at `http://localhost:3001`

## 🛠 Tech Stack

### Backend
- **Language**: Rust
- **Framework**: Axum
- **Database**: PostgreSQL with SQLx
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **API Documentation**: OpenAPI (Swagger)
- **Monitoring**: Prometheus + health checks

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Content**: MDX with Contentlayer2
- **UI**: Custom components with Framer Motion
- **Code Highlighting**: Prism
- **Math**: KaTeX

## 📚 Documentation

- [Backend Implementation Guide](./blog-backend/docs/)
- [API Documentation](http://localhost:3000/swagger-ui)
- [Frontend Development Guide](./blog-frontend/)

## 🧪 Testing

### Backend
```bash
cd blog-backend
cargo test                    # Unit tests
cargo test --test integration # Integration tests
```

### Frontend
```bash
cd blog-frontend
pnpm test                     # Unit tests
pnpm test:e2e                 # End-to-end tests
```

## 🚀 Deployment

The project is designed for containerized deployment with Kubernetes. See individual project READMEs for detailed deployment instructions.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by [Zhengbi Yong](https://zhengbi-yong.github.io)