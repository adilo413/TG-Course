# 🗄️ Master Supabase Database Setup Guide

This guide will help you set up the complete database schema for the Course Management App with all features integrated.

## 📋 What's Included

The master database setup includes **ALL** tables and functionality:

### 🏗️ **Database Tables:**
1. **`admin_users`** - Admin authentication and management
2. **`subjects`** - Subject management (NEW - replaces localStorage)
3. **`chapters`** - Chapter management (NEW - replaces localStorage)
4. **`courses`** - Course content with chapter references
5. **`tokens`** - Course access tokens
6. **`users`** - Student/telegram user tracking
7. **`settings`** - App configuration (NEW)

### 🔧 **Functions:**
- `verify_admin_password()` - Admin authentication
- `generate_course_id()` - Unique course ID generation
- `generate_subject_id()` - Unique subject ID generation (NEW)
- `generate_chapter_id()` - Unique chapter ID generation (NEW)
- `update_updated_at_column()` - Automatic timestamp updates

### 🛡️ **Security:**
- Row Level Security (RLS) enabled on all tables
- Comprehensive policies for data access
- Proper foreign key relationships

## 🚀 Setup Instructions

### Step 1: Run the Master Setup Script

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `supabase-master-setup.sql`
4. Click **Run** to execute the script

### Step 2: Verify Setup

After running the script, you should see:
- ✅ "Database setup completed successfully!" message
- ✅ List of all created tables
- ✅ List of all created functions
- ✅ Record counts for default data

### Step 3: Test the Integration

1. **Test Admin Login:**
   - Username: `admin`
   - Password: `admin123secure`

2. **Test Subject Management:**
   - Create a new subject
   - Edit an existing subject
   - Delete a subject
   - Verify subjects persist across sessions

3. **Test Course Management:**
   - Create courses with chapter assignments
   - Edit courses and change chapters
   - Generate course links

## 🔄 Key Changes from Previous Setup

### ✅ **What's New:**
- **Subjects Table**: Subjects are now stored in the database instead of localStorage
- **Chapters Table**: Chapters are now stored in the database with proper relationships
- **Settings Table**: App configuration is now database-driven
- **Enhanced Relationships**: Proper foreign keys between subjects, chapters, and courses
- **Database Persistence**: All data now persists across devices and sessions

### 🔧 **Updated JavaScript:**
- `loadSubjectsFromDatabase()` - Loads subjects from Supabase
- `saveSubject()` - Saves subjects to database
- `deleteSubject()` - Deletes subjects from database
- `createSubject()` - Creates subjects in database
- `updateSubject()` - Updates subjects in database

## 📊 Default Data Included

The setup script includes default data:

### 📚 **Default Subjects:**
- Amharic (6 chapters)
- English (6 chapters)
- Mathematics (6 chapters)
- Physics (6 chapters)
- Chemistry (6 chapters)
- Biology (6 chapters)

### ⚙️ **Default Settings:**
- App name: "Bright Freshman"
- Default theme: "dark"
- Watermark enabled: true
- Max courses per subject: 100
- Max chapters per subject: 20

### 👤 **Default Admin:**
- Username: `admin`
- Password: `admin123secure`

## 🔍 Troubleshooting

### Common Issues:

1. **"Policy already exists" errors:**
   - The script handles this automatically with `DROP POLICY IF EXISTS`

2. **"Function already exists" errors:**
   - The script handles this automatically with `DROP FUNCTION IF EXISTS`

3. **"Table already exists" errors:**
   - The script uses `CREATE TABLE IF NOT EXISTS` to handle this

4. **Subjects not loading:**
   - Check browser console for API errors
   - Verify Supabase connection in `supabase.js`
   - Ensure the master setup script ran successfully

### 🔧 **Manual Verification:**

Run these queries in SQL Editor to verify setup:

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check subjects data
SELECT * FROM subjects;

-- Check chapters data
SELECT * FROM chapters;

-- Check admin user
SELECT * FROM admin_users;
```

## 🎯 Benefits of Master Setup

### ✅ **Complete Persistence:**
- All data stored in database
- Works across different devices
- No more localStorage limitations

### ✅ **Scalability:**
- Proper database relationships
- Optimized indexes for performance
- Support for multiple admins

### ✅ **Data Integrity:**
- Foreign key constraints
- Automatic timestamp updates
- Row-level security

### ✅ **Future-Proof:**
- Easy to add new features
- Settings table for configuration
- Extensible schema design

## 🚨 Important Notes

1. **Backup First**: Always backup your existing data before running the master setup
2. **Test Thoroughly**: Test all functionality after setup
3. **Update JavaScript**: Ensure you're using the updated `script.js` and `supabase.js` files
4. **Monitor Performance**: Check database performance with large datasets

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Supabase connection
3. Run the verification queries
4. Check that all files are updated

---

**🎉 Congratulations!** You now have a complete, database-driven Course Management App with full persistence and scalability!
