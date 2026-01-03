# Deployment Configuration

## Module Overview

Deployment automation configuration for staging and production environments.

## Purpose

Provide deployment-specific settings, server connection details, and automation parameters.

## Structure

```
deployments/config/
└── deploy.config.example.json    # Deployment configuration template
```

## Configuration File

### deploy.config.example.json

**Purpose**: Deployment automation configuration template

**Structure**:
```json
{
  "server": "user@your-server-ip",
  "remotePath": "~/blog-deployment"
}
```

## Configuration Fields

### server

**Type**: `string`

**Format**: `{username}@{hostname_or_ip}`

**Examples**:
- `root@192.168.1.100`
- `ubuntu@server.example.com`
- `deploy@blog.yourdomain.com`

**Purpose**: SSH connection target for deployment

**Requirements**:
- SSH key-based authentication (recommended)
- Password authentication (not recommended)
- User must have:
  - Write access to `remotePath`
  - Docker/Sudo permissions
  - Git access (if deploying from Git)

### remotePath

**Type**: `string`

**Format**: Absolute or relative path (from user home)

**Examples**:
- `~/blog-deployment`
- `/var/www/blog`
- `/opt/blog-platform`

**Purpose**: Target directory on remote server

**Directory Structure** (created by deployment script):
```
~/blog-deployment/
├── docker-compose.yml
├── .env
├── backend/
├── frontend/
└── data/
```

## Usage

### Initial Setup

1. **Create configuration file**:
```bash
cp deployments/config/deploy.config.example.json deployments/config/deploy.config.json
```

2. **Edit configuration**:
```json
{
  "server": "ubuntu@192.168.1.100",
  "remotePath": "~/blog-deployment"
}
```

3. **Configure SSH access**:
```bash
# Copy SSH key to server
ssh-copy-id ubuntu@192.168.1.100

# Test connection
ssh ubuntu@192.168.1.100
```

4. **Run deployment**:
```bash
./deployments/scripts/deploy-server.sh
```

## Deployment Script Integration

### Script Usage

**deploy-server.sh** uses this configuration:

```bash
# Load configuration
CONFIG=$(cat deployments/config/deploy.config.json)
SERVER=$(echo "$CONFIG" | jq -r '.server')
REMOTE_PATH=$(echo "$CONFIG" | jq -r '.remotePath')

# Deploy
ssh "$SERVER" "mkdir -p $REMOTE_PATH"
rsync -avz ./ "$SERVER:$REMOTE_PATH/"
ssh "$SERVER" "cd $REMOTE_PATH && docker-compose up -d"
```

## Advanced Configuration

### Extended Configuration

For more complex deployments, extend the schema:

```json
{
  "server": "user@server-ip",
  "remotePath": "~/blog-deployment",
  "port": 22,
  "sshKeyPath": "~/.ssh/id_rsa",
  "branch": "main",
  "composeProject": "blog_platform",
  "healthCheckUrl": "https://yourdomain.com/healthz",
  "backupPath": "~/blog-backups",
  "notification": {
    "slackWebhook": "https://hooks.slack.com/...",
    "email": "devops@example.com"
  }
}
```

### Multi-Server Deployment

```json
{
  "servers": [
    {
      "name": "web-1",
      "server": "deploy@web-1.example.com",
      "remotePath": "~/blog"
    },
    {
      "name": "web-2",
      "server": "deploy@web-2.example.com",
      "remotePath": "~/blog"
    }
  ]
}
```

### Environment-Specific Configs

**Staging** (`deploy.config.staging.json`):
```json
{
  "server": "deploy@staging.example.com",
  "remotePath": "~/blog-staging",
  "branch": "develop"
}
```

**Production** (`deploy.config.production.json`):
```json
{
  "server": "deploy@production.example.com",
  "remotePath": "~/blog-production",
  "branch": "main"
}
```

## SSH Configuration

### SSH Config Entry

