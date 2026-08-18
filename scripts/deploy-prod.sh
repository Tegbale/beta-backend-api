#!/usr/bin/env bash
set -e

SERVER="root@188.166.150.204"
APP_DIR="/var/www/tegbale-api"

echo "Deploying to production ($SERVER)..."

ssh "$SERVER" bash <<REMOTE
set -e

# Add swap if not already present (needed on 512MB droplet for tsc)
if ! swapon --show | grep -q /swapfile; then
  echo ""
  echo "==> Adding 1GB swap file..."
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap enabled."
else
  echo ""
  echo "==> Swap already active, skipping."
fi

cd $APP_DIR

echo ""
echo "==> Pulling latest code from main..."
git checkout -- package-lock.json
git pull origin main

echo ""
echo "==> Installing dependencies..."
npm install --production=false

echo ""
echo "==> Regenerating Prisma client..."
npx prisma generate

echo ""
echo "==> Building..."
npm run build

echo ""
echo "==> Running pending migrations..."
npx prisma migrate deploy

echo ""
echo "==> Restarting app..."
pm2 restart tegbale-api --update-env

echo ""
echo "==> App status:"
pm2 list

echo ""
echo "Deploy complete."
REMOTE
