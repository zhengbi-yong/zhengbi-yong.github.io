# Getting Started Documentation

## Module Overview

Beginner-friendly guides for setting up and running the blog platform.

## Purpose

Provide the fastest path to running the blog system, whether for development, testing, or production deployment.

## Structure

```
docs/getting-started/
├── README.md                   # Navigation hub and quick start index
├── quick-start.md              # 5-minute quick start guide
├── installation.md             # Detailed installation instructions
├── environment-setup.md        # Environment configuration guide
├── troubleshooting.md          # Common issues and solutions
├── docker-quick-start.md       # Docker-specific quick start
├── local-development-windows.md # Windows development setup
├── local-development-macos.md   # macOS development setup
└── local-development-linux.md   # Linux development setup
```

## Documentation Philosophy

### Learning Paths

Documentation follows **cognitive learning principles**:

1. **Quick Start** → Get running immediately (5 minutes)
2. **Installation** → Detailed setup instructions (15 minutes)
3. **Environment Setup** → Configuration understanding (15 minutes)
4. **Platform-Specific** → Tailored for your OS (20 minutes)
5. **Troubleshooting** → Problem resolution (as needed)

### User Scenarios

**🌱 Beginner Users** (New to blogging):
- Goal: Start blogging quickly
- Path: Quick Start → Writing Guide → Content Management
- Time: 30-40 minutes

**💻 Developers** (Want to customize/extend):
- Goal: Set up development environment
- Path: Quick Start → Architecture → Development Setup
- Time: 1.5-2.5 hours

**🔧 DevOps Engineers** (Deploy to production):
- Goal: Production deployment
- Path: Quick Start → Deployment Guides → Security Best Practices
- Time: 1-2 hours

## Core Documents

### README.md

**Purpose**: Navigation hub for all getting started documentation

**Content**:
- Recommended starting points by user type
- Learning path recommendations
- Document overview
- Expected time investment
- Next steps after completion

**Key Sections**:
- **Recommended Starting Points** - User-type-specific paths
- **By Scenario** - Choose based on your goal
- **Document Navigation** - Complete index
- **Learning Tips** - How to approach documentation

### quick-start.md

**Purpose**: Fastest path to running system (5 minutes)

**Prerequisites**:
- Docker and Docker Compose installed
- Basic command line knowledge

**Steps**:
1. Clone repository
2. Copy environment files
3. Start with Docker Compose
4. Access the application
5. Verify it's working

**Outcome**: Fully functional blog in 5 minutes

### installation.md

**Purpose**: Detailed software installation guide

**Software Required**:

**For Docker Deployment**:
- Docker Engine (20.10+)
- Docker Compose (v2+)

**For Local Development**:
- Node.js 20+ and pnpm
- Rust 1.70+ and Cargo
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

**Platform-Specific Instructions**:
- Windows installation steps
- macOS installation steps
- Linux installation steps

### environment-setup.md

**Purpose**: Complete environment configuration guide

**Topics**:
- Environment variables overview
- Frontend configuration (.env.local)
- Backend configuration (.env)
- Docker environment (.env.docker)
- Production environment (.env.production)
- Secret generation and security

**Key Configuration**:
```bash
# Database
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=blog_db

# Backend
JWT_SECRET=minimum-32-characters-secret-key
PASSWORD_PEPPER=minimum-32-characters-pepper
SESSION_SECRET=minimum-32-characters-session-secret

# Frontend
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
```

### troubleshooting.md

**Purpose**: Common issues and solutions

**Categories**:

1. **Installation Issues**
   - Docker not starting
   - Port conflicts
   - Permission errors

2. **Database Issues**
   - Connection failures
   - Migration errors
   - Slow queries

3. **Application Issues**
   - Frontend not loading
   - Backend API errors
   - Authentication failures

4. **Performance Issues**
   - Slow response times
   - High memory usage
   - Database locks

## Platform-Specific Guides

### local-development-windows.md

**Purpose**: Complete Windows development setup

**Tools**:
- Windows Terminal (recommended)
- PowerShell 7+
- WSL2 (optional but recommended)
- Docker Desktop for Windows

**Steps**:
1. Install prerequisite software
2. Configure Windows Defender (if needed)
3. Set up WSL2 (recommended)
4. Install development tools
5. Configure environment
6. Start development servers
7. Verify setup

**Windows-Specific Considerations**:
- Path separators (backslash vs forward slash)
- Line endings (CRLF vs LF)
- Case sensitivity
- Firewall and antivirus
- WSL2 for better performance

### local-development-macos.md

**Purpose**: Complete macOS development setup

**Tools**:
- Homebrew (package manager)
- Terminal or iTerm2
- Docker Desktop for Mac

**Steps**:
1. Install Homebrew
2. Install dependencies via Homebrew
3. Configure environment
4. Start development servers
5. Verify setup

**macOS-Specific Considerations**:
- Homebrew package locations
- macOS firewall settings
- Keychain for secrets (optional)
- Performance tuning

### local-development-linux.md

**Purpose**: Complete Linux development setup

**Distributions Covered**:
- Ubuntu/Debian
- Fedora/CentOS
- Arch Linux

