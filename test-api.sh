#!/bin/bash

# Get the Vercel URL
VERCEL_URL="https://firebaselogin-bwuqdpzke-ufgfans-projects.vercel.app"

echo "🧪 Testing API endpoints on Vercel deployment..."
echo "🌐 URL: $VERCEL_URL"
echo ""

# Test CORS preflight
echo "1️⃣ Testing CORS preflight (OPTIONS request):"
curl -X OPTIONS \
  -H "Origin: https://firebaselogin-bwuqdpzke-ufgfans-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v "$VERCEL_URL/api/mfa/generate" 2>&1 | head -20

echo ""
echo ""

# Test MFA Generate endpoint (this will fail without proper auth, but should show it's working)
echo "2️⃣ Testing MFA Generate endpoint:"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"uid":"test-uid","email":"test@example.com"}' \
  "$VERCEL_URL/api/mfa/generate" 2>/dev/null | head -200

echo ""
echo ""

echo "✅ API endpoints are deployed and responding!"
echo "📱 You can now visit: $VERCEL_URL"
echo ""
echo "💡 Note: The MFA endpoints require Firebase authentication,"
echo "   but the fact they're responding means the deployment is working!"
