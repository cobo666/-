document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = ''; // Assuming backend is served from the same origin
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const resourceList = document.getElementById('resource-list');
    const categoryButtons = document.querySelectorAll('.category-button');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const uploadForm = document.getElementById('upload-form');

    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const uploadLink = document.getElementById('upload-link');
    const logoutButton = document.getElementById('logout-button');
    const userInfoDisplay = document.getElementById('user-info');

    // Update UI based on login state
    function updateAuthUI() {
        const currentToken = localStorage.getItem('token');
        const currentUserInfo = JSON.parse(localStorage.getItem('userInfo'));

        if (currentToken && currentUserInfo) {
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
            logoutButton.style.display = 'inline';
            userInfoDisplay.textContent = \`欢迎, \${currentUserInfo.username} (\${currentUserInfo.role})\`;
            userInfoDisplay.style.display = 'inline';

            if (currentUserInfo.role === 'admin' || currentUserInfo.role === 'uploader') {
                uploadLink.style.display = 'inline';
            } else {
                uploadLink.style.display = 'none';
            }
        } else {
            loginLink.style.display = 'inline';
            registerLink.style.display = 'inline';
            logoutButton.style.display = 'none';
            uploadLink.style.display = 'none';
            userInfoDisplay.style.display = 'none';
            userInfoDisplay.textContent = '';
        }
    }

    // Fetch and display resources
    async function fetchResources(category = 'all') {
        try {
            let url = \`\${API_BASE_URL}/resources\`;
            if (category === 'all') {
                url = \`\${API_BASE_URL}/resources/all\`;
            } else if (category) {
                 url = \`\${API_BASE_URL}/resources?category=\${encodeURIComponent(category)}\`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || \`HTTP error! status: \${response.status}\`);
            }
            const resources = await response.json();
            displayResources(resources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            if (resourceList) resourceList.innerHTML = \`<li><p class="error">加载资源失败: \${error.message}</p></li>\`;
        }
    }

    function displayResources(resources) {
        if (!resourceList) return;
        resourceList.innerHTML = ''; // Clear existing list
        if (resources.length === 0) {
            resourceList.innerHTML = '<li>该分类下暂无资源。</li>';
            return;
        }
        resources.forEach(resource => {
            const listItem = document.createElement('li');
            listItem.innerHTML = \`
                <h3>\${escapeHTML(resource.name)}</h3>
                <p>\${escapeHTML(resource.description || '')}</p>
                <p><small>分类: \${escapeHTML(resource.category)} | 上传时间: \${new Date(resource.upload_timestamp).toLocaleString()}</small></p>
                <a href="\${API_BASE_URL}/resources/download/\${resource.id}" class="download-button" target="_blank">下载</a>
            \`;
            resourceList.appendChild(listItem);
        });
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return str.toString().replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    // Event listeners for category buttons
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                fetchResources(category);
            });
        });
        // Load default category (e.g., 'all' or the first one)
        fetchResources('all');
    }


    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const messageEl = document.getElementById('login-message');
            messageEl.textContent = '';

            try {
                const response = await fetch(\`\${API_BASE_URL}/auth/login\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userInfo', JSON.stringify(data.user));
                    messageEl.textContent = '登录成功! 跳转中...';
                    messageEl.className = 'success';
                    updateAuthUI();
                    window.location.href = 'index.html'; // Redirect to home
                } else {
                    messageEl.textContent = data.message || '登录失败.';
                    messageEl.className = 'error';
                }
            } catch (error) {
                console.error('Login error:', error);
                messageEl.textContent = '登录请求失败，请稍后再试.';
                messageEl.className = 'error';
            }
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const role = registerForm.role.value;
            const messageEl = document.getElementById('register-message');
            messageEl.textContent = '';

            try {
                const response = await fetch(\`\${API_BASE_URL}/auth/register\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, role })
                });
                const data = await response.json();
                if (response.ok) {
                    messageEl.textContent = '注册成功! 请登录.';
                    messageEl.className = 'success';
                    // Optionally redirect to login page after a delay
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                } else {
                    messageEl.textContent = data.message || '注册失败.';
                    messageEl.className = 'error';
                }
            } catch (error) {
                console.error('Registration error:', error);
                messageEl.textContent = '注册请求失败，请稍后再试.';
                messageEl.className = 'error';
            }
        });
    }

    // Handle Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            updateAuthUI();
            if (resourceList) fetchResources('all'); // Refresh resource list (optional)
            // No need to redirect if already on index.html, otherwise:
            // window.location.href = 'index.html';
        });
    }

    // Handle Upload
    if (uploadForm) {
        // Redirect if not logged in with upload privileges
        const currentTokenForUpload = localStorage.getItem('token');
        const currentUserForUpload = JSON.parse(localStorage.getItem('userInfo'));
        if (!currentTokenForUpload || !(currentUserForUpload.role === 'admin' || currentUserForUpload.role === 'uploader')) {
            // window.location.href = 'login.html'; // Or display a message
            // For now, let's assume the link wouldn't be visible due to updateAuthUI.
            // If a user navigates directly, the backend will deny.
            console.warn("User not authorized for upload page, form will likely fail.");
        }


        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('upload-message');
            messageEl.textContent = '';
            const currentToken = localStorage.getItem('token'); // Re-fetch token
            if (!currentToken) {
                messageEl.textContent = '请先登录再上传.';
                messageEl.className = 'error';
                return;
            }

            const formData = new FormData(uploadForm);
            // 'name', 'description', 'category', 'resourceFile' are names from form inputs

            try {
                const response = await fetch(\`\${API_BASE_URL}/resources/upload\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${currentToken}\`
                        // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
                    },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    messageEl.textContent = '文件上传成功!';
                    messageEl.className = 'success';
                    uploadForm.reset(); // Clear the form
                    // Optionally redirect or update resource list
                } else {
                    messageEl.textContent = data.message || '上传失败.';
                    messageEl.className = 'error';
                }
            } catch (error) {
                console.error('Upload error:', error);
                messageEl.textContent = '上传请求失败，请稍后再试.';
                messageEl.className = 'error';
            }
        });
    }

    // Initial UI setup
    updateAuthUI();
    // If on index page, load initial resources (already handled by category button setup)
    // if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    //     fetchResources('all');
    // }
});
