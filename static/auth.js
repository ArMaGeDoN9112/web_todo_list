document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth.js: DOM Content Loaded');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-button');
    const passwordToggle = document.querySelector('.password-toggle');
    const passwordInput = document.getElementById('password');

    // Password visibility toggle
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            passwordToggle.querySelector('i').classList.toggle('fa-eye');
            passwordToggle.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    console.log('Auth.js: Form elements found:', {
        registerForm: !!registerForm,
        loginForm: !!loginForm,
        errorMessage: !!errorMessage
    });

    function showError(message) {
        console.log('Auth.js: Showing error:', message);
        if (!errorMessage) {
            console.error('Error message element not found');
            return;
        }
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function setLoading(isLoading) {
        if (loginButton) {
            const spinner = loginButton.querySelector('.spinner');
            const buttonText = loginButton.querySelector('span');
            const buttonIcon = loginButton.querySelector('i');
            
            if (isLoading) {
                spinner.classList.remove('hidden');
                buttonText.classList.add('hidden');
                buttonIcon.classList.add('hidden');
                loginButton.disabled = true;
            } else {
                spinner.classList.add('hidden');
                buttonText.classList.remove('hidden');
                buttonIcon.classList.remove('hidden');
                loginButton.disabled = false;
            }
        }
    }

    function handleAuthResponse(response) {
        console.log('Auth.js: Response status:', response.status);
        console.log('Auth.js: Response headers:', Object.fromEntries([...response.headers]));
        
        return response.json().then(data => {
            console.log('Auth.js: Response data:', data);
            
            if (!response.ok) {
                console.error('Auth.js: Response not OK:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                throw new Error(data.error || 'Authentication failed');
            }

            // Check for token in response body
            if (data.token) {
                console.log('Auth.js: Token found in response body');
                localStorage.setItem('token', data.token);
            } else {
                console.log('Auth.js: No token in response body, checking cookies');
                // Check if token was set as cookie
                const cookies = document.cookie.split(';');
                console.log('Auth.js: All cookies:', cookies);
                const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
                if (tokenCookie) {
                    const token = tokenCookie.split('=')[1];
                    console.log('Auth.js: Token found in cookies');
                    localStorage.setItem('token', token);
                } else {
                    console.error('Auth.js: No token found in cookies or response body');
                    throw new Error('No authentication token received');
                }
            }

            return data;
        }).catch(error => {
            console.error('Auth.js: Error parsing response:', error);
            throw error;
        });
    }

    if (registerForm) {
        console.log('Auth.js: Register form found');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Auth.js: Register form submitted');
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            console.log('Auth.js: Registration attempt:', { username, email });

            if (password !== confirmPassword) {
                showError(i18n.t("auth.passwordMismatch"));
                return;
            }

            try {
                console.log('Auth.js: Sending registration request');
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include' // Include cookies in the request
                });

                console.log('Auth.js: Registration response received');
                await handleAuthResponse(response);
                console.log('Auth.js: Registration successful, redirecting');
                window.location.href = '/login';
            } catch (error) {
                console.error('Auth.js: Registration error:', error);
                showError(i18n.t("auth.registerError"));
            }
        });
    } else {
        console.log('Auth.js: Register form not found');
    }

    if (loginForm) {
        console.log('Auth.js: Login form found');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Auth.js: Login form submitted');
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Validate username
            if (username.length < 3) {
                showError(i18n.t("auth.usernameTooShort"));
                return;
            }

            // Validate password length
            if (password.length < 6) {
                showError(i18n.t("auth.passwordTooShort"));
                return;
            }

            console.log('Auth.js: Login attempt:', { username });

            try {
                console.log('Auth.js: Sending login request');
                
                // Add CSRF token if available
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
                const headers = {
                    'Content-Type': 'application/json',
                };
                if (csrfToken) {
                    headers['X-CSRF-Token'] = csrfToken;
                }

                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ 
                        username, 
                        password
                    }),
                    credentials: 'include' // Include cookies in the request
                });

                console.log('Auth.js: Login response received');
                await handleAuthResponse(response);
                console.log('Auth.js: Login successful, redirecting');
                window.location.href = '/todos';
            } catch (error) {
                console.error('Auth.js: Login error:', error);
                if (error.message === 'Failed to fetch') {
                    showError(i18n.t("auth.networkError"));
                } else {
                    showError(i18n.t("auth.loginError"));
                }
            }
        });
    } else {
        console.log('Auth.js: Login form not found');
    }
}); 