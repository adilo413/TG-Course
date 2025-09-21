# 🚀 Edge Functions Setup for New Supabase Project

## 📋 What You Need to Deploy

You have **2 Edge Functions** that need to be deployed to your new Supabase project:

1. **`post-to-channel`** - Posts course links to Telegram channels
2. **`check-membership`** - Checks if users are members of Telegram channels

## 🔧 Method 1: Using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link to Your New Project
```bash
supabase link --project-ref jakqyuawjtkoupackdmo
```

### Step 4: Deploy Functions
```bash
# Deploy check-membership function
supabase functions deploy check-membership

# Deploy post-to-channel function  
supabase functions deploy post-to-channel
```

## 🖥️ Method 2: Manual Deployment via Dashboard

### Step 1: Access Edge Functions
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jakqyuawjtkoupackdmo`
3. Click **"Edge Functions"** in the left sidebar

### Step 2: Deploy check-membership Function
1. Click **"Create a new function"**
2. **Name**: `check-membership`
3. **Copy** the contents of `supabase/functions/check-membership/index.ts`
4. **Paste** into the editor
5. Click **"Deploy function"**

### Step 3: Deploy post-to-channel Function
1. Click **"Create a new function"**
2. **Name**: `post-to-channel`
3. **Copy** the contents of `supabase/functions/post-to-channel/index.ts`
4. **Paste** into the editor
5. Click **"Deploy function"**

## 🔐 Step 4: Set Environment Variables

For **each function**, you need to add environment variables:

### Environment Variables Needed:
- **`BOT_TOKEN`**: `8093976132:AAGPMXwL61Y0xIirs9ieTKjX0ZTjP-4GSPw`

### How to Set Environment Variables:
1. **Go to Edge Functions** in your Supabase dashboard
2. **Click on each function** (check-membership, post-to-channel)
3. **Go to "Settings"** tab
4. **Add Environment Variable**:
   - **Name**: `BOT_TOKEN`
   - **Value**: `8480202227:AAGJkjHD7dTUFZiiAKUzeb_UHXCQ50XTNxQ`
5. **Save** the settings

## 🧪 Testing the Functions

After deployment, test the functions:

### Test 1: Admin Panel
1. **Login** to your admin panel with `admin`/`admin123secure`
2. **Create a course** or use existing one
3. **Generate course link** → Click "Generate Link"
4. **Click "Post to Channel"** → Should post to your Telegram channel

### Test 2: Direct Function Testing
You can test the functions directly:

**Post to Channel Function:**
```
POST https://jakqyuawjtkoupackdmo.supabase.co/functions/v1/post-to-channel
Content-Type: application/json

{
  "courseTitle": "Test Course",
  "courseLink": "https://example.com/course",
  "channelId": "-1002798244043"
}
```

**Check Membership Function:**
```
POST https://jakqyuawjtkoupackdmo.supabase.co/functions/v1/check-membership
Content-Type: application/json

{
  "telegramUserId": "123456789",
  "channelId": "-1002798244043"
}
```

## 🚨 Troubleshooting

### Function Not Found (400 Error)
- ✅ Ensure functions are deployed with exact names: `check-membership` and `post-to-channel`
- ✅ Check that environment variables are set correctly

### Bot Token Issues
- ✅ Verify `BOT_TOKEN` is correct in function environment variables
- ✅ Ensure bot has permission to post to the channel

### Channel Access Issues
- ✅ Verify `CHANNEL_CHAT_ID` is correct: `-1002730713649`
- ✅ Ensure bot is admin in the channel

## 📝 Function URLs After Deployment

Once deployed, your functions will be available at:

- **check-membership**: `https://jakqyuawjtkoupackdmo.supabase.co/functions/v1/check-membership`
- **post-to-channel**: `https://jakqyuawjtkoupackdmo.supabase.co/functions/v1/post-to-channel`

## ✅ Verification Checklist

- [ ] Both functions deployed successfully
- [ ] Environment variables set (BOT_TOKEN)
- [ ] Functions accessible via URLs
- [ ] "Post to Channel" button works in admin panel
- [ ] Course links posted to Telegram channel successfully

## 🎯 Next Steps

After deploying the Edge Functions:
1. **Test the "Post to Channel" feature** in your admin panel
2. **Verify course links** are posted to your Telegram channel
3. **Check that membership verification** works (if using that feature)

Your Telegram bot integration will be fully functional! 🚀
