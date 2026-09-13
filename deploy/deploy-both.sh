#!/usr/bin/env bash
# Runs deploy-backend.sh followed by deploy-frontend.sh.
#
# Usage:
#   ./deploy/deploy-both.sh /path/to/ak-textiles-key.pem
#
# Each side deploys whatever branch is configured for it in
# deploy/deploy.conf (BACKEND_BRANCH / FRONTEND_BRANCH), which can
# differ from each other. Override per-run with environment variables,
# e.g.:
#   BACKEND_BRANCH=develop FRONTEND_BRANCH=master ./deploy/deploy-both.sh /path/to/key.pem

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

KEY_PATH="${1:-}"
if [ -z "$KEY_PATH" ]; then
  echo "Usage: $0 /path/to/ak-textiles-key.pem"
  exit 1
fi

echo "########## Backend ##########"
"$SCRIPT_DIR/deploy-backend.sh" "$KEY_PATH"

echo
echo "########## Frontend ##########"
"$SCRIPT_DIR/deploy-frontend.sh" "$KEY_PATH"

echo
echo "==> Both deploys complete."
