// Supabase configuration - NEW ACCOUNT
const SUPABASE_URL = 'https://jakqyuawjtkoupackdmo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impha3F5dWF3anRrb3VwYWNrZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTAyNDcsImV4cCI6MjA3MzY2NjI0N30.DWpYBUtI_uM0WyhvB_qML6CTrCviZV-ZS8mqWKmihRs';

// Wait for Supabase library to be available
function initializeSupabase() {
    console.log('🔄 Initializing Supabase...');
    console.log('🔄 supabase object available:', typeof supabase !== 'undefined');
    
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        return null;
    }
    
    try {
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client created successfully');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to create Supabase client:', error);
        return null;
    }
}

// Initialize Supabase client
const supabaseClient = initializeSupabase();

// Supabase API class
class SupabaseAPI {
    constructor() {
        this.client = supabaseClient;
        if (!this.client) {
            console.error('❌ SupabaseAPI: No client available');
        } else {
            console.log('✅ SupabaseAPI: Client initialized');
        }
    }

    // Authentication
    async loginAdmin(password) {
        try {
            console.log('🔐 Supabase API - loginAdmin called with password:', password);
            
            // Call the database function to verify admin password
            const { data, error } = await this.client.rpc('verify_admin_password', {
                input_username: 'admin',
                input_password: password
            });
            
            if (error) {
                console.error('❌ Database error:', error);
                return { success: false, error: 'Database error occurred' };
            }
            
            console.log('🔐 Database response:', data);
            
            if (data && data.success) {
                console.log('✅ Database authentication successful!');
                // Create a session token
                const token = btoa(JSON.stringify({
                    admin: true,
                    admin_id: data.admin_id,
                    username: data.username,
                    timestamp: Date.now()
                }));
                localStorage.setItem('admin_token', token);
                console.log('✅ Session token created and stored');
                return { success: true, token, admin: data };
            } else {
                console.log('❌ Database authentication failed:', data?.error);
                return { success: false, error: data?.error || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('❌ Supabase API - loginAdmin error:', error);
            return { success: false, error: error.message };
        }
    }

    async logoutAdmin() {
        localStorage.removeItem('admin_token');
        return { success: true };
    }

    // Change admin password
    async changeAdminPassword(currentPassword, newPassword) {
        try {
            console.log('🔐 Changing admin password...');
            
            // First verify current password
            const verifyResult = await this.loginAdmin(currentPassword);
            if (!verifyResult.success) {
                return { success: false, error: 'Current password is incorrect' };
            }
            
            // Update password in database
            const { data, error } = await this.client
                .from('admin_users')
                .update({ 
                    password_hash: newPassword, // In production, hash this password
                    updated_at: new Date().toISOString()
                })
                .eq('username', 'admin')
                .select();
            
            if (error) {
                console.error('❌ Password update error:', error);
                return { success: false, error: 'Failed to update password' };
            }
            
            console.log('✅ Password updated successfully');
            return { success: true, message: 'Password updated successfully' };
        } catch (error) {
            console.error('❌ Change password error:', error);
            return { success: false, error: error.message };
        }
    }

    async isAdminLoggedIn() {
        const token = localStorage.getItem('admin_token');
        if (!token) return false;
        
        try {
            const decoded = JSON.parse(atob(token));
            // Check if token is not expired (24 hours)
            return Date.now() - decoded.timestamp < 24 * 60 * 60 * 1000;
        } catch {
            return false;
        }
    }

    // Courses
    // Subject Management
    async getSubjects() {
        try {
            // For now, return default subjects since we don't have a subjects table
            // In the future, this could be expanded to use a subjects table
            const defaultSubjects = [
                { 
                    id: 'amharic', 
                    name: 'Amharic', 
                    icon: 'fas fa-book', 
                    color: '#e74c3c', 
                    courses: [],
                    chapters: [
                        { id: 'amharic_ch1', name: 'Chapter 1', number: 1 },
                        { id: 'amharic_ch2', name: 'Chapter 2', number: 2 },
                        { id: 'amharic_ch3', name: 'Chapter 3', number: 3 },
                        { id: 'amharic_ch4', name: 'Chapter 4', number: 4 },
                        { id: 'amharic_ch5', name: 'Chapter 5', number: 5 },
                        { id: 'amharic_ch6', name: 'Chapter 6', number: 6 }
                    ]
                },
                { 
                    id: 'english', 
                    name: 'English', 
                    icon: 'fas fa-language', 
                    color: '#3498db', 
                    courses: [],
                    chapters: [
                        { id: 'english_ch1', name: 'Chapter 1', number: 1 },
                        { id: 'english_ch2', name: 'Chapter 2', number: 2 },
                        { id: 'english_ch3', name: 'Chapter 3', number: 3 },
                        { id: 'english_ch4', name: 'Chapter 4', number: 4 },
                        { id: 'english_ch5', name: 'Chapter 5', number: 5 },
                        { id: 'english_ch6', name: 'Chapter 6', number: 6 }
                    ]
                },
                { 
                    id: 'math', 
                    name: 'Math', 
                    icon: 'fas fa-calculator', 
                    color: '#f39c12', 
                    courses: [],
                    chapters: [
                        { id: 'math_ch1', name: 'Chapter 1', number: 1 },
                        { id: 'math_ch2', name: 'Chapter 2', number: 2 },
                        { id: 'math_ch3', name: 'Chapter 3', number: 3 },
                        { id: 'math_ch4', name: 'Chapter 4', number: 4 },
                        { id: 'math_ch5', name: 'Chapter 5', number: 5 },
                        { id: 'math_ch6', name: 'Chapter 6', number: 6 }
                    ]
                },
                { 
                    id: 'science', 
                    name: 'Science', 
                    icon: 'fas fa-flask', 
                    color: '#2ecc71', 
                    courses: [],
                    chapters: [
                        { id: 'science_ch1', name: 'Chapter 1', number: 1 },
                        { id: 'science_ch2', name: 'Chapter 2', number: 2 },
                        { id: 'science_ch3', name: 'Chapter 3', number: 3 },
                        { id: 'science_ch4', name: 'Chapter 4', number: 4 },
                        { id: 'science_ch5', name: 'Chapter 5', number: 5 },
                        { id: 'science_ch6', name: 'Chapter 6', number: 6 }
                    ]
                }
            ];
            
            return { success: true, data: defaultSubjects };
        } catch (error) {
            console.error('Error fetching subjects:', error);
            return { success: false, error: error.message };
        }
    }

    async createSubject(subjectData) {
        try {
            console.log('💾 Supabase createSubject called with data:', subjectData);
            // For now, just return success since we're using default subjects
            // In the future, this could save to a subjects table
            return { success: true, data: subjectData };
        } catch (error) {
            console.error('Error creating subject:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSubject(subjectId, subjectData) {
        try {
            console.log('💾 Supabase updateSubject called with:', { subjectId, subjectData });
            // For now, just return success since we're using default subjects
            // In the future, this could update a subjects table
            return { success: true, data: subjectData };
        } catch (error) {
            console.error('Error updating subject:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteSubject(subjectId) {
        try {
            console.log('💾 Supabase deleteSubject called with:', subjectId);
            // For now, just return success since we're using default subjects
            // In the future, this could delete from a subjects table
            return { success: true };
        } catch (error) {
            console.error('Error deleting subject:', error);
            return { success: false, error: error.message };
        }
    }

    async getCourses() {
        try {
            const { data, error } = await this.client
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, courses: data || [] };
        } catch (error) {
            console.error('Get courses error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCourse(courseId) {
        try {
            const { data, error } = await this.client
                .from('courses')
                .select('*')
                .eq('course_id', courseId)
                .single();
            
            if (error) throw error;
            return { success: true, course: data };
        } catch (error) {
            console.error('Get course error:', error);
            return { success: false, error: error.message };
        }
    }

    async createCourse(courseData) {
        try {
            console.log('💾 Supabase createCourse called with data:', courseData);
            
            const course = {
                course_id: this.generateId(),
                title: courseData.title,
                subject: courseData.subject,
                chapter: courseData.chapter || null,
                content: courseData.content,
                images: courseData.images || [],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('💾 Course object to insert:', course);

            const { data, error } = await this.client
                .from('courses')
                .insert([course])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, course: data };
        } catch (error) {
            console.error('Create course error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCourse(courseId, updates) {
        try {
            console.log('💾 Supabase updateCourse called with:', { courseId, updates });
            
            const updateData = {
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            console.log('💾 Update data to send:', updateData);

            const { data, error } = await this.client
                .from('courses')
                .update(updateData)
                .eq('course_id', courseId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, course: data };
        } catch (error) {
            console.error('Update course error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCourse(courseId) {
        try {
            const { error } = await this.client
                .from('courses')
                .delete()
                .eq('course_id', courseId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete course error:', error);
            return { success: false, error: error.message };
        }
    }

    // Tokens
    async generateCourseToken(courseId) {
        try {
            const token = this.generateSecureToken();
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            const { data, error } = await this.client
                .from('tokens')
                .insert([{
                    course_id: courseId,
                    token: token,
                    expires_at: expiresAt.toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, token: data.token };
        } catch (error) {
            console.error('Generate token error:', error);
            return { success: false, error: error.message };
        }
    }

    async validateCourseToken(courseId, token) {
        try {
            // First, validate the token exists
            const { data: tokenData, error: tokenError } = await this.client
                .from('tokens')
                .select('*')
                .eq('course_id', courseId)
                .eq('token', token)
                .single();
            
            if (tokenError || !tokenData) {
                console.log('Token validation failed:', tokenError);
                return { success: false, error: 'Invalid or expired token' };
            }
            
            // Check if token is expired (if expires_at is set)
            if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
                return { success: false, error: 'Token expired' };
            }
            
            // Get the course details
            const { data: courseData, error: courseError } = await this.client
                .from('courses')
                .select('*')
                .eq('course_id', courseId)
                .single();
            
            if (courseError || !courseData) {
                console.log('Course not found:', courseError);
                return { success: false, error: 'Course not found' };
            }
            
            return { success: true, course: courseData };
        } catch (error) {
            console.error('Validate token error:', error);
            return { success: false, error: 'Invalid token' };
        }
    }

    // Channel Membership Check
    async checkChannelMembership(telegramUserId, channelId) {
        try {
            const { data, error } = await this.client.functions.invoke('check-membership', {
                body: {
                    telegramUserId: telegramUserId,
                    channelId: channelId
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Check membership error:', error);
            return { success: false, error: error.message };
        }
    }

    // Post Course Link to Channel
    async postCourseToChannel(courseTitle, courseLink, channelId) {
        try {
            const { data, error } = await this.client.functions.invoke('post-to-channel', {
                body: {
                    courseTitle: courseTitle,
                    courseLink: courseLink,
                    channelId: channelId
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Post to channel error:', error);
            return { success: false, error: error.message };
        }
    }

    // File Upload
    async uploadImage(file) {
        try {
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
            
            const { data, error } = await this.client.storage
                .from('course-images')
                .upload(fileName, file);
            
            if (error) throw error;
            
            const { data: { publicUrl } } = this.client.storage
                .from('course-images')
                .getPublicUrl(fileName);
            
            return { success: true, url: publicUrl, fileName };
        } catch (error) {
            console.error('Upload image error:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility functions
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    generateSecureToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
}

// Create global instance
window.supabaseAPI = new SupabaseAPI();
