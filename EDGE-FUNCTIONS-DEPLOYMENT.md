# 🚀 Supabase Edge Functions Deployment Guide

## Quick Deployment (Windows)

### Option 1: Automated Script
```bash
# Run the deployment script
deploy-functions.bat
```

### Option 2: Manual Commands
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vfzyxiuhrjrqhoxbdxwg

# Deploy functions
supabase functions deploy check-membership
supabase functions deploy post-to-channel
```

## Manual Deployment via Dashboard

### Step 1: Access Edge Functions
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vfzyxiuhrjrqhoxbdxwg`
3. Click "Edge Functions" in the left sidebar

### Step 2: Deploy check-membership Function
1. Click "Create a new function"
2. Name: `check-membership`
3. Copy the contents of `supabase/functions/check-membership/index.ts`
4. Paste into the editor
5. Click "Deploy function"

### Step 3: Deploy post-to-channel Function
1. Click "Create a new function"
2. Name: `post-to-channel`
3. Copy the contents of `supabase/functions/post-to-channel/index.ts`
4. Paste into the editor
5. Click "Deploy function"

### Step 4: Set Environment Variables
For each function, add these environment variables:
- `BOT_TOKEN`: `8093976132:AAGPMXwL61Y0xIirs9ieTKjX0ZTjP-4GSPw`

## Testing

After deployment, test the functions:

1. **Login to admin panel** with `admin123secure`
2. **Create a course** or use existing one
3. **Generate course link** → Click "Generate Link"
4. **Click "Post to Channel"** → Should post to your Telegram channel

## Troubleshooting

### Function Not Found (400 Error)
- Ensure functions are deployed with exact names: `check-membership` and `post-to-channel`
- Check that environment variables are set

### Bot Token Issues
- Verify `BOT_TOKEN` is correct in function environment variables
- Ensure bot has permission to post to the channel

### Channel Access Issues
- Verify `CHANNEL_CHAT_ID` is correct: `-1002730713649`
- Ensure bot is admin in the channel
