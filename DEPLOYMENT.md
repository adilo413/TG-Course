# Deployment Guide

## 🚀 Simple Deployment Steps

### Step 1: Set Up Supabase Database

1. **Go to your Supabase project**: https://supabase.com/dashboard
2. **Open SQL Editor**
3. **Run the setup script**: Copy and paste the contents of `supabase-setup.sql`
4. **Execute the script** - This creates all tables and policies

### Step 2: Deploy Frontend to Vercel

1. **Push your code to GitHub**
2. **Go to Vercel**: https://vercel.com
3. **Import your GitHub repository**
4. **Deploy** - Vercel will automatically deploy your frontend

### Step 3: Deploy Bot to Render

1. **Go to Render**: https://render.com
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Set build command**: `npm install`
5. **Set start command**: `node bot.js`
6. **Add environment variables**:
   - `BOT_TOKEN`: Your Telegram bot token
   - `CHANNEL_CHAT_ID`: Your channel ID
   - `CHANNEL_INVITE_LINK`: Your channel invite link
   - `NEXT_PUBLIC_SITE_URL`: Your Vercel frontend URL

### Step 4: Update Environment Variables

Update your `supabase.js` file with your actual URLs:

```javascript
// Update these URLs after deployment
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## 🎯 What You Get

### Frontend (Vercel)
- **URL**: `https://your-app.vercel.app`
- **Features**: Admin panel, course creation, student view
- **Database**: Connected to Supabase

### Bot (Render)
- **URL**: `https://your-bot.onrender.com`
- **Features**: Channel posting, user verification
- **Integration**: Works with your frontend

### Database (Supabase)
- **URL**: `https://your-project.supabase.co`
- **Features**: Course storage, user tracking, file storage
- **Security**: Row Level Security enabled

## 🔧 Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_SITE_URL`: Your Vercel URL
- `NEXT_PUBLIC_API_URL`: Your Vercel URL

### Bot (Render)
- `BOT_TOKEN`: Telegram bot token
- `CHANNEL_CHAT_ID`: Channel ID
- `CHANNEL_INVITE_LINK`: Channel invite link
- `NEXT_PUBLIC_SITE_URL`: Your Vercel URL

## 📱 Testing

1. **Test Admin Panel**: Go to your Vercel URL
2. **Login**: Use password `admin123`
3. **Create Course**: Test course creation
4. **Generate Link**: Test link generation
5. **Test Bot**: Send `/start` to your bot
6. **Test Student View**: Use generated course link

## 🎉 You're Done!

Your client gets:
- **Frontend URL**: `https://your-app.vercel.app`
- **Bot**: `@your_bot_username`
- **Channel**: Your private channel

**No setup required for your client!** 🚀
