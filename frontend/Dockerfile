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

# 安装 pnpm (需要在 builder 阶段使用)
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 安装contentlayer（需要生成内容）
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 构建应用
RUN pnpm build

# Stage 3: 生产运行
FROM node:22-alpine AS runner
WORKDIR /app

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

# 启动应用
CMD ["node", "server.js"]
