@echo off
echo 🚀 Deploying Supabase Edge Functions...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Installing...
    npm install -g supabase
)

REM Login to Supabase (if not already logged in)
echo 🔐 Logging in to Supabase...
supabase login

REM Link to project
echo 🔗 Linking to project...
supabase link --project-ref vfzyxiuhrjrqhoxbdxwg

REM Deploy functions
echo 📦 Deploying check-membership function...
supabase functions deploy check-membership

echo 📦 Deploying post-to-channel function...
supabase functions deploy post-to-channel

echo ✅ All functions deployed successfully!
echo 🎯 You can now test the 'Post to Channel' feature
pause
