#!/usr/bin/env bash
# Redeploys the backend on the AK Textiles EC2 server: pulls the latest
# code, installs any new Python dependencies, runs database migrations,
# and restarts the systemd service.
#
# Usage:
#   ./deploy/deploy-backend.sh /path/to/ak-textiles-key.pem
#
# Optional environment variables:
#   SERVER_IP     - defaults to 13.126.206.134
#   SERVER_USER   - defaults to ubuntu
#   BRANCH        - defaults to master

set -euo pipefail

KEY_PATH="${1:-}"
SERVER_IP="${SERVER_IP:-13.126.206.134}"
SERVER_USER="${SERVER_USER:-ubuntu}"
BRANCH="${BRANCH:-master}"

if [ -z "$KEY_PATH" ]; then
  echo "Usage: $0 /path/to/ak-textiles-key.pem"
  exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
  echo "Key file not found: $KEY_PATH"
  exit 1
fi

echo "==> Deploying backend to ${SERVER_USER}@${SERVER_IP} (branch: ${BRANCH})"

ssh -i "$KEY_PATH" "${SERVER_USER}@${SERVER_IP}" bash -s <<EOF
set -euo pipefail
cd ~/ak-textiles
echo "--> Pulling latest code (${BRANCH})"
git checkout ${BRANCH}
git pull origin ${BRANCH}

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
