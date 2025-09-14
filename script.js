// App State Management
class CourseManager {
    constructor() {
        this.currentScreen = 'login';
        this.subjects = [
            { id: 'amharic', name: 'Amharic', icon: 'fas fa-book', color: '#e74c3c', courses: [] },
            { id: 'english', name: 'English', icon: 'fas fa-language', color: '#3498db', courses: [] },
            { id: 'math', name: 'Math', icon: 'fas fa-calculator', color: '#f39c12', courses: [] },
            { id: 'science', name: 'Science', icon: 'fas fa-flask', color: '#2ecc71', courses: [] }
        ];
        this.courses = [];
        this.currentSubject = null;
        this.currentCourse = null;
        this.editingCourseId = null; // Track if we're editing a course
        this.userRole = 'admin'; // 'admin' or 'student'
        this.telegramUser = null;
        this.api = window.supabaseAPI;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCourses();
        this.handleDeepLink();
        this.detectUserRole();
        this.setupHashRouting();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation buttons
        document.getElementById('createCourseBtn').addEventListener('click', () => {
            this.showScreen('courseCreation');
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showScreen('settings');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('backToDashboard').addEventListener('click', () => {
            this.showScreen('dashboard');
        });

        document.getElementById('backToDashboardFromSettings').addEventListener('click', () => {
            this.showScreen('dashboard');
        });

        document.getElementById('backToSubjects').addEventListener('click', () => {
            this.showScreen('dashboard');
        });

        // Course creation
        document.getElementById('saveCourse').addEventListener('click', () => {
            this.saveCourse();
        });

        document.getElementById('previewCourse').addEventListener('click', () => {
            this.previewCourse();
        });

        // Settings
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // Rich text editor
        this.setupRichTextEditor();
    }

    setupRichTextEditor() {
        const toolbar = document.querySelector('.rich-text-toolbar');
        const editor = document.getElementById('courseContent');

        // Toolbar button events
        toolbar.addEventListener('click', (e) => {
            if (e.target.classList.contains('toolbar-btn')) {
                e.preventDefault();
                const command = e.target.dataset.command;
                this.executeCommand(command);
            }
        });

        // Font family change
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            const fontFamily = e.target.value;
            if (fontFamily) {
                document.execCommand('fontName', false, fontFamily);
            }
        });

        // Font size change
        document.getElementById('fontSize').addEventListener('change', (e) => {
            const fontSize = e.target.value;
            if (fontSize) {
                document.execCommand('fontSize', false, '7');
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const span = document.createElement('span');
                    span.style.fontSize = fontSize;
                    try {
                        range.surroundContents(span);
                    } catch (e) {
                        // Handle case where selection spans multiple elements
                        span.appendChild(range.extractContents());
                        range.insertNode(span);
                    }
                }
            }
        });

        // Text color change
        document.getElementById('textColor').addEventListener('change', (e) => {
            const color = e.target.value;
            document.execCommand('foreColor', false, color);
        });

        // Background color change
        document.getElementById('backgroundColor').addEventListener('change', (e) => {
            const color = e.target.value;
            document.execCommand('backColor', false, color);
        });

        // Real-time preview
        editor.addEventListener('input', () => {
            this.updatePreview();
        });

        // Image upload
        editor.addEventListener('paste', (e) => {
            this.handleImagePaste(e);
        });

