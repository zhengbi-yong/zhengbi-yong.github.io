# Nginx Configuration

## Module Overview

Nginx reverse proxy configuration for the blog platform.

## Purpose

Provide high-performance reverse proxy, SSL termination, static file serving, and load balancing for frontend and backend services.

## Structure

```
deployments/nginx/
├── nginx.conf              # Main Nginx configuration
├── conf.d/                 # Site-specific configurations
│   └── blog.conf           # Blog platform site config
└── backend-specific/       # Backend-specific overrides (optional)
```

## Main Configuration (nginx.conf)

### User and Process Management

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;
```

**Settings**:
- **User**: `nginx` (non-root for security)
- **Worker Processes**: `auto` (matches CPU cores)
- **Error Log**: `/var/log/nginx/error.log` at `warn` level

### Events Configuration

```nginx
events {
    worker_connections 1024;
    use epoll;
}
```

**Settings**:
- **Connections**: 1024 per worker (adjust based on traffic)
- **Event Model**: `epoll` (Linux) for high performance

### HTTP Configuration

#### MIME Types

```nginx
include /etc/nginx/mime.types;
default_type application/octet-stream;
```

#### Logging Format

```nginx
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for"';

access_log /var/log/nginx/access.log main;
```

**Log Fields**:
- Client IP
- Remote user (if authenticated)
- Timestamp
- Request method, URI, protocol
- Status code
- Bytes sent
- Referer
- User agent
- X-Forwarded-For (original client IP)

#### Performance Optimization

```nginx
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
types_hash_max_size 2048;
client_max_body_size 20M;
```

**Directives**:
- **sendfile**: Efficient file transfer (kernel-space copying)
- **tcp_nopush**: Optimize packet sending
- **tcp_nodelay**: Disable Nagle's algorithm (reduce latency)
- **keepalive_timeout**: 65 seconds (persistent connections)
- **client_max_body_size**: 20MB (max upload size)

#### Gzip Compression

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss
           application/rss+xml font/truetype font/opentype
           application/vnd.ms-fontobject image/svg+xml;
```

**Settings**:
- **Enabled**: Yes
- **Vary Header**: `Accept-Encoding` (for caches)
- **Proxied**: Compress all proxied requests
- **Level**: 6 (balance speed/compression)
- **Types**: Text, JSON, JavaScript, CSS, fonts, SVG

#### Site Configurations

```nginx
include /etc/nginx/conf.d/*.conf;
```

Loads all site configurations from `conf.d/`.

## Site Configuration (conf.d/blog.conf)

### Frontend Reverse Proxy

```nginx
location / {
    proxy_pass http://frontend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Features**:
- WebSocket support (Upgrade header)
- Real client IP forwarding
- Protocol forwarding (http/https)
- Cache bypass for dynamic content

### Backend API Proxy

```nginx
location /api {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Same features as frontend**, different upstream.

## Upstream Configuration

### Service Discovery

```nginx
# For Docker Compose
upstream frontend {
    server frontend:3001;
}

upstream backend {
    server backend:3000;
}
```

### Load Balancing (Optional)

```nginx
upstream backend {
    server backend1:3000 weight=3;
    server backend2:3000 weight=2;
    server backend3:3000 backup;
}
```

## SSL Configuration

### Certificate Setup

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

### Let's Encrypt

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (configured automatically)
certbot renew --dry-run
```

### HTTP to HTTPS Redirect

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Static File Serving

### Frontend Build Files

```nginx
location /_next/static {
    alias /var/www/frontend/.next/static;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /static {
    alias /var/www/frontend/public/static;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Uploads

```nginx
location /uploads {
    alias /var/www/uploads;
    expires 1M;
    add_header Cache-Control "public";
}
```

## Caching Strategy

### Proxy Cache

```nginx
# Define cache path
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=blog_cache:10m max_size=1g inactive=60m;

# Use cache for static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    proxy_pass http://frontend:3001;
    proxy_cache blog_cache;
    proxy_cache_valid 200 7d;
    proxy_cache_use_stale error timeout invalid_header updating;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Rate Limiting

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Apply to API
location /api {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend:3000;
}
```

## Logging Configuration

### Access Logs

```nginx
# Format
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for"';

# Custom format for API
log_format api '$remote_addr - [$time_local] "$request" '
               '$status $body_bytes_sent '
               'rt=$request_time uct="$upstream_connect_time" '
               'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/access.log main;
access_log /var/log/nginx/api.log api;
```

## Monitoring

### Health Check Endpoint

```nginx
location /nginx-health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### Status Page (Stub Status)

```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

## Docker Integration

### docker-compose.yml

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./deployments/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./deployments/nginx/conf.d:/etc/nginx/conf.d:ro
    - ./deployments/nginx/ssl:/etc/nginx/ssl:ro
    - ./uploads:/var/www/uploads:ro
  depends_on:
    - frontend
    - backend
  networks:
    - blog_network
```

## Testing Configuration

### Syntax Check

```bash
nginx -t
```

### Reload Configuration

```bash
nginx -s reload
```

### Test Upstream

```bash
curl -H "Host: yourdomain.com" http://localhost/
curl -H "Host: yourdomain.com" http://localhost/api/healthz
```

## Performance Tuning

### Worker Connections

```nginx
events {
    worker_connections 2048;  # Increase for high traffic
}
```

### Buffer Sizes

```nginx
client_body_buffer_size 128k;
client_max_body_size 20M;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;
```

### Timeouts

```nginx
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 65;
send_timeout 10;
```

## Troubleshooting

### 502 Bad Gateway

**Causes**:
- Backend service not running
- Wrong upstream address
- Firewall blocking connection

**Debug**:
```bash
# Check upstream
docker ps | grep backend

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Test backend connection
curl http://backend:3000/healthz
```

### 504 Gateway Timeout

**Causes**:
- Backend request too slow
- Insufficient timeout settings

**Solution**:
```nginx
proxy_connect_timeout 300;
proxy_send_timeout 300;
proxy_read_timeout 300;
send_timeout 300;
```

### WebSocket Fails

**Missing headers**:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Related Modules

- **Deployment Scripts**: `../scripts/` - Nginx setup automation
- **Docker Compose**: `../../docker-compose.yml` - Service orchestration
- **SSL Certificates**: `../nginx/ssl/` - Certificate storage

## Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt with Nginx](https://letsencrypt.org/getting-started/)

---

**Last Updated**: 2026-01-03
**Maintained By**: DevOps Team
