// App State Management
class CourseManager {
    constructor() {
        this.currentScreen = 'login';
        // Initialize subjects as empty array - will be loaded from database
        this.subjects = [];
        this.courses = [];
        this.currentSubject = null;
        this.currentCourse = null;
        this.editingCourseId = null; // Track if we're editing a course
        this.userRole = 'admin'; // 'admin' or 'student'
        this.telegramUser = null;
        this.api = null; // Will be initialized when ready
        this.apiRetryCount = 0; // Track retry attempts
        this.maxApiRetries = 50; // Maximum retry attempts (5 seconds)
        this.deepLinkProcessed = false; // Track if deep link has been processed
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupHashRouting();
        this.setupStudentSection();
        this.setupSubjectManagement(); // Setup subject management functionality
        this.detectUserRole();
        await this.initializeAPI(); // Initialize API and handle deep links
        
        // Load subjects from database after API is ready
        console.log('🔄 Loading subjects in init...');
        console.log('🔄 window.supabaseAPI available:', !!window.supabaseAPI);
        
        if (window.supabaseAPI) {
            this.subjects = await this.loadSubjectsFromDatabase();
        } else {
            console.log('🔄 API not ready, using default subjects');
            this.subjects = this.getDefaultSubjects();
        }
        
        console.log('🔄 Final subjects count:', this.subjects.length);
        await this.loadCourses();
        console.log('🔄 Courses loaded, count:', this.courses.length);
    }

    initializeAPI() {
        console.log(`🔄 Checking for Supabase API... (attempt ${this.apiRetryCount + 1}/${this.maxApiRetries})`);
        console.log('🔄 window.supabaseAPI exists:', !!window.supabaseAPI);
        
        // Wait for Supabase API to be available
        if (window.supabaseAPI) {
            this.api = window.supabaseAPI;
            console.log('✅ Supabase API initialized successfully');
            console.log('✅ API methods available:', Object.keys(this.api));
            
            // Handle deep links first if not already processed
            if (!this.deepLinkProcessed) {
                this.handleDeepLink();
                this.deepLinkProcessed = true;
            }
            
            // Check for existing admin session only if not in student mode
            this.checkExistingSession();
        } else {
            this.apiRetryCount++;
            
            if (this.apiRetryCount >= this.maxApiRetries) {
                console.error('❌ Failed to initialize Supabase API after maximum retries');
                console.error('❌ This might be due to a script loading issue');
                // Show error message to user
                const errorDiv = document.getElementById('loginError');
                if (errorDiv) {
                    errorDiv.textContent = 'Failed to load system. Please refresh the page.';
                    errorDiv.classList.add('show');
                }
                return;
            }
            
            console.log(`⏳ Supabase API not ready, retrying in 100ms... (${this.apiRetryCount}/${this.maxApiRetries})`);
            // Retry after a short delay
            setTimeout(() => {
                this.initializeAPI();
            }, 100);
        }
    }

    async checkExistingSession() {
        try {
            console.log('🔍 Checking for existing admin session...');
            
            // Only check for admin session if we're not in student mode
            if (this.userRole === 'student') {
                console.log('👤 Student mode detected, skipping admin session check');
                return;
            }
            
            if (this.api && await this.api.isAdminLoggedIn()) {
                console.log('✅ Valid admin session found, redirecting to dashboard');
                await this.showScreen('dashboard');
            } else {
                console.log('ℹ️ No valid admin session found, showing login screen');
                this.showScreen('login');
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
            this.showScreen('login');
        }
    }

    retryApiInitialization() {
        console.log('🔄 Manual API retry requested');
        this.apiRetryCount = 0; // Reset retry counter
        this.initializeAPI();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation buttons
        document.getElementById('createCourseBtn').addEventListener('click', () => {
            this.clearCourseForm();
            this.showScreen('courseCreation');
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showScreen('settings');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Mobile menu functionality
        document.getElementById('burgerMenuBtn').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile menu items
        document.getElementById('mobileManageSubjectsBtn').addEventListener('click', () => {
            this.showSubjectModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileSettingsBtn').addEventListener('click', () => {
            this.showScreen('settings');
            this.closeMobileMenu();
        });

        document.getElementById('mobileLogoutBtn').addEventListener('click', () => {
            this.logout();
            this.closeMobileMenu();
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const mobileMenu = document.getElementById('mobileMenu');
            const burgerBtn = document.getElementById('burgerMenuBtn');
            if (mobileMenu && !mobileMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
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

        document.getElementById('backToChapters').addEventListener('click', () => {
            this.showScreen('chaptersList');
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

        // Course subject change handler
        document.getElementById('courseSubject').addEventListener('change', (e) => {
            this.updateChapterDropdown(e.target.value);
        });

        // Watermark toggle
        document.getElementById('watermarkToggle').addEventListener('click', () => {
            this.toggleWatermarkPreview();
        });
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

        // Color preset buttons
        document.querySelectorAll('.color-preset').forEach(button => {
            button.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                document.execCommand('foreColor', false, color);
                
                // Update the text color picker to match
                document.getElementById('textColor').value = color;
                
                // Add visual feedback
                e.target.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                }, 150);
            });
        });

        // Remove formatting button
        document.getElementById('removeFormatting').addEventListener('click', () => {
            // Remove all formatting from selected text
            document.execCommand('removeFormat', false, null);
            
            // Also remove any inline styles that might cause issues
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                
                // If we have a text node, get its parent element
                const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
                
                if (element && element.style) {
                    // Remove problematic styles
                    element.style.color = '';
                    element.style.backgroundColor = '';
                    element.style.fontSize = '';
                    element.style.fontFamily = '';
                }
            }
            
            // Reset color pickers to default
            document.getElementById('textColor').value = '#000000';
            document.getElementById('backgroundColor').value = '#ffffff';
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
        const editor = document.getElementById('courseContent');
        
        if (command === 'insertImage') {
            this.insertImage();
        } else {
            // Use modern text editing methods instead of deprecated execCommand
            this.executeModernCommand(command);
        }
        editor.focus();
    }

    executeModernCommand(command) {
        const editor = document.getElementById('courseContent');
        const selection = window.getSelection();
        
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        
        switch (command) {
            case 'bold':
                this.toggleFormat('strong');
                break;
            case 'italic':
                this.toggleFormat('em');
                break;
            case 'underline':
                this.toggleFormat('u');
                break;
            case 'justifyLeft':
                this.setAlignment('left');
                break;
            case 'justifyCenter':
                this.setAlignment('center');
                break;
            case 'justifyRight':
                this.setAlignment('right');
                break;
            case 'justifyFull':
                this.setAlignment('justify');
                break;
            case 'insertUnorderedList':
                this.insertList('ul');
                break;
            case 'insertOrderedList':
                this.insertList('ol');
                break;
            case 'indent':
                this.indentElement();
                break;
            case 'outdent':
                this.outdentElement();
                break;
            default:
                // Fallback to execCommand for other commands
                document.execCommand(command, false, null);
        }
    }

    toggleFormat(tagName) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Check if already formatted
        const existingTag = element.closest(tagName);
        if (existingTag) {
            // Remove formatting
            const parent = existingTag.parentNode;
            while (existingTag.firstChild) {
                parent.insertBefore(existingTag.firstChild, existingTag);
            }
            parent.removeChild(existingTag);
        } else {
            // Add formatting
            const selectedText = range.toString();
            if (selectedText) {
                const newElement = document.createElement(tagName);
                newElement.textContent = selectedText;
                range.deleteContents();
                range.insertNode(newElement);
            }
        }
    }

    setAlignment(alignment) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Find the paragraph or div to align
        const blockElement = element.closest('p, div, h1, h2, h3, h4, h5, h6') || element;
        blockElement.style.textAlign = alignment;
    }

    insertList(listType) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        if (selectedText) {
            const list = document.createElement(listType);
            const listItem = document.createElement('li');
            listItem.textContent = selectedText;
            list.appendChild(listItem);
            
            range.deleteContents();
            range.insertNode(list);
        }
    }

    indentElement() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        const blockElement = element.closest('p, div, li') || element;
        const currentMargin = parseInt(blockElement.style.marginLeft) || 0;
        blockElement.style.marginLeft = (currentMargin + 20) + 'px';
    }

    outdentElement() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        const blockElement = element.closest('p, div, li') || element;
        const currentMargin = parseInt(blockElement.style.marginLeft) || 0;
        blockElement.style.marginLeft = Math.max(0, currentMargin - 20) + 'px';
    }

