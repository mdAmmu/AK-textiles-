#!/usr/bin/env bash
# Builds the frontend locally and deploys it to the AK Textiles EC2
# server: packages the build, copies it up, and unpacks it into the
# folder Nginx serves from.
#
# Usage:
#   ./deploy/deploy-frontend.sh /path/to/ak-textiles-key.pem
#
# Config (server IP/user, branch, etc.) lives in deploy/deploy.conf —
# edit that file instead of this script for routine changes. Any of
# those values can also be overridden per-run via environment
# variables, e.g.:
#   FRONTEND_BRANCH=develop ./deploy/deploy-frontend.sh /path/to/key.pem

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="${DEPLOY_CONFIG:-$SCRIPT_DIR/deploy.conf}"
if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=deploy.conf
  source "$CONFIG_FILE"
fi

: "${SERVER_IP:=13.126.206.134}"
: "${SERVER_USER:=ubuntu}"
: "${FRONTEND_BRANCH:=master}"
: "${REMOTE_FRONTEND_DIR:=/var/www/ak-textiles-frontend}"

KEY_PATH="${1:-}"

if [ -z "$KEY_PATH" ]; then
  echo "Usage: $0 /path/to/ak-textiles-key.pem"
  exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
  echo "Key file not found: $KEY_PATH"
  exit 1
fi

FRONTEND_DIR="$REPO_ROOT/frontend"
ARCHIVE="/tmp/ak-textiles-frontend-dist.tar.gz"

cd "$REPO_ROOT"
ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
CHECKED_OUT_OTHER_BRANCH=false

if [ "$ORIGINAL_BRANCH" != "$FRONTEND_BRANCH" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "Error: you have uncommitted changes, and deploying branch" \
         "'${FRONTEND_BRANCH}' requires switching away from" \
         "'${ORIGINAL_BRANCH}'. Commit or stash your changes first."
    exit 1
  fi
  echo "==> Switching to branch ${FRONTEND_BRANCH} (currently on ${ORIGINAL_BRANCH})"
  git fetch origin
  git checkout "$FRONTEND_BRANCH"
  git pull origin "$FRONTEND_BRANCH"
  CHECKED_OUT_OTHER_BRANCH=true
fi

restore_branch() {
  if [ "$CHECKED_OUT_OTHER_BRANCH" = true ]; then
    echo "==> Switching back to ${ORIGINAL_BRANCH}"
    git checkout "$ORIGINAL_BRANCH"
  fi
}
trap restore_branch EXIT

echo "==> Building frontend (branch: ${FRONTEND_BRANCH})"
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
sudo mkdir -p "${REMOTE_FRONTEND_DIR}"
sudo rm -rf "${REMOTE_FRONTEND_DIR}"/*
sudo tar -xzf ~/ak-textiles-frontend-dist.tar.gz -C "${REMOTE_FRONTEND_DIR}"
sudo find "${REMOTE_FRONTEND_DIR}" -name '._*' -delete
sudo chown -R www-data:www-data "${REMOTE_FRONTEND_DIR}"
sudo find "${REMOTE_FRONTEND_DIR}" -type d -exec chmod 755 {} \;
sudo find "${REMOTE_FRONTEND_DIR}" -type f -exec chmod 644 {} \;
rm ~/ak-textiles-frontend-dist.tar.gz
EOF

rm -f "$ARCHIVE"

echo "==> Checking site"
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://${SERVER_IP}/"

echo "==> Frontend deploy complete."
