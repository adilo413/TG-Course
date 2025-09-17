#!/bin/bash

# Deploy Supabase Edge Functions
echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Login to Supabase (if not already logged in)
echo "🔐 Logging in to Supabase..."
supabase login

# Link to project
echo "🔗 Linking to project..."
supabase link --project-ref jakqyuawjtkoupackdmo

# Deploy functions
echo "📦 Deploying check-membership function..."
supabase functions deploy check-membership

echo "📦 Deploying post-to-channel function..."
supabase functions deploy post-to-channel

echo "✅ All functions deployed successfully!"
echo "🎯 You can now test the 'Post to Channel' feature"