**Tools**:
- Native package manager (apt, dnf, pacman)
- Terminal emulator
- Docker Engine

**Steps**:
1. Install dependencies via package manager
2. Configure user permissions (docker group)
4. Configure environment
5. Start development servers
6. Verify setup

**Linux-Specific Considerations**:
- Package manager differences
- User permissions (sudo, docker group)
- Firewall (ufw, firewalld)
- SELinux (if enabled)

## Docker Quick Start

### docker-quick-start.md

**Purpose**: Fastest Docker-based setup

**Advantages**:
- No native dependencies
- Isolated environment
- Reproducible setup
- Easy cleanup

**Steps**:
1. Install Docker and Docker Compose
2. Clone repository
3. Copy environment template
4. Run `docker-compose up -d`
5. Access application

**Cleanup**:
```bash
docker-compose down -v    # Stop and remove volumes
```

## Quick Reference Table

| Task | Document | Time | Difficulty |
|------|----------|------|------------|
| **5-Minute Start** | [quick-start.md](quick-start.md) | 5 min | Easy |
| **Install Software** | [installation.md](installation.md) | 10-15 min | Medium |
| **Configure Env** | [environment-setup.md](environment-setup.md) | 15 min | Medium |
| **Windows Dev** | [local-development-windows.md](local-development-windows.md) | 20 min | Medium |
| **macOS Dev** | [local-development-macos.md](local-development-macos.md) | 20 min | Medium |
| **Linux Dev** | [local-development-linux.md](local-development-linux.md) | 20 min | Medium |
| **Fix Issues** | [troubleshooting.md](troubleshooting.md) | 5-10 min | Varies |

## Learning Recommendations

### First-Time Users

1. **Start with Docker** - Easiest path to success
2. **Read Quick Start** - Get familiar with the system
3. **Explore Features** - Try creating content
4. **Return to Docs** - Deepen understanding as needed

### Developers

1. **Quick Start** (5 min) - Verify system works
2. **Architecture Overview** - Understand design
3. **Platform Setup** - Your OS-specific guide
4. **Development Docs** - Start customizing

### DevOps Engineers

1. **Quick Start** (5 min) - Understand system
2. **Deployment Guides** - Production setup
3. **Security Best Practices** - Hardening
4. **Monitoring** - Production operations

## Common Workflows

### First-Time Setup

**New to the platform?**
```bash
# 1. Clone repository
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. Docker quick start
cp config/environments/.env.docker.example .env
docker-compose up -d

# 3. Access application
open http://localhost:3001
```

### Development Setup

**Want to develop locally?**
```bash
# 1. Install prerequisites (see installation.md)
# 2. Follow platform-specific guide
# 3. Configure environment
# 4. Start development servers
```

### Troubleshooting

**Encountering issues?**
1. Check [troubleshooting.md](troubleshooting.md)
2. Search [FAQ](../appendix/faq.md)
3. Check GitHub Issues
4. Ask for help

## Next Steps

### After Quick Start

**For Content Creation**:
- [Writing Guide](../guides/writing-guide.md)
- [Content Management](../guides/content-management.md)
- [MDX Syntax](../guides/mdx-guide.md)

**For Development**:
- [Development Documentation](../development/)
- [Architecture Overview](../development/concepts/architecture.md)
- [API Reference](../../backend/openapi/openapi.json)

**For Deployment**:
- [Deployment Documentation](../deployment/)
- [Production Server Guide](../deployment/guides/server/production-server.md)
- [Security Best Practices](../deployment/best-practices/security.md)

## Support Resources

### Documentation

- [FAQ](../appendix/faq.md) - Common questions
- [Glossary](../appendix/glossary.md) - Technical terms
- [Changelog](../appendix/changelog.md) - Version history

### Community

- GitHub Issues - Report bugs
- GitHub Discussions - Ask questions
- Contributing Guide - How to contribute

## Documentation Standards

### Bilingual Support

All content provided in:
- **English** - International users
- **中文** (Chinese) - Chinese-speaking users

### Progressive Disclosure

Information revealed progressively:
1. **Quick Start** - Minimal info to get running
2. **Detailed Guides** - More depth as needed
3. **Reference** - Complete information

### Practical Examples

Every guide includes:
- Step-by-step instructions
- Command examples
- Code snippets
- Configuration files
- Expected outputs

## Maintenance

### Update Schedule

- **Monthly**: Review and update quick start
- **Quarterly**: Major updates and improvements
- **As Needed**: Bug fixes and clarifications

### Quality Assurance

**Before publishing**:
1. Test all procedures
2. Verify commands work
3. Check links and references
4. Proofread for clarity
5. Test on multiple platforms

## Related Modules

- **Development Docs**: `../development/` - Development setup
- **Deployment Docs**: `../deployment/` - Production deployment
- **Configuration**: `../configuration/` - Configuration management
- **Environment Templates**: `../../config/environments/` - Environment examples

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/docs)
- [Rust Learning Resources](https://www.rust-lang.org/learn)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/tutorial/index.html)

---

**Last Updated**: 2026-01-03
**Maintained By**: Documentation Team
