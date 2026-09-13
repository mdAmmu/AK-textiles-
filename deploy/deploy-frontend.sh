#!/usr/bin/env bash
# Builds the frontend locally and deploys it to the AK Textiles EC2
# server: packages the build, copies it up, and unpacks it into the
# folder Nginx serves from.
#
# Usage:
#   ./deploy/deploy-frontend.sh /path/to/ak-textiles-key.pem
#
# Optional environment variables:
#   SERVER_IP     - defaults to 13.126.206.134
#   SERVER_USER   - defaults to ubuntu
#   REMOTE_DIR    - defaults to /var/www/ak-textiles-frontend

set -euo pipefail

KEY_PATH="${1:-}"
SERVER_IP="${SERVER_IP:-13.126.206.134}"
SERVER_USER="${SERVER_USER:-ubuntu}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/ak-textiles-frontend}"

if [ -z "$KEY_PATH" ]; then
  echo "Usage: $0 /path/to/ak-textiles-key.pem"
  exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
  echo "Key file not found: $KEY_PATH"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
ARCHIVE="/tmp/ak-textiles-frontend-dist.tar.gz"

echo "==> Building frontend"
cd "$FRONTEND_DIR"
npm install
npm run build

echo "==> Packaging build"
tar -czf "$ARCHIVE" -C "$FRONTEND_DIR/dist" .

echo "==> Copying build to ${SERVER_USER}@${SERVER_IP}"
scp -i "$KEY_PATH" "$ARCHIVE" "${SERVER_USER}@${SERVER_IP}:~/ak-textiles-frontend-dist.tar.gz"

echo "==> Unpacking on server"
ssh -i "$KEY_PATH" "${SERVER_USER}@${SERVER_IP}" bash -s <<EOF
set -euo pipefail
sudo mkdir -p "${REMOTE_DIR}"
sudo rm -rf "${REMOTE_DIR}"/*
sudo tar -xzf ~/ak-textiles-frontend-dist.tar.gz -C "${REMOTE_DIR}"
sudo find "${REMOTE_DIR}" -name '._*' -delete
sudo chown -R www-data:www-data "${REMOTE_DIR}"
sudo find "${REMOTE_DIR}" -type d -exec chmod 755 {} \;
sudo find "${REMOTE_DIR}" -type f -exec chmod 644 {} \;
rm ~/ak-textiles-frontend-dist.tar.gz
EOF

rm -f "$ARCHIVE"

echo "==> Checking site"
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://${SERVER_IP}/"

echo "==> Frontend deploy complete."