        // Update toolbar state based on selection
        editor.addEventListener('selectionchange', () => {
            this.updateToolbarState();
        });
    }

    executeCommand(command) {
        if (command === 'insertImage') {
            this.insertImage();
        } else {
            document.execCommand(command, false, null);
        }
        document.getElementById('courseContent').focus();
    }

    updateToolbarState() {
        const editor = document.getElementById('courseContent');
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            
            // Update button states
            document.querySelectorAll('.toolbar-btn').forEach(btn => {
                const command = btn.dataset.command;
                if (command && document.queryCommandState(command)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Update font family
            const fontFamily = window.getComputedStyle(element).fontFamily;
            const fontSelect = document.getElementById('fontFamily');
            if (fontSelect) {
                for (let option of fontSelect.options) {
                    if (option.value && fontFamily.includes(option.value.split(',')[0])) {
                        fontSelect.value = option.value;
                        break;
                    }
                }
            }
            
            // Update font size
            const fontSize = window.getComputedStyle(element).fontSize;
            const sizeSelect = document.getElementById('fontSize');
            if (sizeSelect) {
                sizeSelect.value = fontSize;
            }
        }
    }

    insertImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    img.style.margin = '10px 0';
                    
                    const editor = document.getElementById('courseContent');
                    editor.focus();
                    document.execCommand('insertHTML', false, img.outerHTML);
                    this.updatePreview();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    handleImagePaste(e) {
        const items = e.clipboardData.items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    img.style.margin = '10px 0';
                    
                    const editor = document.getElementById('courseContent');
                    editor.focus();
                    document.execCommand('insertHTML', false, img.outerHTML);
                    this.updatePreview();
                };
                reader.readAsDataURL(file);
            }
        }
    }

    updatePreview() {
        const content = document.getElementById('courseContent').innerHTML;
        const preview = document.getElementById('coursePreview');
        
        if (content.trim()) {
            preview.innerHTML = content;
        } else {
            preview.innerHTML = '<p class="preview-placeholder">Start writing to see preview...</p>';
        }
    }

    async handleLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!password) {
            errorDiv.textContent = 'Please enter a password.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            const result = await this.api.loginAdmin(password);
            
            if (result.success) {
                errorDiv.classList.remove('show');
                this.showScreen('dashboard');
                document.getElementById('adminPassword').value = '';
            } else {
                errorDiv.textContent = result.error || 'Invalid password. Please try again.';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.classList.add('show');
        }
    }

    logout() {
        this.showScreen('login');
        document.getElementById('adminPassword').value = '';
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenName + 'Screen').classList.add('active');
        this.currentScreen = screenName;

        // Load content based on screen
        if (screenName === 'dashboard') {
            this.loadSubjects();
        } else if (screenName === 'coursesList') {
            this.loadCoursesForSubject();
        }
    }

    loadSubjects() {
        const subjectsGrid = document.getElementById('subjectsGrid');
        subjectsGrid.innerHTML = '';

        this.subjects.forEach(subject => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-card';
            subjectCard.onclick = () => {
                this.currentSubject = subject.id;
                document.getElementById('subjectTitle').textContent = subject.name + ' Courses';
                this.showScreen('coursesList');
            };

            const courseCount = this.courses.filter(course => course.subject === subject.id).length;

            subjectCard.innerHTML = `
                <i class="${subject.icon}" style="color: ${subject.color}"></i>
                <h3>${subject.name}</h3>
                <p>Manage your ${subject.name.toLowerCase()} courses</p>
                <div class="course-count">${courseCount} courses</div>
            `;

            subjectsGrid.appendChild(subjectCard);
        });
    }

    loadCoursesForSubject() {
        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';

        const subjectCourses = this.courses.filter(course => course.subject === this.currentSubject);

        if (subjectCourses.length === 0) {
            coursesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <i class="fas fa-book-open"></i>
                        <h3>No courses yet</h3>
                        <p>Start creating amazing content for your students!</p>
                        <button class="btn-primary" onclick="window.courseManager.showScreen('courseCreation')">
                            <i class="fas fa-plus"></i>
                            Create First Course
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        subjectCourses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <div class="course-header">
                    <h3>${course.title}</h3>
                    <div class="course-status ${course.is_active !== false ? 'active' : 'inactive'}">
                        <i class="fas fa-circle"></i>
                        ${course.is_active !== false ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <p>${course.content.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
                <div class="course-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(course.created_at).toLocaleDateString()}</span>
                    <span><i class="fas fa-link"></i> Link Available</span>
                </div>
                <div class="course-actions">
                    <button class="btn-action btn-edit" onclick="event.stopPropagation(); window.courseManager.editCourse('${course.course_id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-generate" onclick="event.stopPropagation(); window.courseManager.generateCourseLink('${course.course_id}')">
                        <i class="fas fa-link"></i> Generate Link
                    </button>
                    <button class="btn-action btn-toggle" onclick="event.stopPropagation(); window.courseManager.toggleCourseStatus('${course.course_id}')">
                        <i class="fas fa-${course.is_active !== false ? 'pause' : 'play'}"></i> 
                        ${course.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn-action btn-delete" onclick="event.stopPropagation(); window.courseManager.deleteCourse('${course.course_id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;

            coursesList.appendChild(courseCard);
        });
    }

    async saveCourse() {
        const title = document.getElementById('courseTitle').value.trim();
        const subject = document.getElementById('courseSubject').value;
        const content = document.getElementById('courseContent').innerHTML;

        if (!title || !subject || !content.trim()) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            const courseData = {
                title,
                subject,
                content,
                images: [] // We'll add image upload later
            };

            let result;
            if (this.editingCourseId) {
                // Update existing course
                result = await this.api.updateCourse(this.editingCourseId, courseData);
            } else {
                // Create new course
                result = await this.api.createCourse(courseData);
            }
            
            if (result.success) {
                const wasEditing = this.editingCourseId !== null;
                this.clearCourseForm();
                this.editingCourseId = null; // Reset editing state
                this.showMessage(wasEditing ? 'Course updated successfully!' : 'Course saved successfully!', 'success');
                await this.loadCourses(); // Reload courses from database
                this.showScreen('dashboard');
            } else {
                this.showMessage(result.error || 'Failed to save course', 'error');
            }
        } catch (error) {
            console.error('Save course error:', error);
            this.showMessage('Failed to save course. Please try again.', 'error');
        }
    }

    editCourse(courseId) {
        const course = this.courses.find(c => c.course_id === courseId);
        if (!course) return;

        // Set editing state
        this.editingCourseId = courseId;
        
        document.getElementById('courseTitle').value = course.title;
        document.getElementById('courseSubject').value = course.subject;
        document.getElementById('courseContent').innerHTML = course.content;
        this.updatePreview();
        
        // Update header title to show edit mode
        const headerTitle = document.querySelector('#courseCreation header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Edit Course';
        }
        
        this.showScreen('courseCreation');
    }

    previewCourse() {
        const title = document.getElementById('courseTitle').value || 'Untitled Course';
        const content = document.getElementById('courseContent').innerHTML;
        
        if (!content.trim()) {
            this.showMessage('Please add some content to preview', 'error');
            return;
        }

        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Course Preview: ${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                    img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div>${content}</div>
            </body>
            </html>
        `);
    }

    clearCourseForm() {
        document.getElementById('courseTitle').value = '';
        document.getElementById('courseSubject').value = '';
        document.getElementById('courseContent').innerHTML = '';
        this.editingCourseId = null; // Reset editing state
        
        // Reset header title to create mode
        const headerTitle = document.querySelector('#courseCreation header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Create New Course';
        }
        
        this.updatePreview();
    }

    async generateCourseLink(courseId) {
        try {
            const result = await this.api.generateCourseToken(courseId);
            
            if (result.success) {
                const token = result.token;
                const link = `${window.location.origin}${window.location.pathname}#/course/${courseId}?token=${token}`;
                
                // Find course for display
                const course = this.courses.find(c => c.course_id === courseId);
                if (course) {
                    this.showLinkModal(course.title, link);
                }
                
                // Refresh the courses list
                await this.loadCourses();
                this.loadCoursesForSubject();
            } else {
                this.showMessage(result.error || 'Failed to generate link', 'error');
            }
        } catch (error) {
            console.error('Generate link error:', error);
            this.showMessage('Failed to generate link. Please try again.', 'error');
        }
    }

    generateSecureToken() {
        // Simple token generation (in real app, use proper JWT)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    showLinkModal(title, link) {
        const modal = document.createElement('div');
        modal.className = 'link-modal';
        modal.innerHTML = `
            <div class="link-modal-content">
                <div class="link-modal-header">
                    <h3>Course Link Generated</h3>
                    <button class="close-modal" onclick="this.closest('.link-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="link-modal-body">
                    <p><strong>Course:</strong> ${title}</p>
                    <div class="link-container">
                        <input type="text" value="${link}" readonly class="link-input" id="generatedLink">
                        <button class="btn-copy" onclick="window.courseManager.copyToClipboard('${link}')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <p class="link-note">Share this link with your students. They can only access it if they're channel members.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('Link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showMessage('Link copied to clipboard!', 'success');
        });
    }

    async toggleCourseStatus(courseId) {
        try {
            const course = this.courses.find(c => c.course_id === courseId);
            if (!course) return;

            const newStatus = !course.is_active;
            const result = await this.api.updateCourse(courseId, { is_active: newStatus });
            
            if (result.success) {
                await this.loadCourses();
                this.loadCoursesForSubject();
                
                const status = newStatus ? 'activated' : 'deactivated';
                this.showMessage(`Course ${status} successfully!`, 'success');
            } else {
                this.showMessage(result.error || 'Failed to update course status', 'error');
            }
        } catch (error) {
            console.error('Toggle course status error:', error);
            this.showMessage('Failed to update course status. Please try again.', 'error');
        }
    }

    async deleteCourse(courseId) {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        try {
            const result = await this.api.deleteCourse(courseId);
            
            if (result.success) {
                await this.loadCourses();
                this.loadCoursesForSubject();
                this.showMessage('Course deleted successfully!', 'success');
            } else {
                this.showMessage(result.error || 'Failed to delete course', 'error');
            }
        } catch (error) {
            console.error('Delete course error:', error);
            this.showMessage('Failed to delete course. Please try again.', 'error');
        }
    }

    // Deep Link Handling
    handleDeepLink() {
        // Check for hash-based routing first
        const hash = window.location.hash;
        if (hash) {
            const hashMatch = hash.match(/#\/course\/([^\/\?]+)\?token=(.+)/);
            if (hashMatch) {
                const courseId = hashMatch[1];
                const token = hashMatch[2];
                this.userRole = 'student';
                this.loadStudentCourse(courseId, token);
                return;
            }
        }

        // Fallback to query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = this.getCourseIdFromUrl();
        const token = urlParams.get('token');

        if (courseId && token) {
            this.userRole = 'student';
            this.loadStudentCourse(courseId, token);
        } else {
            this.showScreen('login');
        }
    }

    getCourseIdFromUrl() {
        // Check hash first
        const hash = window.location.hash;
        if (hash) {
            const hashMatch = hash.match(/#\/course\/([^\/\?]+)/);
            if (hashMatch) return hashMatch[1];
        }

        // Check pathname
        const path = window.location.pathname;
        const match = path.match(/\/course\/([^\/]+)/);
        return match ? match[1] : null;
    }

    detectUserRole() {
        // In a real app, this would check Telegram WebApp init data
        // For now, we'll simulate based on URL parameters
        if (this.userRole === 'student') {
            this.simulateTelegramUser();
        }
    }

    simulateTelegramUser() {
        // Simulate Telegram user data
        this.telegramUser = {
            id: Math.floor(Math.random() * 1000000),
            username: 'student_user',
            first_name: 'Student',
            last_name: 'User'
        };
    }

    async loadStudentCourse(courseId, token) {
        this.showScreen('loading');
        
        try {
            // Validate token and get course
            const result = await this.api.validateCourseToken(courseId, token);
            
            if (!result.success) {
                this.showScreen('accessDenied');
                return;
            }

            const course = result.course;
            
            if (!course.is_active) {
                this.showScreen('accessDenied');
                return;
            }

            // Simulate channel membership check (we'll implement this properly later)
            const isChannelMember = await this.checkChannelMembership();
            if (!isChannelMember) {
                this.showScreen('accessDenied');
                return;
            }

            // Load course for student
            this.currentCourse = course;
            this.loadStudentCourseContent();
            this.setupAntiCopyProtection();
            this.updateWatermark();
            this.showScreen('studentCourse');
        } catch (error) {
            console.error('Load student course error:', error);
            this.showScreen('accessDenied');
        }
    }

    async checkChannelMembership() {
        // Simulate API call to check if user is channel member
        // In real app, this would call Telegram API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For demo, randomly return true/false (80% chance of being member)
        return Math.random() > 0.2;
    }

    loadStudentCourseContent() {
        if (!this.currentCourse) return;

        document.getElementById('studentCourseTitle').textContent = this.currentCourse.title;
        
        const subject = this.subjects.find(s => s.id === this.currentCourse.subject);
        document.getElementById('studentCourseSubject').textContent = subject ? subject.name : this.currentCourse.subject;
        
        const date = new Date(this.currentCourse.created_at).toLocaleDateString();
        document.getElementById('studentCourseDate').textContent = date;
        
        document.getElementById('studentCourseContent').innerHTML = this.currentCourse.content;
    }

    setupAntiCopyProtection() {
        const courseContent = document.getElementById('studentCourseContent');
        
        // Disable right-click
        courseContent.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Right-click is disabled');
        });

        // Disable text selection
        courseContent.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });

        // Disable copy/paste
        courseContent.addEventListener('copy', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Copying is disabled');
        });

        courseContent.addEventListener('paste', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Pasting is disabled');
        });

        // Disable drag
        courseContent.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        // Disable F12, Ctrl+Shift+I, Ctrl+U
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                this.showProtectionMessage('Developer tools are disabled');
            }
        });

        // Disable image saving
        const images = courseContent.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
            img.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }

    showProtectionMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'protection-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    updateWatermark() {
        if (this.telegramUser) {
            const userInfo = `${this.telegramUser.first_name} ${this.telegramUser.last_name} (ID: ${this.telegramUser.id})`;
            document.getElementById('userInfo').textContent = userInfo;
        }
    }

    contactAdmin() {
        // In real app, this would open Telegram chat with admin
        window.open('https://t.me/tutor_tiial_bot', '_blank');
    }

    setupHashRouting() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleDeepLink();
        });
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (currentPassword !== this.adminPassword) {
            this.showMessage('Current password is incorrect', 'error', 'passwordError');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('New passwords do not match', 'error', 'passwordError');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error', 'passwordError');
            return;
        }

        this.adminPassword = newPassword;
        this.showMessage('Password changed successfully!', 'success', 'passwordSuccess');
        
        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    async loadCourses() {
        try {
            const result = await this.api.getCourses();
            if (result.success) {
                this.courses = result.courses;
            } else {
                console.error('Failed to load courses:', result.error);
                this.courses = [];
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.courses = [];
        }
    }


    showMessage(message, type, elementId = null) {
        const errorDiv = document.getElementById(elementId || 'loginError');
        errorDiv.textContent = message;
        errorDiv.className = `${type}-message show`;
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.courseManager = new CourseManager();
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    // Trigger any responsive adjustments if needed
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
    if (window.courseManager) {
        window.courseManager.saveCourses();
    }
});
