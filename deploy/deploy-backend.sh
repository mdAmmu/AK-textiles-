#!/usr/bin/env bash
# Redeploys the backend on the AK Textiles EC2 server: pulls the latest
# code, installs any new Python dependencies, runs database migrations,
# and restarts the systemd service.
#
# Usage:
#   ./deploy/deploy-backend.sh /path/to/ak-textiles-key.pem
#
# Config (server IP/user, branch, etc.) lives in deploy/deploy.conf —
# edit that file instead of this script for routine changes. Any of
# those values can also be overridden per-run via environment
# variables, e.g.:
#   BACKEND_BRANCH=develop ./deploy/deploy-backend.sh /path/to/key.pem

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${DEPLOY_CONFIG:-$SCRIPT_DIR/deploy.conf}"
if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=deploy.conf
  source "$CONFIG_FILE"
fi

: "${SERVER_IP:=13.126.206.134}"
: "${SERVER_USER:=ubuntu}"
: "${BACKEND_BRANCH:=master}"

KEY_PATH="${1:-}"

if [ -z "$KEY_PATH" ]; then
  echo "Usage: $0 /path/to/ak-textiles-key.pem"
  exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
  echo "Key file not found: $KEY_PATH"
  exit 1
fi

echo "==> Deploying backend to ${SERVER_USER}@${SERVER_IP} (branch: ${BACKEND_BRANCH})"

ssh -i "$KEY_PATH" "${SERVER_USER}@${SERVER_IP}" bash -s <<EOF
set -euo pipefail
cd ~/ak-textiles
echo "--> Pulling latest code (${BACKEND_BRANCH})"
git fetch origin
git checkout ${BACKEND_BRANCH}
git pull origin ${BACKEND_BRANCH}

cd backend
source venv/bin/activate

echo "--> Installing Python dependencies"
pip install -q -r requirements.txt

echo "--> Running database migrations"
alembic upgrade head

echo "--> Restarting ak-backend service"
sudo systemctl restart ak-backend
sleep 2
sudo systemctl status ak-backend --no-pager | head -5
EOF

echo "==> Checking health endpoint"
curl -s -w "\nHTTP %{http_code}\n" "http://${SERVER_IP}/health"

echo "==> Backend deploy complete."
