FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV HUSKY=0
ENV COREPACK_ENABLE_STRICT=0

ARG http_proxy
ARG https_proxy

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app

ARG APP_VERSION=dev
ARG VCS_REF=local
ARG BUILD_DATE=unknown
ARG NEXT_IGNORE_BUILD_ERRORS=0
ARG NEXT_IGNORE_ESLINT=0
ARG NEXT_PUBLIC_BACKEND_URL
ARG http_proxy
ARG https_proxy

ENV HUSKY=0
ENV COREPACK_ENABLE_STRICT=0
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_IGNORE_BUILD_ERRORS=${NEXT_IGNORE_BUILD_ERRORS}
ENV NEXT_IGNORE_ESLINT=${NEXT_IGNORE_ESLINT}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM node:22-alpine AS runner-base
WORKDIR /app

ARG APP_VERSION=dev
ARG VCS_REF=local
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="blog-frontend" \
      org.opencontainers.image.description="Next.js frontend runtime for the blog platform" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.data && \
    touch /app/.data/visitors.json && \
    chown -R nextjs:nodejs /app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const net=require('net');const s=net.createConnection({host:'127.0.0.1',port:3001},()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>{s.destroy();process.exit(1)},5000)"

FROM runner-base AS runner

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

CMD ["node", "server.js"]

FROM runner-base AS prebuilt-runner

COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs package.json ./package.json
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs .contentlayer ./.contentlayer

RUN set -eux; \
    if [ -d /app/node_modules/.pnpm ]; then \
      find /app/node_modules -type l | while read -r link_path; do \
        link_target="$(readlink "$link_path")"; \
        case "$link_target" in \
          *"/node_modules/.pnpm/"*) \
            suffix="${link_target##*node_modules/.pnpm/}"; \
            rm "$link_path"; \
            ln -s "/app/node_modules/.pnpm/$suffix" "$link_path"; \
            ;; \
        esac; \
      done; \
    fi

USER nextjs

CMD ["node", "server.js"]