**~/.ssh/config**:
```
Host blog-deploy
    HostName 192.168.1.100
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/blog-deploy-key
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Usage**:
```json
{
  "server": "blog-deploy",
  "remotePath": "~/blog-deployment"
}
```

### SSH Key Generation

```bash
# Generate new key
ssh-keygen -t ed25519 -C "blog-deploy" -f ~/.ssh/blog-deploy-key

# Copy to server
ssh-copy-id -i ~/.ssh/blog-deploy-key.pub ubuntu@192.168.1.100
```

## Security Best Practices

### SSH Keys

**Recommendations**:
- Use ed25519 keys (more secure than RSA)
- Never commit private keys
- Use passphrase-protected keys
- Rotate keys regularly

**Permissions**:
```bash
chmod 600 ~/.ssh/blog-deploy-key
chmod 644 ~/.ssh/blog-deploy-key.pub
```

### Configuration File

**Gitignore**:
```
deployments/config/deploy.config.json
deployments/config/*.production.json
deployments/config/deploy.config.*.json
```

**Permissions**:
```bash
chmod 600 deployments/config/deploy.config.json
```

### Server User

**Create dedicated deploy user**:
```bash
# On server
sudo adduser deploy
sudo usermod -aG docker deploy
```

**Restrict permissions**:
- Only necessary sudo commands
- Read-only access to logs
- No direct database access

## Deployment Workflow

### Using Configuration

1. **Validate config**:
```bash
# Check JSON syntax
jq empty deployments/config/deploy.config.json

# Test SSH connection
ssh $(jq -r '.server' deployments/config/deploy.config.json) "echo 'Connected'"
```

2. **Deploy**:
```bash
./deployments/scripts/deploy-server.sh
```

3. **Health check**:
```bash
curl https://yourdomain.com/healthz
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Deploy to server
  env:
    SERVER: ${{ secrets.DEPLOY_SERVER }}
    SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
  run: |
    echo "$SSH_KEY" > deploy_key
    chmod 600 deploy_key
    scp -i deploy_key -r ./ ubuntu@$SERVER:~/blog-deployment/
    ssh -i deploy_key ubuntu@$SERVER "cd ~/blog-deployment && docker-compose up -d"
```

### GitLab CI

```yaml
deploy:
  script:
    - apk add openssh-client
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh ubuntu@$DEPLOY_SERVER "cd ~/blog-deployment && ./deploy.sh"
```

## Troubleshooting

### SSH Connection Failed

**Error**: `Connection refused`

**Solutions**:
1. Check server is running: `ping server-ip`
2. Check SSH port: `nc -zv server-ip 22`
3. Verify firewall rules
4. Check SSH service on server

### Permission Denied

**Error**: `Permission denied (publickey)`

**Solutions**:
1. Verify SSH key is copied: `ssh-copy-id`
2. Check key permissions: `chmod 600 ~/.ssh/key`
3. Verify authorized_keys on server
4. Test with verbose: `ssh -vvv user@server`

### Remote Path Issues

**Error**: `No such file or directory`

**Solutions**:
1. Create directory: `ssh server "mkdir -p ~/blog-deployment"`
2. Check permissions: `ssh server "ls -la ~/"`
3. Verify user has write access

### Deployment Script Fails

**Debug**:
```bash
# Enable debug output
bash -x ./deployments/scripts/deploy-server.sh

# Check configuration
cat deployments/config/deploy.config.json | jq '.'
```

## Related Modules

- **Deployment Scripts**: `../scripts/` - Deployment automation
- **Environment Config**: `../../config/environments/` - Environment variables
- **Docker Compose**: `../../docker-compose.yml` - Service definitions
- **Nginx Config**: `../nginx/` - Reverse proxy configuration

## Resources

- [SSH Manual](https://man.openbsd.org/ssh)
- [rsync Documentation](https://rsync.samba.org/documentation.html)
- [Docker Compose Deploy](https://docs.docker.com/compose/production/)

---

**Last Updated**: 2026-01-03
**Maintained By**: DevOps Team
