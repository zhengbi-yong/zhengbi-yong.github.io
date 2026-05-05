# 审查报告：Docker 镜像升级和部署方案总结

> 审查时间：2026-05-05
> 文档路径：`docs/deployment/archive/DOCKER_UPGRADE_SUMMARY.md`
> 文件大小：6.1 KB / 288 行

## 审查结论：⚠️ 部分偏差

Docker 镜像升级的历史总结。大部分提到的脚本已不存在。

## 提到的文件

| 文件 | 状态 |
|------|------|
| `build-all.sh` | ❌ 不存在（在 scripts/deployment/ 下） |
| `deploy-server.sh` | ❌ 不存在（在 scripts/deployment/ 下） |
| `deploy-simple.sh` | ❌ 不存在 |
| `export-images.sh` | ❌ 不存在（在 scripts/deployment/ 下） |
| `fix-images.sh` | ❌ 不存在 |
| `push-images.sh` | ❌ 不存在（在 scripts/deployment/ 下） |
| `test-images.sh` | ❌ 不存在 |
| `test-local.sh` | ❌ 不存在 |

## 总结

- **总文件数**：8
- **✅ 存在**：0（0%）
- **❌ 不存在/路径变更**：8（100%）
- **文档过时**：脚本已移至 scripts/deployment/ 目录
