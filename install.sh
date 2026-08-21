#!/bin/bash
set -e

# ============================================================
# 碎碎 SuiSui — 一键安装脚本
# https://github.com/Linraintong/SuiSui
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[碎碎]${NC} $1"; }
ok()    { echo -e "${GREEN}[  ✓  ]${NC} $1"; }
err()   { echo -e "${RED}[  ✗  ]${NC} $1"; exit 1; }

# Check Docker
command -v docker &>/dev/null || err "请先安装 Docker：https://docs.docker.com/engine/install/"

info "欢迎使用碎碎 SuiSui 一键安装！"
echo ""

# === 配置 ===
read -p "数据目录（默认 /opt/suisui）: " DATA_DIR
DATA_DIR=${DATA_DIR:-/opt/suisui}

read -p "服务端口（默认 3742）: " PORT
PORT=${PORT:-3742}

echo ""
info "正在拉取最新镜像..."
docker pull linyumeng/suisui:latest

# === 创建数据目录 ===
mkdir -p "$DATA_DIR"
ok "数据目录: $DATA_DIR"

# === 停止并移除旧容器 ===
docker stop suisui 2>/dev/null && docker rm suisui 2>/dev/null && ok "已移除旧容器" || true

# === 启动容器 ===
docker run -d --name suisui --restart unless-stopped \
  -p "$PORT:3742" \
  -v "$DATA_DIR:/data" \
  linyumeng/suisui:latest \
  ./suisui -data /data

URL="http://你的IP:$PORT"
ok "已启动（端口 $PORT）"

echo ""
info "========================================"
info " 碎碎 SuiSui 安装完成！"
info " 访问地址: $URL"
info " 默认管理员: admin / admin"
info " 数据目录: $DATA_DIR"
info "========================================"
echo ""
info "查看日志: docker logs suisui"
info "停止服务: docker stop suisui"
info "启动服务: docker start suisui"
