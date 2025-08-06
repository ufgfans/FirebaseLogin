#!/bin/bash

echo "🚀 Preparing Vercel deployment..."

# First, login to Vercel (if not already logged in)
echo "📝 Logging into Vercel..."
npx vercel login

# Set the Firebase service account as environment variable
echo "🔐 Setting Firebase service account environment variable..."
FIREBASE_SERVICE_ACCOUNT=$(cat backend/serviceAccount.json | tr -d '\n' | tr -d ' ')
npx vercel env add FIREBASE_SERVICE_ACCOUNT production <<< "$FIREBASE_SERVICE_ACCOUNT"

# Optional: Set the same for preview and development environments
echo "🔧 Setting environment variable for preview environment..."
npx vercel env add FIREBASE_SERVICE_ACCOUNT preview <<< "$FIREBASE_SERVICE_ACCOUNT"

echo "🔧 Setting environment variable for development environment..."
npx vercel env add FIREBASE_SERVICE_ACCOUNT development <<< "$FIREBASE_SERVICE_ACCOUNT"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment complete!"
echo "📖 Your application should now be live on Vercel."
echo ""
echo "🔍 To check deployment status:"
echo "   npx vercel ls"
echo ""
echo "🌐 To see your app:"
echo "   npx vercel --prod --no-wait"
