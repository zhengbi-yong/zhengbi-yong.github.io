## Nginx 中创建新的配置文件
sudo nginx -t
sudo systemctl reload nginx

## 重新加载 Nginx
sudo systemctl reload nginx

## 查看错误日志
tail -f /var/log/nginx/error.log

## 修复语法错误
yarn lint --fix

## 赋予权限
chmod 644 /path/to/file
chmod 777 /home/ubuntu/BLOG/out

## 静态部署
corepack enable
$env:PWD = $(Get-Location).Path
EXPORT=1 UNOPTIMIZED=1 yarn build
sudo systemctl restart nginx 