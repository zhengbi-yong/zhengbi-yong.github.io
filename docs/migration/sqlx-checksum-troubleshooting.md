# SQLx 迁移 Checksum 故障排查

记录 SQLx 数据库迁移过程中遇到的 checksum 不匹配问题及解决方案。

## 问题背景

在 Docker 本地构建并启动后端服务后，`migrate` 容器运行 `cargo sqlx migrate run` 时报错：

```
migration XXX was previously applied but has been modified
```

即使本地迁移文件与数据库中已有的迁移内容一致，SQLx 仍然报 checksum 不匹配。

## 根本原因

SQLx 0.8 使用 **SHA-384**（不是 SHA-256）来计算迁移文件的 checksum。Checksum 仅对 SQL 文件内容（不含 BOM）做哈希，不包含版本号、描述等元数据。

数据库表 `_sqlx_migrations` 中存储的 checksum 与 SQLx 重新计算的 checksum 不一致，可能是由于：

1. **文件编码变化** — 换行符（CRLF vs LF）、末尾空行变化
2. **文件内容被修改** — 即使只改了一个空格
3. **SQLx 版本差异** — 不同版本计算 checksum 的算法可能不同
4. **构建环境与运行环境不一致** — Docker 构建时生成的 `.sqlx` 缓存与运行时容器内的文件有差异

## 诊断步骤

### 1. 查看具体哪些迁移 checksum 不匹配

```bash
docker compose -f docker-compose.local.yml logs migrate
```

输出示例：
```
migration 2026041601 was previously applied but has been modified
migration 2026041702 was previously applied but has been modified
...
```

### 2. 进入数据库查看已记录的 checksum

```bash
docker compose -f docker-compose.local.yml exec postgres \
  psql -U blog_user -d blog_db \
  -c "SELECT version, checksum FROM _sqlx_migrations ORDER BY version;"
```

### 3. 计算迁移文件的正确 checksum

在数据库所在的容器内（确保与 SQLx 运行时环境一致）计算：

```bash
# 读取所有 SQL 文件内容，去掉末尾空行和 BOM，计算 SHA-384
docker compose -f docker-compose.local.yml exec postgres bash -c '
for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
    name=$(basename "$f")
    # SQLx 只取内容（去掉末尾空白和 BOM）的 SHA-384
    checksum=$(sed -e "s/\r//g" -e "/^[[:space:]]*$/d" -e "$ s/[[:space:]]*$//" "$f" \
        | openssl dgst -sha384 -binary | xxd -p -c 64)
    echo "$name → $checksum"
done
'
```

对于 Docker 迁移容器场景，更可靠的方式是通过 `docker run` 临时运行一个 migrate 容器来执行 SQL 更新。

## 解决方案

### 方法 1：更新数据库中的 checksum（推荐）

当确认迁移文件内容正确、只是 checksum 记录过期时，直接更新 `_sqlx_migrations` 表：

```sql
-- 先备份
CREATE TABLE _sqlx_migrations_backup AS SELECT * FROM _sqlx_migrations;

-- 逐条更新（从步骤 3 计算结果中获取正确的 checksum）
UPDATE _sqlx_migrations 
SET checksum = '\x<64-char-hex>' 
WHERE version = <migration_version>;
```

**批量更新示例**（在 PostgreSQL 容器内执行）：

```bash
docker compose -f docker-compose.local.yml exec postgres psql -U blog_user -d blog_db << 'EOF'
UPDATE _sqlx_migrations SET checksum = '\x...正确的checksum...' WHERE version = 2026041601;
UPDATE _sqlx_migrations SET checksum = '\x...正确的checksum...' WHERE version = 2026041702;
-- ... 依此类推
EOF
```

更新完成后重新运行 migrate：

```bash
docker compose -f docker-compose.local.yml up -d migrate
```

### 方法 2：重建数据库（开发环境）

如果数据库中没有重要数据，可以清空重建：

```bash
# 停止所有服务并删除数据卷
docker compose -f docker-compose.local.yml down -v

# 重新启动
docker compose -f docker-compose.local.yml up -d
```

⚠️ **警告**：这会删除所有数据，仅适用于开发环境。

### 方法 3：使用 sqlx-cli 手动修复

进入 migrate 容器手动操作：

```bash
# 临时启动一个有 sqlx-cli 的容器
docker run --rm -it \
  --network host \
  -v $(pwd)/backend/migrations:/migrations \
  -e DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  blog-backend:local \
  sqlx migrate info
```

## 预防措施

### 1. 使用 SQLx 离线模式构建

在 Dockerfile 的构建阶段，**先连接数据库生成 `.sqlx` 缓存**，然后启用 `SQLX_OFFLINE=true` 编译：

```dockerfile
# 生成离线缓存（仅构建时需要数据库连接）
RUN DATABASE_URL="postgresql://blog_user:blog_password@host.docker.internal:5432/blog_db" \
    cargo sqlx prepare --workspace

# 使用离线缓存编译
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin api
```

这确保编译阶段不会因数据库连接问题失败，且 `.sqlx` 缓存与迁移文件版本一致。

### 2. 保持迁移文件不可变

已应用到数据库的迁移文件**不应该再修改**。如果需要更改：

- 创建新的迁移文件（如 `20260501_new_changes.sql`）
- 不要在已有迁移文件中追加、删除或修改内容

### 3. 统一换行符

确保所有迁移文件使用一致的换行符（LF），避免 Git 在不同平台间自动转换：

```bash
# .gitattributes
*.sql text eol=lf
```

### 4. 版本锁定 SQLx

在 `Cargo.toml` 中锁定 SQLx 版本，避免跨版本 checksum 计算差异：

```toml
sqlx = { version = "=0.8.2", features = [...] }
```

## 快速参考

| 操作 | 命令 |
|------|------|
| 查看迁移状态 | `docker compose -f docker-compose.local.yml logs migrate` |
| 查看数据库 checksum | `SELECT version, checksum FROM _sqlx_migrations ORDER BY version;` |
| 更新单条 checksum | `UPDATE _sqlx_migrations SET checksum = '\x...' WHERE version = ...;` |
| 备份迁移表 | `CREATE TABLE _sqlx_migrations_backup AS SELECT * FROM _sqlx_migrations;` |
| 重建数据库 | `docker compose -f docker-compose.local.yml down -v && docker compose -f docker-compose.local.yml up -d` |
| 计算文件 SHA-384 | `openssl dgst -sha384 -binary file.sql \| xxd -p -c 64` |

## 相关文件

- `backend/migrations/` — 迁移 SQL 文件
- `backend/Dockerfile` — 构建时生成 `.sqlx` 缓存的阶段
- `backend/.sqlx/` — SQLx 离线查询缓存（Docker 镜像内）
- `docker-compose.local.yml` — `migrate` 服务定义
