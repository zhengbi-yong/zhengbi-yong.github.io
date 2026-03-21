# 重复开发脚本归档

此目录包含已归档的开发启动脚本，因为根目录的 `start-dev.sh` 已经提供了统一的功能。

## 归档的脚本

### Linux脚本
- `scripts/dev_lin.sh` - Linux Bash版本启动脚本
- `scripts/dev_lin.nu` - Linux Nushell版本启动脚本

### 通用脚本
- `scripts/dev.nu` - 通用Nushell版本（功能最完整）
- `scripts/dev.ps1` - PowerShell版本

## 推荐使用

**主要启动脚本**: 根目录的 `start-dev.sh`
- 支持交互式选择启动后端/前端
- 自动检查数据库状态
- 支持全部停止功能

## 为什么归档

1. `start-dev.sh` 功能更完整，支持交互式菜单
2. 避免开发者困惑多个脚本的选择
3. 这些脚本保留以备未来参考或特定平台需求
