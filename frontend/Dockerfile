# 多阶段构建：Next.js 16 前端应用
# Stage 1: 依赖安装
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
# 安装依赖
RUN pnpm install --frozen-lockfile

# Stage 2: 构建应用
FROM node:22-alpine AS builder
WORKDIR /app

ARG APP_VERSION=dev
ARG VCS_REF=local
ARG BUILD_DATE=unknown
ARG NEXT_IGNORE_BUILD_ERRORS=0
ARG NEXT_IGNORE_ESLINT=0

# 安装 pnpm (需要在 builder 阶段使用)
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 清理 contentlayer 缓存以避免依赖问题
RUN rm -rf .contentlayer/.cache

# 安装contentlayer（需要生成内容）
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_IGNORE_BUILD_ERRORS=${NEXT_IGNORE_BUILD_ERRORS}
ENV NEXT_IGNORE_ESLINT=${NEXT_IGNORE_ESLINT}
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN pnpm build

# Stage 3: 生产运行
FROM node:22-alpine AS runner
WORKDIR /app

ARG APP_VERSION=dev
ARG VCS_REF=local
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="blog-frontend" \
      org.opencontainers.image.description="Next.js frontend runtime for the blog platform" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

ENV NODE_ENV=production
# 禁用遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 复制.next构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制contentlayer生成的文件（如果使用静态导出）
COPY --from=builder --chown=nextjs:nodejs /app/.contentlayer ./.contentlayer

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# 启动应用
CMD ["node", "server.js"]
