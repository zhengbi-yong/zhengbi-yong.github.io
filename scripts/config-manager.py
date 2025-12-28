#!/usr/bin/env python3
"""
配置管理脚本 - Python版本
跨平台支持，用于读取config.yml并生成配置文件
"""

import os
import sys
import yaml
import secrets
import shutil
from datetime import datetime
from pathlib import Path
import subprocess
import socket
import platform

# 颜色输出（跨平台）
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_info(msg):
    print(f"{Colors.GREEN}[INFO]{Colors.END} {msg}")

def log_warn(msg):
    print(f"{Colors.YELLOW}[WARN]{Colors.END} {msg}")

def log_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.END} {msg}")

def log_debug(msg):
    print(f"{Colors.BLUE}[DEBUG]{Colors.END} {msg}")

class ConfigManager:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.config_file = self.project_root / "config.yml"
        self.env_file = self.project_root / ".env"
        self.backup_dir = self.project_root / "backups" / "config"

    def load_config(self):
        """加载配置文件"""
        if not self.config_file.exists():
            log_error(f"配置文件不存在: {self.config_file}")
            sys.exit(1)

        with open(self.config_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

    def get_value(self, config, path, default=''):
        """从嵌套字典中获取值"""
        keys = path.split('.')
        value = config

        for key in keys:
            if isinstance(value, dict):
                value = value.get(key, {})
            else:
                return default

        return value if value not in [None, {}] else default

    def generate_secret(self, length=32):
        """生成随机密钥"""
        return secrets.token_urlsafe(length)

    def check_port(self, port):
        """检查端口是否被占用"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('127.0.0.1', port))
                return result == 0
        except:
            return False

    def get_port_process(self, port):
        """获取占用端口的进程（跨平台）"""
        system = platform.system().lower()

        try:
            if system == 'linux':
                # Linux: 使用lsof或ss
                if shutil.which('lsof'):
                    result = subprocess.run(
                        ['lsof', '-i', f':{port}', '-t'],
                        capture_output=True, text=True
                    )
                    return result.stdout.strip().split('\n') if result.stdout.strip() else []
                elif shutil.which('ss'):
                    result = subprocess.run(
                        ['ss', '-lntp', f'sport = {port}'],
                        capture_output=True, text=True
                    )
                    return result.stdout.strip().split('\n') if result.stdout.strip() else []

            elif system == 'darwin':
                # macOS: 使用lsof
                if shutil.which('lsof'):
                    result = subprocess.run(
                        ['lsof', '-i', f':{port}', '-t'],
                        capture_output=True, text=True
                    )
                    return result.stdout.strip().split('\n') if result.stdout.strip() else []

            elif system == 'windows':
                # Windows: 使用netstat
                result = subprocess.run(
                    ['netstat', '-ano'],
                    capture_output=True, text=True
                )
                lines = result.stdout.split('\n')
                pids = []
                for line in lines:
                    if f':{port}' in line and 'LISTENING' in line:
                        parts = line.split()
                        if len(parts) >= 5:
                            pid = parts[-1]
                            if pid not in pids:
                                pids.append(pid)
                return pids

        except Exception as e:
            log_debug(f"获取端口进程失败: {e}")

        return []

    def cleanup_port(self, port):
        """清理端口占用"""
        log_warn(f"正在清理端口 {port}...")

        pids = self.get_port_process(port)

        if not pids or (isinstance(pids, list) and len(pids) == 0):
            log_info(f"端口 {port} 未被占用")
            return True

        log_warn(f"发现进程占用端口 {port}:")
        for pid_info in pids:
            print(f"  - {pid_info}")

        try:
            response = input("是否终止这些进程? (y/n): ").strip().lower()

            if response == 'y':
                system = platform.system().lower()

                for pid in pids:
                    if isinstance(pid, str) and pid.isdigit():
                        if system == 'windows':
                            subprocess.run(['taskkill', '/F', '/PID', pid],
                                         capture_output=True)
                        else:
                            subprocess.run(['kill', '-9', pid],
                                         capture_output=True)
                        log_info(f"已终止进程 {pid}")

                log_info(f"端口 {port} 已释放")
                return True
            else:
                log_error("用户取消，端口仍被占用")
                return False

        except Exception as e:
            log_error(f"清理端口失败: {e}")
            return False

    def validate_config(self, config):
        """验证配置"""
        log_info("验证配置...")

        # 验证端口
        ports_config = self.get_value(config, 'ports', {})
        required_ports = ['frontend', 'backend', 'postgres', 'redis', 'nginx_http', 'nginx_https']

        ports = []
        for port_key in required_ports:
            port = self.get_value(ports_config, port_key)
            if not port:
                log_error(f"缺少端口配置: {port_key}")
                return False

            port = int(port)
            if port < 1024 or port > 65535:
                log_error(f"无效的端口号: {port}")
                return False

            ports.append(port)

        # 检查端口重复
        if len(set(ports)) != len(ports):
            log_error("发现重复的端口配置")
            return False

        log_info("配置验证通过 ✓")
        return True

    def backup_config(self):
        """备份现有配置"""
        if self.env_file.exists():
            self.backup_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f'env.backup.{timestamp}'

            shutil.copy2(self.env_file, backup_file)
            log_info(f"已备份配置到: {backup_file}")

            # 只保留最近10个备份
            backups = sorted(self.backup_dir.glob('env.backup.*'), reverse=True)
            for old_backup in backups[10:]:
                old_backup.unlink()

    def generate_env(self, config):
        """生成.env文件"""
        log_info("生成.env文件...")

        # 读取配置
        environment = self.get_value(config, 'system.environment', 'production')
        frontend_port = self.get_value(config, 'ports.frontend', '3001')
        backend_port = self.get_value(config, 'ports.backend', '3000')
        postgres_port = self.get_value(config, 'ports.postgres', '5432')
        redis_port = self.get_value(config, 'ports.redis', '6379')

        db_name = self.get_value(config, 'database.postgres.name', 'blog_db')
        db_user = self.get_value(config, 'database.postgres.user', 'blog_user')
        db_password = self.get_value(config, 'database.postgres.password', '') or self.generate_secret()

        redis_password = self.get_value(config, 'database.redis.password', '')

        jwt_secret = self.get_value(config, 'security.jwt_secret', '') or self.generate_secret()
        password_pepper = self.get_value(config, 'security.password_pepper', '') or self.generate_secret()
        session_secret = self.get_value(config, 'security.session_secret', '') or self.generate_secret()

        cors_origins = self.get_value(config, 'security.cors_origins', 'http://localhost:3001')
        rate_limit = self.get_value(config, 'security.rate_limit.requests_per_minute', '60')

        domain = self.get_value(config, 'domain.main', 'localhost')
        server_ip = self.get_value(config, 'domain.server_ip', '')

        smtp_enabled = self.get_value(config, 'email.enabled', False)

        # 生成环境文件内容
        env_content = f"""# ========================================
# 自动生成的配置文件
# 来源: config.yml
# 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
# ========================================

# 系统配置
ENVIRONMENT={environment}
TZ={self.get_value(config, 'system.timezone', 'Asia/Shanghai')}
RUST_LOG={self.get_value(config, 'system.log_level', 'info')}

# 端口配置
FRONTEND_PORT={frontend_port}
BACKEND_PORT={backend_port}
POSTGRES_PORT={postgres_port}
REDIS_PORT={redis_port}

# 数据库配置
POSTGRES_USER={db_user}
POSTGRES_PASSWORD={db_password}
POSTGRES_DB={db_name}

# Redis配置
REDIS_PASSWORD={redis_password}

# 安全配置
JWT_SECRET={jwt_secret}
PASSWORD_PEPPER={password_pepper}
SESSION_SECRET={session_secret}

# CORS配置
CORS_ALLOWED_ORIGINS={cors_origins}

# 限流配置
RATE_LIMIT_PER_MINUTE={rate_limit}

# 域名配置
NEXT_PUBLIC_SITE_URL={'https://' + domain if environment == 'production' else 'http://localhost'}
NEXT_PUBLIC_API_URL=http://localhost:{backend_port}
SERVER_IP={server_ip}
"""

        # 添加邮件配置（如果启用）
        if smtp_enabled:
            env_content += f"""
# 邮件配置
SMTP_HOST={self.get_value(config, 'email.smtp_host', '')}
SMTP_PORT={self.get_value(config, 'email.smtp_port', '587')}
SMTP_USERNAME={self.get_value(config, 'email.smtp_username', '')}
SMTP_PASSWORD={self.get_value(config, 'email.smtp_password', '')}
SMTP_FROM={self.get_value(config, 'email.from_address', '')}
"""

        # SSL配置
        env_content += f"""
# SSL配置
FORCE_HTTPS={str(self.get_value(config, 'domain.force_https', False)).lower()}

# 备份配置
BACKUP_ENABLED={str(self.get_value(config, 'backup.enabled', True)).lower()}
BACKUP_DIRECTORY={self.get_value(config, 'backup.directory', './backups')}
BACKUP_RETENTION_DAYS={self.get_value(config, 'backup.retention_days', '30')}
"""

        # 写入文件
        self.env_file.write_text(env_content)
        log_info(".env文件已生成 ✓")

    def show_summary(self, config):
        """显示配置摘要"""
        log_info("配置摘要：")
        print()

        print(f"{self.get_value(config, 'system.environment'):>20}: {self.get_value(config, 'system.environment')}")
        print(f"{'域名':>20}: {self.get_value(config, 'domain.main')}")
        print()
        print("端口配置：")
        print(f"{'前端':>20}: {self.get_value(config, 'ports.frontend')}")
        print(f"{'后端':>20}: {self.get_value(config, 'ports.backend')}")
        print(f"{'数据库':>20}: {self.get_value(config, 'ports.postgres')}")
        print(f"{'Redis':>20}: {self.get_value(config, 'ports.redis')}")
        print()

    def generate(self, auto_cleanup=False):
        """生成配置"""
        config = self.load_config()

        if not self.validate_config(config):
            sys.exit(1)

        # 端口处理
        if auto_cleanup:
            log_info("启用自动端口清理...")
            ports = [
                self.get_value(config, 'ports.frontend'),
                self.get_value(config, 'ports.backend'),
                self.get_value(config, 'ports.postgres'),
                self.get_value(config, 'ports.redis'),
                80,
                443
            ]

            for port in ports:
                if self.check_port(port):
                    self.cleanup_port(port)
        else:
            # 检查端口
            log_info("检查端口占用...")
            ports_conflicted = False

            ports_to_check = [
                (self.get_value(config, 'ports.frontend'), "前端"),
                (self.get_value(config, 'ports.backend'), "后端"),
                (self.get_value(config, 'ports.postgres'), "数据库"),
                (self.get_value(config, 'ports.redis'), "Redis"),
                (80, "Nginx HTTP"),
                (443, "Nginx HTTPS"),
            ]

            for port, name in ports_to_check:
                if self.check_port(port):
                    log_warn(f"端口 {port} ({name}) 已被占用")
                    ports_conflicted = True

            if ports_conflicted:
                print()
                response = input("是否自动清理端口占用? (y/n): ").strip().lower()

                if response == 'y':
                    for port, name in ports_to_check:
                        if self.check_port(port):
                            if not self.cleanup_port(port):
                                log_error("端口清理失败，无法继续")
                                sys.exit(1)
                else:
                    log_error("端口冲突未解决，无法继续")
                    sys.exit(1)

        self.backup_config()
        self.generate_env(config)
        self.show_summary(config)

        log_info("配置生成完成！")
        print()
        log_info("下一步：")
        print("  1. 检查生成的 .env 文件")
        print("  2. 如需修改，编辑 config.yml 后重新运行此脚本")
        print("  3. 运行部署脚本")


def main():
    """主函数"""
    print("=" * 40)
    print("  配置管理脚本 (Python)")
    print("=" * 40)
    print()

    if len(sys.argv) < 2:
        print("用法: python config-manager.py {validate|check-ports|cleanup-ports|generate} [auto-cleanup]")
        print()
        print("命令：")
        print("  validate         验证配置文件")
        print("  check-ports      检查端口占用")
        print("  cleanup-ports    清理端口占用")
        print("  generate         生成.env文件（默认）")
        print()
        print("选项：")
        print("  auto-cleanup     在generate时自动清理端口")
        sys.exit(1)

    manager = ConfigManager()
    action = sys.argv[1]
    auto_cleanup = len(sys.argv) > 2 and sys.argv[2] == 'auto-cleanup'

    if action == 'validate':
        config = manager.load_config()
        manager.validate_config(config)

    elif action == 'check-ports':
        config = manager.load_config()
        ports = [
            (manager.get_value(config, 'ports.frontend', 3001), "前端"),
            (manager.get_value(config, 'ports.backend', 3000), "后端"),
            (manager.get_value(config, 'ports.postgres', 5432), "数据库"),
            (manager.get_value(config, 'ports.redis', 6379), "Redis"),
            (80, "Nginx HTTP"),
            (443, "Nginx HTTPS"),
        ]

        for port, name in ports:
            if manager.check_port(port):
                log_warn(f"端口 {port} ({name}) 已被占用")
            else:
                log_info(f"端口 {port} ({name}) ✓ 可用")

    elif action == 'cleanup-ports':
        config = manager.load_config()
        ports = [
            manager.get_value(config, 'ports.frontend', 3001),
            manager.get_value(config, 'ports.backend', 3000),
            manager.get_value(config, 'ports.postgres', 5432),
            manager.get_value(config, 'ports.redis', 6379),
            80,
            443
        ]

        for port in ports:
            if manager.check_port(port):
                manager.cleanup_port(port)

    elif action == 'generate':
        manager.generate(auto_cleanup=auto_cleanup)

    else:
        log_error(f"未知命令: {action}")
        sys.exit(1)


if __name__ == '__main__':
    main()
