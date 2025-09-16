# Deployment Guide

## 🚀 **Channel Membership Verification Setup**

### **1. Deploy Supabase Edge Function**

The channel membership verification requires a Supabase Edge Function. Here's how to deploy it:

#### **Option A: Using Supabase CLI (Recommended)**

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   supabase link --project-ref vfzyxiuhrjrqhoxbdxwg
   ```

4. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy check-membership
   ```

5. **Set environment variables:**
   ```bash
   supabase secrets set BOT_TOKEN=8480202227:AAGJkjHD7dTUFZiiAKUzeb_UHXCQ50XTNxQ
   ```

#### **Option B: Manual Deployment via Supabase Dashboard**

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/vfzyxiuhrjrqhoxbdxwg

2. **Navigate to Edge Functions:**
   - Go to "Edge Functions" in the left sidebar

3. **Create New Function:**
   - Click "Create a new function"
   - Name: `check-membership`
   - Copy the code from `supabase/functions/check-membership/index.ts`

4. **Set Environment Variables:**
   - Go to "Settings" → "Edge Functions"
   - Add secret: `BOT_TOKEN` = `8480202227:AAGJkjHD7dTUFZiiAKUzeb_UHXCQ50XTNxQ`

### **2. Test the Implementation**

1. **Generate a course link** from the admin panel
2. **Share it in your private channel** (ID: -1003004502647)
3. **Test with different users:**
   - **Channel members** → Should see course content
   - **Non-members** → Should see "Access Denied" with channel membership message

### **3. How It Works**

1. **Student clicks Telegram Mini App link**
2. **App gets Telegram user ID** from WebApp API
3. **Calls Supabase Edge Function** to check membership
4. **Edge Function calls Telegram Bot API** to verify channel membership
5. **Returns membership status** to frontend
6. **Shows course content** or access denied message

### **4. Security Features**

- ✅ **Real-time membership verification** via Telegram Bot API
- ✅ **Secure token-based course access**
- ✅ **Channel membership requirement**
- ✅ **Full content protection** (anti-copy, anti-screenshot)
- ✅ **Admin control** (can deactivate courses anytime)

### **5. Troubleshooting**

#### **If membership check fails:**
- Check that the bot is added to your private channel
- Verify the bot has admin permissions in the channel
- Ensure the channel ID is correct (-1003004502647)
- Check the bot token is valid

#### **If Edge Function doesn't work:**
- Verify the function is deployed successfully
- Check environment variables are set
- Look at function logs in Supabase dashboard

### **6. Production Checklist**

- [ ] Edge Function deployed and working
- [ ] Bot token configured as secret
- [ ] Bot added to private channel with admin permissions
- [ ] Channel ID is correct in the code
- [ ] Test with real users (members and non-members)
- [ ] Verify access denied messages show correctly

## 🎯 **Current Status**

✅ **Core System:** Working perfectly  
✅ **Channel Membership:** Implemented and ready to deploy  
✅ **Security:** Full protection enabled  
✅ **UI/UX:** Beautiful, mobile-first design  

**Next Step:** Deploy the Edge Function and test with real users!