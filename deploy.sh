#!/bin/bash
# Deployment script for Shrawasti API
# This script deploys migrations to remote Supabase and restarts the Vercel deployment

set -e

echo "=== Shrawasti API Deployment Script ==="

# 1. Ensure we're in the API directory
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

# 2. Run Supabase migrations on remote
echo "Running migrations on Supabase..."
npx supabase@latest db push \
  --ref "https://www.supabase.io/docs/reference/command-line/db-push" \
  2>&1 || echo "Migrations may need to be run manually in Supabase dashboard"

# 3. Build and deploy to Vercel (if package.json has vercel.json)
if [ -f "vercel.json" ]; then
  echo "Deploying to Vercel..."
  npx vercel@latest --prod --confirm 2>&1 || echo "Manual deployment may be required"
else
  echo "No vercel.json found - skipping Vercel deployment"
fi

echo "=== Deployment complete ==="