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
        this.setupStudentSection();
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

        console.log('🔐 Attempting login with password:', password);

        if (!password) {
            errorDiv.textContent = 'Please enter a password.';
            errorDiv.classList.add('show');
            return;
        }

        try {
            console.log('🔐 Calling loginAdmin API...');
            const result = await this.api.loginAdmin(password);
            console.log('🔐 Login result:', result);
            
            if (result.success) {
                console.log('✅ Login successful!');
                errorDiv.classList.remove('show');
                this.showScreen('dashboard');
                document.getElementById('adminPassword').value = '';
            } else {
                console.log('❌ Login failed:', result.error);
                errorDiv.textContent = result.error || 'Invalid password. Please try again.';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            console.error('❌ Login exception:', error);
            errorDiv.textContent = `Login failed: ${error.message}`;
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
            screen.style.display = 'none';
        });

        // Show target screen
        const screenElement = document.getElementById(screenName + 'Screen') || document.getElementById(screenName);
        if (screenElement) {
            screenElement.classList.add('active');
            screenElement.style.display = 'block';
        } else {
            console.error('Screen not found:', screenName);
        }
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
                // Generate Telegram Mini App link that opens within Telegram
                const miniAppUrl = `https://tg-course.vercel.app/#/course/${courseId}?token=${token}`;
                const telegramLink = `https://t.me/tutor_tiial_bot/CourseViewer?startapp=${courseId}_${token}`;
                
                // Also create a simple direct link for testing
                const directLink = `https://tg-course.vercel.app/?course=${courseId}&token=${token}`;
                
                // Find course for display
                const course = this.courses.find(c => c.course_id === courseId);
                if (course) {
                    this.showLinkModal(course.title, telegramLink, miniAppUrl, directLink);
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

    showLinkModal(title, telegramLink, miniAppUrl, directLink) {
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
                    
                    <div style="margin: 15px 0;">
                        <h4 style="color: #007bff; margin-bottom: 10px;">📱 Telegram Mini App Link (Recommended)</h4>
                        <div class="link-container">
                            <input type="text" value="${telegramLink}" readonly class="link-input" id="telegramLink">
                            <button class="btn-copy" onclick="window.courseManager.copyToClipboard('${telegramLink}')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <p style="font-size: 12px; color: #666; margin-top: 5px;">
                            Use this link in your Telegram channel. Students will click it and see the course directly.
                        </p>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <h4 style="color: #e74c3c; margin-bottom: 10px;">🚀 Auto-Upload to Channel</h4>
                        <button class="btn-upload" onclick="window.courseManager.uploadToChannel('${title}', '${telegramLink}')">
                            <i class="fas fa-paper-plane"></i> Post to Channel
                        </button>
                        <p style="font-size: 12px; color: #666; margin-top: 5px;">
                            Automatically post this course link to your private channel
                        </p>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <h4 style="color: #28a745; margin-bottom: 10px;">🔗 Direct Link (For Testing)</h4>
                        <div class="link-container">
                            <input type="text" value="${directLink}" readonly class="link-input" id="directLink">
                            <button class="btn-copy" onclick="window.courseManager.copyToClipboard('${directLink}')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <p style="font-size: 12px; color: #666; margin-top: 5px;">This link opens the course directly in Telegram</p>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <h4 style="color: #28a745; margin-bottom: 10px;">🌐 Web Link (Fallback)</h4>
                        <div class="link-container">
                            <input type="text" value="${miniAppUrl}" readonly class="link-input" id="webLink">
                            <button class="btn-copy" onclick="window.courseManager.copyToClipboard('${miniAppUrl}')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <p style="font-size: 12px; color: #666; margin-top: 5px;">This link opens in browser if Telegram link doesn't work</p>
                    </div>
                    
                    <p class="link-note">Share the Telegram link with your students. They can only access it if they're channel members.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-close after 15 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 15000);
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

    async uploadToChannel(courseTitle, courseLink) {
        try {
            this.showMessage('Posting to channel...', 'info');
            
            const result = await this.api.postCourseToChannel(
                courseTitle, 
                courseLink, 
                '-1002798244043' // Your channel ID
            );
            
            if (result.success) {
                this.showMessage('✅ Course posted to channel successfully!', 'success');
            } else {
                this.showMessage(`❌ Failed to post to channel: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Upload to channel error:', error);
            this.showMessage('Failed to post to channel. Please try again.', 'error');
        }
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
        console.log('🔍 Handling deep link...', {
            url: window.location.href,
            search: window.location.search,
            hash: window.location.hash,
            pathname: window.location.pathname
        });

        // Check for Telegram Mini App startapp parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const startapp = urlParams.get('startapp');
        console.log('📱 Startapp parameter:', startapp);
        
        if (startapp) {
            const parts = startapp.split('_');
            console.log('🔧 Parsed startapp parts:', parts);
            if (parts.length >= 2) {
                const courseId = parts[0];
                const token = parts.slice(1).join('_'); // In case token contains underscores
                console.log('✅ Found courseId:', courseId, 'token:', token);
                this.userRole = 'student';
                this.simulateTelegramUser(); // Initialize Telegram user data
                this.autoLoadStudentCourse(courseId, token);
                return;
            }
        }

        // Check for Telegram WebApp init data
        if (window.Telegram && window.Telegram.WebApp) {
            const initData = window.Telegram.WebApp.initData;
            console.log('📱 Telegram WebApp initData:', initData);
            
            if (initData) {
                const initDataParams = new URLSearchParams(initData);
                const startParam = initDataParams.get('start_param');
                console.log('📱 Start param from initData:', startParam);
                
                if (startParam) {
                    const parts = startParam.split('_');
                    if (parts.length >= 2) {
                        const courseId = parts[0];
                        const token = parts.slice(1).join('_');
                        console.log('✅ Found courseId from initData:', courseId, 'token:', token);
                        this.userRole = 'student';
                        this.simulateTelegramUser();
                        this.autoLoadStudentCourse(courseId, token);
                        return;
                    }
                }
            }
        }

        // Check for hash-based routing
        const hash = window.location.hash;
        if (hash) {
            const hashMatch = hash.match(/#\/course\/([^\/\?]+)\?token=(.+)/);
            if (hashMatch) {
                const courseId = hashMatch[1];
                const token = hashMatch[2];
                console.log('🔗 Hash-based routing - courseId:', courseId, 'token:', token);
                this.userRole = 'student';
                this.simulateTelegramUser(); // Initialize Telegram user data
                this.autoLoadStudentCourse(courseId, token);
                return;
            }
        }

        // Check for path-based routing (for Telegram Mini Apps)
        const pathname = window.location.pathname;
        if (pathname.includes('/course/')) {
            const pathMatch = pathname.match(/\/course\/([^\/\?]+)/);
            if (pathMatch) {
                const courseId = pathMatch[1];
                const token = urlParams.get('token');
                if (token) {
                    console.log('🛤️ Path-based routing - courseId:', courseId, 'token:', token);
                    this.userRole = 'student';
                    this.simulateTelegramUser();
                    this.autoLoadStudentCourse(courseId, token);
                    return;
                }
            }
        }

        // Check for direct link format (?course=ID&token=TOKEN)
        const directCourseId = urlParams.get('course');
        const directToken = urlParams.get('token');
        
        if (directCourseId && directToken) {
            console.log('🔄 Direct link format - courseId:', directCourseId, 'token:', directToken);
            this.userRole = 'student';
            this.simulateTelegramUser();
            this.autoLoadStudentCourse(directCourseId, directToken);
            return;
        }

        // Fallback to query parameters
        const courseId = this.getCourseIdFromUrl();
        const token = urlParams.get('token');

        if (courseId && token) {
            console.log('🔄 Fallback routing - courseId:', courseId, 'token:', token);
            this.userRole = 'student';
            this.simulateTelegramUser(); // Initialize Telegram user data
            this.autoLoadStudentCourse(courseId, token);
        } else {
            console.log('❌ No valid deep link found, showing admin login');
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
        console.log('👤 Detecting user role:', this.userRole);
        if (this.userRole === 'student') {
            this.simulateTelegramUser();
        } else if (!this.userRole) {
            // Default to admin if no role is set
            this.userRole = 'admin';
        }
    }

    simulateTelegramUser() {
        // Get real Telegram user data from WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            this.telegramUser = {
                id: tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 1000000),
                username: tg.initDataUnsafe.user?.username || 'student_user',
                first_name: tg.initDataUnsafe.user?.first_name || 'Student',
                last_name: tg.initDataUnsafe.user?.last_name || 'User'
            };
            console.log('📱 Real Telegram user data:', this.telegramUser);
        } else {
            // Fallback for testing
            this.telegramUser = {
                id: Math.floor(Math.random() * 1000000),
                username: 'student_user',
                first_name: 'Student',
                last_name: 'User'
            };
            console.log('🔄 Using simulated Telegram user data:', this.telegramUser);
        }
    }

    setupStudentSection() {
        // View Course button
        document.getElementById('viewCourseBtn').addEventListener('click', () => {
            this.handleCourseLinkInput();
        });

        // Enter key support
        document.getElementById('courseLinkInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCourseLinkInput();
            }
        });

        // Admin login link
        document.getElementById('adminLoginLink').addEventListener('click', () => {
            this.showScreen('login');
        });
    }

    handleCourseLinkInput() {
        const courseLink = document.getElementById('courseLinkInput').value.trim();
        
        if (!courseLink) {
            this.showMessage('Please enter a course link', 'error');
            return;
        }

        // Parse the course link
        const parsed = this.parseCourseLink(courseLink);
        if (!parsed) {
            this.showMessage('Invalid course link format', 'error');
            return;
        }

        // Load the course
        this.userRole = 'student';
        this.simulateTelegramUser();
        this.loadStudentCourse(parsed.courseId, parsed.token);
    }

    parseCourseLink(link) {
        try {
            // Handle Telegram Mini App links
            if (link.includes('t.me/') && link.includes('startapp=')) {
                const url = new URL(link);
                const startapp = url.searchParams.get('startapp');
                if (startapp) {
                    const parts = startapp.split('_');
                    if (parts.length >= 2) {
                        return {
                            courseId: parts[0],
                            token: parts.slice(1).join('_')
                        };
                    }
                }
            }

            // Handle direct links with course ID and token
            const directMatch = link.match(/course[\/=]([^\/\?&]+)[\/\?&]token[\/=]([^\/\?&]+)/);
            if (directMatch) {
                return {
                    courseId: directMatch[1],
                    token: directMatch[2]
                };
            }

            // Handle hash-based links
            const hashMatch = link.match(/#\/course\/([^\/\?]+)\?token=(.+)/);
            if (hashMatch) {
                return {
                    courseId: hashMatch[1],
                    token: hashMatch[2]
                };
            }

            return null;
        } catch (error) {
            console.error('Error parsing course link:', error);
            return null;
        }
    }

    async autoLoadStudentCourse(courseId, token) {
        console.log('🔍 Auto-loading student course:', { courseId, token });
        // Show loading screen to students
        this.showScreen('studentLoadingScreen');
        
        try {
            // Validate token and get course
            console.log('🔐 Validating token...');
            const result = await this.api.validateCourseToken(courseId, token);
            console.log('🔐 Token validation result:', result);
            
            if (!result.success) {
                console.log('❌ Token validation failed:', result.error);
                this.showScreen('accessDenied');
                return;
            }

            const course = result.course;
            console.log('📚 Course data:', course);
            
            if (!course.is_active) {
                console.log('❌ Course is not active');
                this.showScreen('accessDenied');
                return;
            }

            // Check channel membership
            console.log('🔍 Checking channel membership...');
            const membershipResult = await this.api.checkChannelMembership(
                this.telegramUser.id, 
                '-1002798244043' // Your channel ID from important-links
            );
            
            if (!membershipResult.success || !membershipResult.isMember) {
                console.log('❌ User is not a channel member:', membershipResult);
                this.showScreen('accessDenied');
                return;
            }
            
            console.log('✅ Channel membership verified, loading content...');

            // Load course for student
            this.currentCourse = course;
            this.loadStudentCourseContent();
            this.setupAntiCopyProtection();
            this.updateWatermark();
            this.showScreen('studentCourse');
        } catch (error) {
            console.error('❌ Load student course error:', error);
            this.showScreen('accessDenied');
        }
    }

    async loadStudentCourse(courseId, token) {
        console.log('🔍 Loading student course:', { courseId, token });
        this.showScreen('loading');
        
        try {
            // Validate token and get course
            console.log('🔐 Validating token...');
            const result = await this.api.validateCourseToken(courseId, token);
            console.log('🔐 Token validation result:', result);
            
            if (!result.success) {
                console.log('❌ Token validation failed:', result.error);
                this.showScreen('accessDenied');
                return;
            }

            const course = result.course;
            console.log('📚 Course data:', course);
            
            if (!course.is_active) {
                console.log('❌ Course is not active');
                this.showScreen('accessDenied');
                return;
            }

            // Channel membership check removed - anyone with valid link can access
            console.log('✅ Course validation successful, loading content...');

            // Load course for student
            this.currentCourse = course;
            this.loadStudentCourseContent();
            this.setupAntiCopyProtection();
            this.updateWatermark();
            this.showScreen('studentCourse');
        } catch (error) {
            console.error('❌ Load student course error:', error);
            this.showScreen('accessDenied');
        }
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
            this.showProtectionMessage('🚫 Right-click is disabled');
        });

        // Disable text selection
        courseContent.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });

        // Disable copy/paste
        courseContent.addEventListener('copy', (e) => {
            e.preventDefault();
            this.showProtectionMessage('🚫 Copying is disabled');
        });

        courseContent.addEventListener('paste', (e) => {
            e.preventDefault();
            this.showProtectionMessage('🚫 Pasting is disabled');
        });

        courseContent.addEventListener('cut', (e) => {
            e.preventDefault();
            this.showProtectionMessage('🚫 Cutting is disabled');
        });

        // Disable drag
        courseContent.addEventListener('dragstart', (e) => {
            e.preventDefault();
            this.showProtectionMessage('🚫 Dragging is disabled');
        });

        // Enhanced keyboard shortcuts protection
        document.addEventListener('keydown', (e) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+A
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.key === 's') ||
                (e.ctrlKey && e.key === 'p') ||
                (e.ctrlKey && e.key === 'a') ||
                (e.ctrlKey && e.key === 'c') ||
                (e.ctrlKey && e.key === 'v') ||
                (e.ctrlKey && e.key === 'x')) {
                e.preventDefault();
                this.showProtectionMessage('🚫 This action is disabled');
            }
        });

        // Disable print
        window.addEventListener('beforeprint', (e) => {
            e.preventDefault();
            this.showProtectionMessage('🚫 Printing is disabled');
        });

        // Disable screenshot attempts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                this.showProtectionMessage('🚫 Screenshots are disabled');
            }
        });

        // Disable image saving
        const images = courseContent.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
            img.addEventListener('contextmenu', (e) => e.preventDefault());
            img.style.pointerEvents = 'none';
        });

        // Disable text selection on the entire page when in student mode
        if (this.userRole === 'student') {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
        }

        // Add visual protection overlay
        this.addProtectionOverlay();
    }

    addProtectionOverlay() {
        // Create invisible overlay to prevent interaction with content
        const overlay = document.createElement('div');
        overlay.id = 'protectionOverlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 1;
            pointer-events: none;
        `;
        
        const courseContent = document.getElementById('studentCourseContent');
        courseContent.style.position = 'relative';
        courseContent.appendChild(overlay);
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
