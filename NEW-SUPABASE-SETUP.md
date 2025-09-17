# New Supabase Setup Guide

## 🔧 Step 1: Get Your API Keys

1. **Go to your new Supabase dashboard**: https://supabase.com/dashboard
2. **Select your project**: `jakqyuawjtkoupackdmo`
3. **Go to Settings → API**
4. **Copy the following values**:
   - **Project URL**: `https://jakqyuawjtkoupackdmo.supabase.co`
   - **Anon/Public Key**: (the long JWT token)

## 🔧 Step 2: Update Configuration

1. **Open `supabase.js`** in your project
2. **Replace the placeholder** with your actual anon key:
   ```javascript
   const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_ANON_KEY_HERE';
   ```

## 🔧 Step 3: Setup Database

1. **Go to your Supabase dashboard**
2. **Click on "SQL Editor"** in the left sidebar
3. **Copy and paste** the contents of `supabase-new-setup.sql`
4. **Click "Run"** to execute the script
5. **Verify** that all tables and functions were created successfully

## 🔧 Step 4: Test Connection

1. **Open your website**
2. **Try to login** with:
   - **Username**: `admin`
   - **Password**: `admin123secure`
3. **Check browser console** for any connection errors
4. **Create a test course** to verify everything works

## 🔧 Step 5: Update Edge Functions (if needed)

If you're using the Telegram bot integration, you'll need to:
1. **Deploy the `post-to-channel` Edge Function** to your new project
2. **Update any environment variables** in the Edge Function settings

## ✅ Verification Checklist

- [ ] API keys updated in `supabase.js`
- [ ] Database tables created successfully
- [ ] Admin login works
- [ ] Course creation works
- [ ] Chapter assignment works
- [ ] No console errors

## 🆘 Troubleshooting

If you encounter issues:
1. **Check browser console** for error messages
2. **Verify API keys** are correct
3. **Check database tables** exist in Supabase dashboard
4. **Test database connection** in Supabase dashboard

## 📝 Notes

- **Database Password**: `ethioskool123@E` (for direct database access)
- **Default Admin**: Username `admin`, Password `admin123secure`
- **All existing functionality** should work with the new database