    updateToolbarState() {
        const editor = document.getElementById('courseContent');
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            
            // Update button states with modern methods
            document.querySelectorAll('.toolbar-btn').forEach(btn => {
                const command = btn.dataset.command;
                let isActive = false;
                
                switch (command) {
                    case 'bold':
                        isActive = !!element.closest('strong, b');
                        break;
                    case 'italic':
                        isActive = !!element.closest('em, i');
                        break;
                    case 'underline':
                        isActive = !!element.closest('u');
                        break;
                    case 'justifyLeft':
                        isActive = element.style.textAlign === 'left';
                        break;
                    case 'justifyCenter':
                        isActive = element.style.textAlign === 'center';
                        break;
                    case 'justifyRight':
                        isActive = element.style.textAlign === 'right';
                        break;
                    case 'justifyFull':
                        isActive = element.style.textAlign === 'justify';
                        break;
                    default:
                        // Fallback to execCommand for other commands
                        isActive = document.queryCommandState ? document.queryCommandState(command) : false;
                }
                
                if (isActive) {
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

        if (!this.api) {
            errorDiv.innerHTML = 'System is still loading. Please wait a moment and try again.<br><button type="button" onclick="courseManager.retryApiInitialization()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>';
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
                await this.showScreen('dashboard');
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

    async logout() {
        try {
            // Clear the session from the API
            if (this.api) {
                await this.api.logoutAdmin();
            }
            
            // Clear the password field
            document.getElementById('adminPassword').value = '';
            
            // Show login screen
            this.showScreen('login');
            
            console.log('✅ Admin logged out successfully');
        } catch (error) {
            console.error('❌ Error during logout:', error);
            // Still show login screen even if logout fails
            this.showScreen('login');
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const burgerBtn = document.getElementById('burgerMenuBtn');
        
        if (mobileMenu.classList.contains('show')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const burgerBtn = document.getElementById('burgerMenuBtn');
        
        mobileMenu.classList.add('show');
        burgerBtn.classList.add('active');
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const burgerBtn = document.getElementById('burgerMenuBtn');
        
        mobileMenu.classList.remove('show');
        burgerBtn.classList.remove('active');
    }

    toggleWatermarkPreview() {
        const courseContent = document.getElementById('courseContent');
        const watermarkBtn = document.getElementById('watermarkToggle');
        
        if (courseContent.classList.contains('watermarked-container')) {
            // Remove watermark
            courseContent.classList.remove('watermarked-container');
            this.removeAdditionalWatermarks(courseContent);
            watermarkBtn.classList.remove('active');
            watermarkBtn.title = 'Show Watermark Preview';
            console.log('🔍 Watermark preview hidden');
        } else {
            // Add watermark
            courseContent.classList.add('watermarked-container');
            this.addAdditionalWatermarks(courseContent);
            watermarkBtn.classList.add('active');
            watermarkBtn.title = 'Hide Watermark Preview';
            console.log('🔍 Watermark preview shown');
        }
    }

    addAdditionalWatermarks(container) {
        // Remove any existing additional watermarks first
        this.removeAdditionalWatermarks(container);
        
        // Create 98 additional watermarks (3-100) distributed throughout the content
        for (let i = 3; i <= 100; i++) {
            const watermark = document.createElement('div');
            watermark.className = `additional-watermark watermark-${i}`;
            watermark.innerHTML = 'BRIGHT<br>FRESH';
            container.appendChild(watermark);
        }
        
        console.log(`🔍 Added ${98} additional watermarks (total: 100 watermarks)`);
    }

    removeAdditionalWatermarks(container) {
        const existingWatermarks = container.querySelectorAll('.additional-watermark');
        existingWatermarks.forEach(watermark => watermark.remove());
    }

    embedWatermarksInContent(content) {
        // Create watermark layer HTML for all 100 watermarks using CSS pseudo-elements
        let watermarkLayersHTML = '';
        
        // Add 49 watermark layers (each layer has 2 watermarks via ::before and ::after)
        // This gives us 98 additional watermarks (3-100) plus the 2 from watermarked-container = 100 total
        for (let i = 1; i <= 49; i++) {
            watermarkLayersHTML += `<div class="watermark-layer-${i}"></div>`;
        }
        
        // Wrap content in watermarked container with all watermark layers
        return `<div class="watermarked-container" style="position: relative; overflow: hidden; width: 100%; min-height: 100vh;">
            <div class="course-content" style="position: relative; z-index: 1; width: 100%; max-width: none; padding: 20px; margin: 0; line-height: 1.8; font-size: 1.1rem; text-align: left;">
                ${content}
            </div>
            ${watermarkLayersHTML}
        </div>`;
    }

    async showScreen(screenName) {
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
            console.log('🔄 Dashboard screen activated');
            console.log('🔄 Current subjects count:', this.subjects.length);
            console.log('🔄 Current courses count:', this.courses.length);
            
            // Ensure subjects are loaded before displaying
            if (this.subjects.length === 0) {
                console.log('🔄 No subjects found, loading from database...');
                await this.loadSubjectsFromDatabase();
                await this.loadCourses();
            }
            
            console.log('🔄 About to call loadSubjects()');
            this.loadSubjects();
        } else if (screenName === 'courseCreation') {
            this.updateCourseSubjectDropdown();
        } else if (screenName === 'chaptersList') {
            this.loadChapters();
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
            
            const courseCount = this.courses.filter(course => course.subject === subject.id).length;

            subjectCard.innerHTML = `
                <div class="subject-header">
                    <span class="subject-title">${subject.name}</span>
                    <span class="subject-price">${courseCount} Courses</span>
                </div>
                <p class="subject-desc">${subject.description || `Manage your ${subject.name.toLowerCase()} courses`}</p>
                <ul class="subject-lists">
                    <li class="subject-list">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span>Interactive Learning</span>
                    </li>
                    <li class="subject-list">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span>Progress Tracking</span>
                    </li>
                    <li class="subject-list">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span>Expert Content</span>
                    </li>
                </ul>
                <div class="subject-actions">
                    <button class="btn-action btn-edit" onclick="event.stopPropagation(); window.courseManager.editSubject(${JSON.stringify(subject).replace(/"/g, '&quot;')})" title="Edit Subject">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" onclick="event.stopPropagation(); window.courseManager.deleteSubject('${subject.id}')" title="Delete Subject">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            // Add click handler for the main card area (excluding buttons)
            subjectCard.addEventListener('click', (e) => {
                if (!e.target.closest('.subject-actions')) {
                    this.currentSubject = subject.id;
                    document.getElementById('chaptersSubjectTitle').textContent = subject.name + ' Chapters';
                    this.showScreen('chaptersList');
                }
            });

            subjectsGrid.appendChild(subjectCard);
        });
        
        // Update course creation dropdown with latest subjects
        this.updateCourseSubjectDropdown();
    }

    loadChapters() {
        const chaptersList = document.getElementById('chaptersList');
        chaptersList.innerHTML = '';

        const subject = this.subjects.find(s => s.id === this.currentSubject);
        if (!subject || !subject.chapters) {
            chaptersList.innerHTML = '<p>No chapters found for this subject.</p>';
            return;
        }

        // Add a special folder for courses without chapters
        const unassignedCourses = this.courses.filter(course => 
            course.subject === this.currentSubject && (!course.chapter || course.chapter === '')
        );
        
        if (unassignedCourses.length > 0) {
            const unassignedFolder = document.createElement('button');
            unassignedFolder.className = 'chapter-folder';
            
            unassignedFolder.innerHTML = `
                <div>
                    <div class="pencil"></div>
                    <div class="folder">
                        <div class="top">
                            <svg viewBox="0 0 24 27">
                                <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z"></path>
                            </svg>
                        </div>
                        <div class="paper"></div>
                    </div>
                </div>
                Unassigned Courses (${unassignedCourses.length} courses)
            `;

            unassignedFolder.addEventListener('click', () => {
                this.currentChapter = null; // No chapter selected
                document.getElementById('coursesChapterTitle').textContent = `${subject.name} - Unassigned Courses`;
                this.showScreen('coursesList');
            });

            chaptersList.appendChild(unassignedFolder);
        }

        subject.chapters.forEach(chapter => {
            const chapterFolder = document.createElement('button');
            chapterFolder.className = 'chapter-folder';
            
            // Count courses for this chapter
            const chapterCourses = this.courses.filter(course => 
                course.subject === this.currentSubject && course.chapter === chapter.id
            );
            const courseCount = chapterCourses.length;

            chapterFolder.innerHTML = `
                <div>
                    <div class="pencil"></div>
                    <div class="folder">
                        <div class="top">
                            <svg viewBox="0 0 24 27">
                                <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z"></path>
                            </svg>
                        </div>
                        <div class="paper"></div>
                    </div>
                </div>
                ${chapter.name} (${courseCount} courses)
            `;

            chapterFolder.addEventListener('click', () => {
                this.currentChapter = chapter.id;
                document.getElementById('coursesChapterTitle').textContent = `${subject.name} - ${chapter.name}`;
                this.showScreen('coursesList');
            });

            chaptersList.appendChild(chapterFolder);
        });
    }

    loadCoursesForSubject() {
        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';

        // Filter courses by both subject and chapter
        let subjectCourses;
        if (this.currentChapter === null) {
            // Show unassigned courses (courses without chapters)
            subjectCourses = this.courses.filter(course => 
                course.subject === this.currentSubject && (!course.chapter || course.chapter === '')
            );
        } else if (this.currentChapter) {
            // Show courses for specific chapter
            subjectCourses = this.courses.filter(course => 
                course.subject === this.currentSubject && 
                course.chapter === this.currentChapter
            );
        } else {
            // Fallback: show all courses for the subject if no chapter is selected
            subjectCourses = this.courses.filter(course => 
                course.subject === this.currentSubject
            );
        }

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
        const chapter = document.getElementById('courseChapter').value;
        let content = document.getElementById('courseContent').innerHTML;

        if (!title || !subject || !chapter || !content.trim()) {
            this.showMessage('Please fill in all fields including chapter', 'error');
            return;
        }

        // Check if watermarks are enabled and embed them in the content
        const watermarkToggle = document.getElementById('watermarkToggle');
        if (watermarkToggle && watermarkToggle.classList.contains('active')) {
            console.log('🏷️ Watermarks enabled - embedding 100 watermarks in content');
            content = this.embedWatermarksInContent(content);
        }

        try {
            const courseData = {
                title,
                subject,
                chapter,
                content,
                images: [] // We'll add image upload later
            };
            
            console.log('💾 Saving course with data:', courseData);

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
                await this.showScreen('dashboard');
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
        
        // Update chapter dropdown and select the course's chapter
        console.log('📝 Editing course:', course);
        console.log('📝 Course chapter:', course.chapter);
        this.updateChapterDropdown(course.subject);
        setTimeout(() => {
            document.getElementById('courseChapter').value = course.chapter || '';
            console.log('📝 Set chapter dropdown to:', course.chapter || '');
        }, 100);
        
        document.getElementById('courseContent').innerHTML = course.content;
        this.updatePreview();
        
        // Update header title to show edit mode
        const headerTitle = document.querySelector('#courseCreation header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Edit Course';
        }
        
        // Update save button text
        const saveBtn = document.getElementById('saveCourse');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Course';
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
                    
                    /* Watermark styles */
                    .watermarked-container {
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .watermarked-container::before {
                        content: 'BRIGHT\A FRESH';
                        position: absolute;
                        top: 0%;
                        left: 50%;
                        color: rgba(128, 128, 128, 0.3);
                        font-size: 2.2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        transform: translateX(-50%) rotate(10deg);
                        z-index: -1;
                        user-select: none;
                        pointer-events: none;
                        font-family: Arial, sans-serif;
                        letter-spacing: 0.1em;
                        white-space: pre-line;
                        line-height: 0.9;
                        text-align: center;
                        text-shadow: 0 0 8px rgba(128, 128, 128, 0.2);
                    }
                    
                    .watermarked-container::after {
                        content: 'BRIGHT\A FRESH';
                        position: absolute;
                        top: 1%;
                        left: 50%;
                        color: rgba(128, 128, 128, 0.3);
                        font-size: 2.2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        transform: translateX(-50%) rotate(10deg);
                        z-index: -1;
                        user-select: none;
                        pointer-events: none;
                        font-family: Arial, sans-serif;
                        letter-spacing: 0.1em;
                        white-space: pre-line;
                        line-height: 0.9;
                        text-align: center;
                        text-shadow: 0 0 8px rgba(128, 128, 128, 0.2);
                    }
                    
                    .watermark-3 {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        color: rgba(128, 128, 128, 0.3);
                        font-size: 2.2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        transform: translateX(-50%) rotate(10deg);
                        z-index: -1;
                        user-select: none;
                        pointer-events: none;
                        font-family: Arial, sans-serif;
                        letter-spacing: 0.1em;
                        line-height: 0.9;
                        text-align: center;
                        text-shadow: 0 0 8px rgba(128, 128, 128, 0.2);
                    }
                    
                    .watermark-4 {
                        position: absolute;
                        bottom: 10%;
                        left: 50%;
                        color: rgba(128, 128, 128, 0.3);
                        font-size: 2.2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        transform: translateX(-50%) rotate(10deg);
                        z-index: -1;
                        user-select: none;
                        pointer-events: none;
                        font-family: Arial, sans-serif;
                        letter-spacing: 0.1em;
                        line-height: 0.9;
                        text-align: center;
                        text-shadow: 0 0 8px rgba(128, 128, 128, 0.2);
                    }
                    
                    .additional-watermark {
                        position: absolute;
                        color: rgba(128, 128, 128, 0.3);
                        font-size: 2.2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        transform: translateX(-50%) rotate(10deg);
                        z-index: -1;
                        user-select: none;
                        pointer-events: none;
                        font-family: Arial, sans-serif;
                        letter-spacing: 0.1em;
                        white-space: pre-line;
                        line-height: 0.9;
                        text-align: center;
                        text-shadow: 0 0 8px rgba(128, 128, 128, 0.2);
                        left: 50%;
                    }
                    
                    .watermark-layer-1::before { content: 'BRIGHT\A FRESH'; top: 2%; }
                    .watermark-layer-1::after { content: 'BRIGHT\A FRESH'; top: 3%; }
                    .watermark-4 { top: 3%; }
                    .watermark-5 { top: 4%; }
                    .watermark-6 { top: 5%; }
                    .watermark-7 { top: 6%; }
                    .watermark-8 { top: 7%; }
                    .watermark-9 { top: 8%; }
                    .watermark-10 { top: 9%; }
                    .watermark-11 { top: 10%; }
                    .watermark-12 { top: 11%; }
                    .watermark-13 { top: 12%; }
                    .watermark-14 { top: 13%; }
                    .watermark-15 { top: 14%; }
                    .watermark-16 { top: 15%; }
                    .watermark-17 { top: 16%; }
                    .watermark-18 { top: 17%; }
                    .watermark-19 { top: 18%; }
                    .watermark-20 { top: 19%; }
                    .watermark-21 { top: 20%; }
                    .watermark-22 { top: 21%; }
                    .watermark-23 { top: 22%; }
                    .watermark-24 { top: 23%; }
                    .watermark-25 { top: 24%; }
                    .watermark-26 { top: 25%; }
                    .watermark-27 { top: 26%; }
                    .watermark-28 { top: 27%; }
                    .watermark-29 { top: 28%; }
                    .watermark-30 { top: 29%; }
                    .watermark-31 { top: 30%; }
                    .watermark-32 { top: 31%; }
                    .watermark-33 { top: 32%; }
                    .watermark-34 { top: 33%; }
                    .watermark-35 { top: 34%; }
                    .watermark-36 { top: 35%; }
                    .watermark-37 { top: 36%; }
                    .watermark-38 { top: 37%; }
                    .watermark-39 { top: 38%; }
                    .watermark-40 { top: 39%; }
                    .watermark-41 { top: 40%; }
                    .watermark-42 { top: 41%; }
                    .watermark-43 { top: 42%; }
                    .watermark-44 { top: 43%; }
                    .watermark-45 { top: 44%; }
                    .watermark-46 { top: 45%; }
                    .watermark-47 { top: 46%; }
                    .watermark-48 { top: 47%; }
                    .watermark-49 { top: 48%; }
                    .watermark-50 { top: 49%; }
                    .watermark-51 { top: 50%; }
                    .watermark-52 { top: 51%; }
                    .watermark-53 { top: 52%; }
                    .watermark-54 { top: 53%; }
                    .watermark-55 { top: 54%; }
                    .watermark-56 { top: 55%; }
                    .watermark-57 { top: 56%; }
                    .watermark-58 { top: 57%; }
                    .watermark-59 { top: 58%; }
                    .watermark-60 { top: 59%; }
                    .watermark-61 { top: 60%; }
                    .watermark-62 { top: 61%; }
                    .watermark-63 { top: 62%; }
                    .watermark-64 { top: 63%; }
                    .watermark-65 { top: 64%; }
                    .watermark-66 { top: 65%; }
                    .watermark-67 { top: 66%; }
                    .watermark-68 { top: 67%; }
                    .watermark-69 { top: 68%; }
                    .watermark-70 { top: 69%; }
                    .watermark-71 { top: 70%; }
                    .watermark-72 { top: 71%; }
                    .watermark-73 { top: 72%; }
                    .watermark-74 { top: 73%; }
                    .watermark-75 { top: 74%; }
                    .watermark-76 { top: 75%; }
                    .watermark-77 { top: 76%; }
                    .watermark-78 { top: 77%; }
                    .watermark-79 { top: 78%; }
                    .watermark-80 { top: 79%; }
                    .watermark-81 { top: 80%; }
                    .watermark-82 { top: 81%; }
                    .watermark-83 { top: 82%; }
                    .watermark-84 { top: 83%; }
                    .watermark-85 { top: 84%; }
                    .watermark-86 { top: 85%; }
                    .watermark-87 { top: 86%; }
                    .watermark-88 { top: 87%; }
                    .watermark-89 { top: 88%; }
                    .watermark-90 { top: 89%; }
                    .watermark-91 { top: 90%; }
                    .watermark-92 { top: 91%; }
                    .watermark-93 { top: 92%; }
                    .watermark-94 { top: 93%; }
                    .watermark-95 { top: 94%; }
                    .watermark-96 { top: 95%; }
                    .watermark-97 { top: 96%; }
                    .watermark-98 { top: 97%; }
                    .watermark-99 { top: 98%; }
                    .watermark-100 { top: 99%; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="watermarked-container">
                    ${content}
                    <div class="watermark-layer-1"></div>
                    <div class="watermark-layer-2"></div>
                    <div class="watermark-layer-3"></div>
                    <div class="watermark-layer-4"></div>
                    <div class="watermark-layer-5"></div>
                    <div class="watermark-layer-6"></div>
                    <div class="watermark-layer-7"></div>
                    <div class="watermark-layer-8"></div>
                    <div class="watermark-layer-9"></div>
                    <div class="watermark-layer-10"></div>
                    <div class="watermark-layer-11"></div>
                    <div class="watermark-layer-12"></div>
                    <div class="watermark-layer-13"></div>
                    <div class="watermark-layer-14"></div>
                    <div class="watermark-layer-15"></div>
                    <div class="watermark-layer-16"></div>
                    <div class="watermark-layer-17"></div>
                    <div class="watermark-layer-18"></div>
                    <div class="watermark-layer-19"></div>
                    <div class="watermark-layer-20"></div>
                    <div class="watermark-layer-21"></div>
                    <div class="watermark-layer-22"></div>
                    <div class="watermark-layer-23"></div>
                    <div class="watermark-layer-24"></div>
                    <div class="watermark-layer-25"></div>
                    <div class="watermark-layer-26"></div>
                    <div class="watermark-layer-27"></div>
                    <div class="watermark-layer-28"></div>
                    <div class="watermark-layer-29"></div>
                    <div class="watermark-layer-30"></div>
                    <div class="watermark-layer-31"></div>
                    <div class="watermark-layer-32"></div>
                    <div class="watermark-layer-33"></div>
                    <div class="watermark-layer-34"></div>
                    <div class="watermark-layer-35"></div>
                    <div class="watermark-layer-36"></div>
                    <div class="watermark-layer-37"></div>
                    <div class="watermark-layer-38"></div>
                    <div class="watermark-layer-39"></div>
                    <div class="watermark-layer-40"></div>
                    <div class="watermark-layer-41"></div>
                    <div class="watermark-layer-42"></div>
                    <div class="watermark-layer-43"></div>
                    <div class="watermark-layer-44"></div>
                    <div class="watermark-layer-45"></div>
                    <div class="watermark-layer-46"></div>
                    <div class="watermark-layer-47"></div>
                    <div class="watermark-layer-48"></div>
                    <div class="watermark-layer-49"></div>
                </div>
            </body>
            </html>
        `);
    }

    clearCourseForm() {
        document.getElementById('courseTitle').value = '';
        document.getElementById('courseSubject').value = '';
        document.getElementById('courseChapter').innerHTML = '<option value="">Select Chapter</option>';
        document.getElementById('courseContent').innerHTML = '';
        this.editingCourseId = null; // Reset editing state
        
        // Reset header title to create mode
        const headerTitle = document.querySelector('#courseCreation header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Create New Course';
        }
        
        // Reset save button text
        const saveBtn = document.getElementById('saveCourse');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Course';
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
                const telegramLink = `https://t.me/brightadmin_bot/CourseView?startapp=${courseId}_${token}`;
                
                // Also create a simple direct link for testing
                const directLink = `https://tg-course.vercel.app/?course=${courseId}&token=${token}`;
                
                // Find course for display
                const course = this.courses.find(c => c.course_id === courseId);
                if (course) {
                    this.showLinkModal(course.title, telegramLink, miniAppUrl, directLink, courseId);
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

    showLinkModal(title, telegramLink, miniAppUrl, directLink, courseId) {
        const modal = document.createElement('div');
        modal.className = 'link-modal';
        modal.innerHTML = `
            <div class="link-modal-content" onclick="event.stopPropagation()">
                <div class="link-modal-header">
                    <h3>Course Link Generated</h3>
                    <button class="close-modal" onclick="this.closest('.link-modal').remove()" title="Close">
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
                         <h4 style="color: #e74c3c; margin-bottom: 10px;">🚀 Post to Channels</h4>
                         <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                             <button class="btn-upload btn-post-1" onclick="window.courseManager.postToChannel('${courseId}', 'brightclassb')">
                                 <i class="fas fa-paper-plane"></i> Post to Bright Class-B
                             </button>
                             <button class="btn-upload btn-post-2" onclick="window.courseManager.postToChannel('${courseId}', 'brightclassa')">
                                 <i class="fas fa-paper-plane"></i> Post to Bright Class-A
                             </button>
                         </div>
                         <p style="font-size: 12px; color: #666; margin-top: 5px;">
                             Automatically post this course link to your channels
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
                    
                    <div class="modal-footer" style="margin-top: 30px; text-align: center; padding: 20px 0; border-top: 1px solid var(--border-light); position: sticky; bottom: 0; background: var(--text-white);">
                        <button class="btn btn-secondary" onclick="this.closest('.link-modal').remove()" style="padding: 12px 30px;">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add click-outside-to-close functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add ESC key to close
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
        
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
                '-1003004502647' // Your channel ID
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
        
        // Note: Session checking will override this if admin is logged in
        console.log('👤 Final user role:', this.userRole);
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

            // Check channel membership based on course's channel type
            console.log('🔍 Checking channel membership...');
            console.log('📋 Course data:', course);
            console.log('📋 Course channel_type:', course.channel_type);
            
            let channelType = 'brightclassb'; // Default to Bright Class-B
            
            // If course has channel_type info, use that
            if (course.channel_type) {
                channelType = course.channel_type;
                console.log(`📢 Course was posted to: ${channelType}`);
            } else {
                console.log('📢 No channel info found, checking both channels...');
            }
            
            // Check the specific channel first
            console.log(`🔍 Checking membership for channel: ${channelType}`);
            console.log(`🔍 User ID: ${this.telegramUser.id}`);
            
            console.log(`🔍 About to call checkChannelMembership with:`, {
                telegramUserId: this.telegramUser.id,
                channelType: channelType
            });
            
            let membershipResult = await this.api.checkChannelMembership(
                this.telegramUser.id, 
                channelType
            );
            
            console.log(`📋 Membership result for ${channelType}:`, membershipResult);
            
            // If not a member of the specific channel, check the other channel as fallback
            if (!membershipResult.success || !membershipResult.isMember) {
                const fallbackChannel = channelType === 'brightclassb' ? 'brightclassa' : 'brightclassb';
                console.log(`❌ Not a member of ${channelType}, checking ${fallbackChannel}...`);
                
                membershipResult = await this.api.checkChannelMembership(
                    this.telegramUser.id, 
                    fallbackChannel
                );
                
                console.log(`📋 Membership result for ${fallbackChannel}:`, membershipResult);
            }
            
            if (!membershipResult.success || !membershipResult.isMember) {
                console.log('❌ User is not a member of any channel:', membershipResult);
                this.showScreen('accessDenied');
                return;
            }
            
            console.log(`✅ Channel membership verified for ${membershipResult.channelName}`);
            
            console.log('✅ Channel membership verified, loading content...');

            // Load course for student
            this.currentCourse = course;
            this.loadStudentCourseContent();
            this.setupAntiCopyProtection();
            this.updateWatermark();
            this.setupWatermark();
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
            this.setupWatermark();
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
        
        // Check if content already has embedded watermarks
        if (this.currentCourse.content.includes('watermarked-container')) {
            // Content already has embedded watermarks, display as-is
            document.getElementById('studentCourseContent').innerHTML = this.currentCourse.content;
        } else {
            // Content doesn't have watermarks, display normally
            document.getElementById('studentCourseContent').innerHTML = this.currentCourse.content;
        }
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

    setupWatermark() {
        // The watermark is now handled purely by CSS pseudo-element
        // The ::after pseudo-element creates the watermark automatically
        // No JavaScript needed - it's all CSS-based
        console.log('✅ Watermark setup complete - using CSS pseudo-element method');
    }

    // Subject Management Methods
    setupSubjectManagement() {
        // Manage Subjects button
        document.getElementById('manageSubjectsBtn').addEventListener('click', () => {
            this.showSubjectModal();
        });

        // Subject modal event listeners
        document.getElementById('closeSubjectModal').addEventListener('click', () => {
            this.hideSubjectModal();
        });

        document.getElementById('cancelSubject').addEventListener('click', () => {
            this.hideSubjectModal();
        });

        // Subject form submission
        document.getElementById('subjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSubject();
        });

        // Close modal when clicking outside
        document.getElementById('subjectModal').addEventListener('click', (e) => {
            if (e.target.id === 'subjectModal') {
                this.hideSubjectModal();
            }
        });
    }

    showSubjectModal(subject = null) {
        const modal = document.getElementById('subjectModal');
        const title = document.getElementById('subjectModalTitle');
        const form = document.getElementById('subjectForm');
        
        if (subject) {
            // Editing existing subject
            title.textContent = 'Edit Subject';
            document.getElementById('subjectName').value = subject.name;
            document.getElementById('subjectDescription').value = subject.description || '';
            document.getElementById('subjectIcon').value = subject.icon;
            document.getElementById('subjectChapters').value = subject.chapters ? subject.chapters.length : 6;
            form.dataset.editingId = subject.id;
        } else {
            // Adding new subject
            title.textContent = 'Add New Subject';
            form.reset();
            document.getElementById('subjectChapters').value = 6; // Default to 6 chapters
            delete form.dataset.editingId;
        }
        
        modal.classList.add('show');
        this.clearSubjectMessages();
    }

    hideSubjectModal() {
        const modal = document.getElementById('subjectModal');
        modal.classList.remove('show');
        document.getElementById('subjectForm').reset();
        delete document.getElementById('subjectForm').dataset.editingId;
        this.clearSubjectMessages();
    }

    async saveSubject() {
        const form = document.getElementById('subjectForm');
        const name = document.getElementById('subjectName').value.trim();
        const description = document.getElementById('subjectDescription').value.trim();
        const icon = document.getElementById('subjectIcon').value.trim();
        const chapterCount = parseInt(document.getElementById('subjectChapters').value);
        const isEditing = form.dataset.editingId;

        if (!name || !icon || !chapterCount) {
            this.showSubjectError('Please fill in all required fields including number of chapters.');
            return;
        }

        // Check if subject name already exists (excluding current subject if editing)
        const existingSubject = this.subjects.find(s => 
            s.name.toLowerCase() === name.toLowerCase() && 
            (!isEditing || s.id !== isEditing)
        );
        
        if (existingSubject) {
            this.showSubjectError('A subject with this name already exists.');
            return;
        }

        try {
            if (isEditing) {
                // Update existing subject in database
                const subjectData = {
                    name: name,
                    description: description,
                    icon: icon,
                    color: this.subjects.find(s => s.id === isEditing)?.color || this.getRandomColor(),
                    chapters: this.generateChapters(isEditing, chapterCount)
                };

                const result = await window.supabaseAPI.updateSubject(isEditing, subjectData);
                if (result.success) {
                    // Update local subjects array
                    const subjectIndex = this.subjects.findIndex(s => s.id === isEditing);
                    if (subjectIndex !== -1) {
                        this.subjects[subjectIndex] = {
                            ...this.subjects[subjectIndex],
                            name: name,
                            description: description,
                            icon: icon,
                            chapters: subjectData.chapters
                        };
                    }
                    this.showSubjectSuccess('Subject updated successfully!');
                } else {
                    this.showSubjectError('Failed to update subject: ' + result.error);
                    return;
                }
            } else {
                // Create new subject in database
                const newSubject = {
                    id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    name: name,
                    description: description,
                    icon: icon,
                    color: this.getRandomColor(),
                    chapters: this.generateChapters(name.toLowerCase().replace(/[^a-z0-9]/g, '_'), chapterCount)
                };

                const result = await window.supabaseAPI.createSubject(newSubject);
                if (result.success) {
                    // Add to local subjects array
                    this.subjects.push(newSubject);
                    this.showSubjectSuccess('Subject added successfully!');
                } else {
                    this.showSubjectError('Failed to create subject: ' + result.error);
                    return;
                }
            }

            // Refresh the subjects display
            this.loadSubjects();
            
            // Update course creation dropdown
            this.updateCourseSubjectDropdown();
            
            // Close modal after a short delay
            setTimeout(() => {
                this.hideSubjectModal();
            }, 1500);

        } catch (error) {
            console.error('Error saving subject:', error);
            this.showSubjectError('An error occurred while saving the subject.');
        }
    }

    generateChapters(subjectId, count) {
        const chapters = [];
        for (let i = 1; i <= count; i++) {
            chapters.push({
                id: `${subjectId}_ch${i}`,
                name: `Chapter ${i}`,
                number: i
            });
        }
        return chapters;
    }

    getRandomColor() {
        const colors = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    editSubject(subject) {
        this.showSubjectModal(subject);
    }

    async deleteSubject(subjectId) {
        if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
            // Check if subject has courses
            const subjectCourses = this.courses.filter(course => course.subject === subjectId);
            if (subjectCourses.length > 0) {
                alert('Cannot delete subject with existing courses. Please delete or move the courses first.');
                return;
            }

            try {
                // Delete subject from database
                const result = await window.supabaseAPI.deleteSubject(subjectId);
                if (result.success) {
                    // Remove subject from local array
                    this.subjects = this.subjects.filter(s => s.id !== subjectId);
                    
                    // Refresh the subjects display
                    this.loadSubjects();
                    
                    // Update course creation dropdown
                    this.updateCourseSubjectDropdown();
                    
                    this.showSubjectSuccess('Subject deleted successfully!');
                } else {
                    this.showSubjectError('Failed to delete subject: ' + result.error);
                }
            } catch (error) {
                console.error('Error deleting subject:', error);
                this.showSubjectError('An error occurred while deleting the subject.');
            }
        }
    }

    showSubjectError(message) {
        const errorDiv = document.getElementById('subjectError');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
    }

    showSubjectSuccess(message) {
        const successDiv = document.getElementById('subjectSuccess');
        successDiv.textContent = message;
        successDiv.classList.add('show');
        setTimeout(() => successDiv.classList.remove('show'), 3000);
    }

    clearSubjectMessages() {
        document.getElementById('subjectError').classList.remove('show');
        document.getElementById('subjectSuccess').classList.remove('show');
    }

    // Subject Persistence Methods
    async loadSubjectsFromDatabase() {
        try {
            console.log('🔄 Attempting to load subjects from database...');
            console.log('🔄 window.supabaseAPI available:', !!window.supabaseAPI);
            
            if (!window.supabaseAPI) {
                console.error('❌ Supabase API not available, using default subjects');
                return this.getDefaultSubjects();
            }

            console.log('🔄 Calling getSubjects...');
            const result = await window.supabaseAPI.getSubjects();
            console.log('🔄 getSubjects result:', result);
            
            if (result.success) {
                console.log('✅ Subjects loaded from database:', result.data);
                console.log('✅ Subjects count:', result.data.length);
                return result.data;
            } else {
                console.error('❌ Failed to load subjects from database:', result.error);
                console.log('🔄 Falling back to default subjects');
                return this.getDefaultSubjects();
            }
        } catch (error) {
            console.error('❌ Error loading subjects from database:', error);
            console.log('🔄 Falling back to default subjects due to error');
            return this.getDefaultSubjects();
        }
    }

    getDefaultSubjects() {
        // Return default subjects if database fails
        return [
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
    }

    async saveSubjectsToDatabase() {
        try {
            if (!window.supabaseAPI) {
                console.error('❌ Supabase API not available');
                return false;
            }

            // For now, we'll save subjects individually when they're created/updated
            // This method is kept for compatibility but the actual saving happens in saveSubject()
            console.log('✅ Subjects are now managed through individual database operations');
            return true;
        } catch (error) {
            console.error('❌ Error saving subjects to database:', error);
            return false;
        }
    }

    async postToChannel(courseId, channelType) {
        try {
            // Find the course
            const course = this.courses.find(c => c.course_id === courseId);
            if (!course) {
                this.showMessage('Course not found', 'error');
                return;
            }

            // Channel configurations
            const channelConfigs = {
                'brightclassb': {
                    name: 'Bright Class-B'
                },
                'brightclassa': {
                    name: 'Bright Class-A'
                }
            };

            const channel = channelConfigs[channelType];
            if (!channel) {
                this.showMessage('Invalid channel type', 'error');
                return;
            }

            // Generate course link first
            const result = await this.api.generateCourseToken(courseId);
            if (!result.success) {
                this.showMessage('Failed to generate course link', 'error');
                return;
            }

            const token = result.token;
            // Use the Telegram Mini App link format for posting to channels
            const courseLink = `https://t.me/brightadmin_bot/CourseView?startapp=${courseId}_${token}`;
            
            console.log(`📢 Posting to ${channel.name} with link:`, courseLink);

            // Show loading message
            this.showMessage(`Posting to ${channel.name}...`, 'info');

            // Post to channel using Supabase Edge Function
            const response = await fetch(`${this.api.supabaseUrl}/functions/v1/post-to-channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.api.supabaseKey}`
                },
                body: JSON.stringify({
                    courseTitle: course.title,
                    courseLink: courseLink,
                    channelType: channelType
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(`Course posted to ${channel.name} successfully!`, 'success');
                
                // Update course with channel information for future reference
                await this.updateCourseChannel(courseId, channelType);
            } else {
                this.showMessage(`Failed to post to ${channel.name}: ${data.error}`, 'error');
            }

        } catch (error) {
            console.error('Post to channel error:', error);
            this.showMessage('Failed to post to channel. Please try again.', 'error');
        }
    }

    async updateCourseChannel(courseId, channelType) {
        try {
            // Update the course in the database to track which channel it was posted to
            const result = await this.api.updateCourse(courseId, {
                channel_type: channelType,
                last_posted_at: new Date().toISOString()
            });
            
            if (result.success) {
                console.log(`✅ Course ${courseId} updated with channel type: ${channelType}`);
            } else {
                console.log(`⚠️ Failed to update course channel info: ${result.error}`);
            }
        } catch (error) {
            console.error('Error updating course channel:', error);
        }
    }

    contactAdmin() {
        // Open Telegram chat with admin for access issues
        window.open('https://t.me/Gestapo32', '_blank');
    }

    setupHashRouting() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleDeepLink();
        });
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            this.showMessage('New passwords do not match', 'error', 'passwordError');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error', 'passwordError');
            return;
        }

        if (!this.api) {
            this.showMessage('System is still loading. Please try again.', 'error', 'passwordError');
            return;
        }

        try {
            this.showMessage('Changing password...', 'info', 'passwordError');
            
            const result = await this.api.changeAdminPassword(currentPassword, newPassword);
            
            if (result.success) {
                this.showMessage('Password changed successfully!', 'success', 'passwordSuccess');
                
                // Clear form
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                this.showMessage(result.error || 'Failed to change password', 'error', 'passwordError');
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showMessage('Failed to change password. Please try again.', 'error', 'passwordError');
        }
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


    updateCourseSubjectDropdown() {
        const subjectSelect = document.getElementById('courseSubject');
        if (!subjectSelect) return;
        
        // Clear existing options except the first one
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        // Add all subjects as options
        this.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
    }

    updateChapterDropdown(subjectId) {
        const chapterSelect = document.getElementById('courseChapter');
        chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
        
        console.log('🔄 Updating chapter dropdown for subject:', subjectId);
        
        if (!subjectId) return;
        
        const subject = this.subjects.find(s => s.id === subjectId);
        console.log('📚 Found subject:', subject);
        
        if (subject && subject.chapters) {
            console.log('📚 Subject chapters:', subject.chapters);
            subject.chapters.forEach(chapter => {
                const option = document.createElement('option');
                option.value = chapter.id;
                option.textContent = chapter.name;
                chapterSelect.appendChild(option);
            });
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

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeToggle();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Update toggle state
        const toggle = document.getElementById('themeInput');
        if (toggle) {
            toggle.checked = theme === 'dark';
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Show feedback
        this.showThemeFeedback(newTheme);
    }

    showThemeFeedback(theme) {
        // Create a temporary feedback element
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-primary);
            color: var(--text-white);
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        `;
        feedback.textContent = `Theme changed to ${theme} mode`;
        
        document.body.appendChild(feedback);
        
        // Remove after 2 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }

    setupThemeToggle() {
        const toggle = document.getElementById('themeInput');
        if (toggle) {
            toggle.addEventListener('change', () => {
                this.toggleTheme();
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.courseManager = new CourseManager();
    window.themeManager = new ThemeManager();
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
