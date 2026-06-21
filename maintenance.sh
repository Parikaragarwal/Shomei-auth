#!/bin/bash

echo "Stopping all containers..."
docker compose down

echo "Removing old images to ensure fresh builds..."
docker rmi oidc-auth-shomei_frontend oidc-auth-shomei_backend -f

echo "Clearing dangling volumes and networks..."
docker system prune -f

echo "Rebuilding and starting services..."
docker compose build --no-cache
docker compose up -d

echo "Starting Drizzle Studio on https://local.drizzle.studio"
# Run drizzle studio in the background via npm workspaces
npm run db:studio --workspace=backend &

echo "System maintenance complete! All services restarted."
