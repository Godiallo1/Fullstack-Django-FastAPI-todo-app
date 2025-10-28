document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const API_BASE_URL = '/api';

    // --- DOM Element Selectors ---
    // App Containers
    const appContainer = document.getElementById('app-container');
    const taskList = document.getElementById('task-list');
    const taskCountSpan = document.getElementById('task-count');
    
    // Forms
    const taskForm = document.getElementById('task-form');
    const editTaskForm = document.getElementById('edit-task-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Modals & Overlays
    const editModal = document.getElementById('edit-modal');
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');

    // Buttons & Links
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const closeModalBtns = document.querySelectorAll('#close-login-modal-btn, #close-register-modal-btn, #close-modal-btn');
    const showLoginLink = document.getElementById('show-login-link');
    const showRegisterLink = document.getElementById('show-register-link');

    // Templates
    const taskTemplate = document.getElementById('task-template');

    // Error message divs
    const loginErrorDiv = document.getElementById('login-error');
    const registerErrorDiv = document.getElementById('register-error');

    // --- State Management ---
    let token = localStorage.getItem('accessToken');

    // --- UI Update Functions ---
    const updateUIForAuthState = () => {
        if (token) {
            // Logged In State
            loginBtn.classList.add('hidden');
            signupBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            appContainer.classList.remove('hidden');
            closeAllModals();
            fetchAndRenderTasks();
        } else {
            // Logged Out State
            loginBtn.classList.remove('hidden');
            signupBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            appContainer.classList.add('hidden');
            taskList.innerHTML = ''; // Clear tasks
        }
    };

    const closeAllModals = () => {
        [editModal, editModalOverlay, authModalOverlay, loginModal, registerModal].forEach(el => el.classList.add('hidden'));
    };

    const openModal = (modal) => {
        authModalOverlay.classList.remove('hidden');
        modal.classList.remove('hidden');
    };
    
    // --- API Helper Function ---
    const fetchWithAuth = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) { // Unauthorized
            handleLogout();
            throw new Error('Session expired. Please log in again.');
        }
        return response;
    };

    // --- Authentication Logic ---
    const handleLogin = async (event) => {
        event.preventDefault();
        // NOTE: FastAPI's OAuth2PasswordRequestForm expects form-data, not JSON
        const formData = new FormData(loginForm);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed.');
            }

            const data = await response.json();
            token = data.access;
            localStorage.setItem('accessToken', token);
            updateUIForAuthState();
        } catch (error) {
            loginErrorDiv.textContent = error.message;
            loginErrorDiv.classList.remove('hidden');
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const userData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed.');
            }
            
            // Switch to login modal after successful registration
            closeAllModals();
            openModal(loginModal);
            loginForm.querySelector('#login-username').value = userData.username;

        } catch (error) {
            registerErrorDiv.textContent = error.message;
            registerErrorDiv.classList.remove('hidden');
        }
    };

    const handleLogout = () => {
        token = null;
        localStorage.removeItem('accessToken');
        updateUIForAuthState();
    };

    // --- Task CRUD Logic (Now using fetchWithAuth) ---
    const fetchAndRenderTasks = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`);
            if (!response.ok) throw new Error('Failed to fetch tasks.');
            
            const tasks = await response.json();
            taskList.innerHTML = '';
            tasks.forEach(renderTask);
            updateTaskCount();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const renderTask = (task) => {
        const templateClone = taskTemplate.content.cloneNode(true);
        // ... (The entire content of the renderTask function is the same as before)
        const taskItem = templateClone.querySelector('.task-item');

        taskItem.dataset.id = task.id;

        templateClone.querySelector('.task-title').textContent = task.title;
        templateClone.querySelector('.task-description').textContent = task.description;
        templateClone.querySelector('.task-due-date').textContent = `Due: ${task.due_date}`;
        
        const prioritySpan = templateClone.querySelector('.task-priority');
        prioritySpan.textContent = task.priority;
        prioritySpan.className = `task-priority priority-${task.priority}`;

        const checkbox = templateClone.querySelector('.task-checkbox');
        checkbox.checked = task.is_completed;
        
        const completedDateSpan = templateClone.querySelector('.task-completed-date');

        if (task.is_completed) {
            taskItem.classList.add('completed');
            prioritySpan.textContent = 'Completed';
            if (task.completed_at) {
                completedDateSpan.textContent = `✓ Completed: ${new Date(task.completed_at).toLocaleDateString()}`;
                completedDateSpan.style.display = 'inline';
            }
        }

        checkbox.addEventListener('change', () => handleCompleteTask(task.id, checkbox));
        templateClone.querySelector('.btn-edit').addEventListener('click', () => handleOpenEditModal(task));
        templateClone.querySelector('.btn-delete').addEventListener('click', () => handleDeleteTask(task.id, taskItem));

        taskList.appendChild(templateClone);
    };

    const handleAddTask = async (event) => {
        event.preventDefault();
        // ... Uses fetchWithAuth
        const formData = new FormData(taskForm);
        const taskData = Object.fromEntries(formData.entries());

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`, {
                method: 'POST',
                body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error('Failed to create task.');
            const newTask = await response.json();
            renderTask(newTask);
            updateTaskCount();
            taskForm.reset();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };
    
    const handleCompleteTask = async (taskId, checkbox) => {
        // ... Uses fetchWithAuth
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_completed: checkbox.checked }),
            });
            if (!response.ok) throw new Error('Failed to update task status.');
            fetchAndRenderTasks();
        } catch (error) {
            console.error('Error completing task:', error);
            checkbox.checked = !checkbox.checked;
        }
    };
    
    const handleEditTask = async (event) => {
        event.preventDefault();
        // ... Uses fetchWithAuth
        const taskId = editTaskForm.querySelector('#edit-task-id').value;
        const formData = new FormData(editTaskForm);
        const taskData = Object.fromEntries(formData.entries());

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error('Failed to update task.');
            closeAllModals();
            fetchAndRenderTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (taskId, taskItem) => {
        // ... Uses fetchWithAuth
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete task.');
            taskItem.remove();
            updateTaskCount();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };
    
    const updateTaskCount = () => {
        const remainingTasks = taskList.querySelectorAll('.task-item:not(.completed)').length;
        taskCountSpan.textContent = remainingTasks;
    };
    
    const handleOpenEditModal = (task) => {
        editTaskForm.querySelector('#edit-task-id').value = task.id;
        editTaskForm.querySelector('#edit-title').value = task.title;
        editTaskForm.querySelector('#edit-description').value = task.description;
        editTaskForm.querySelector('#edit-priority').value = task.priority;
        editTaskForm.querySelector('#edit-due_date').value = task.due_date;
        editModalOverlay.classList.remove('hidden');
        editModal.classList.remove('hidden');
    };

    // --- Event Listeners ---
    // Auth
    loginBtn.addEventListener('click', () => openModal(loginModal));
    signupBtn.addEventListener('click', () => openModal(registerModal));
    logoutBtn.addEventListener('click', handleLogout);
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    authModalOverlay.addEventListener('click', closeAllModals);
    editModalOverlay.addEventListener('click', closeAllModals);
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); closeAllModals(); openModal(loginModal); });
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); closeAllModals(); openModal(registerModal); });
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Tasks
    taskForm.addEventListener('submit', handleAddTask);
    editTaskForm.addEventListener('submit', handleEditTask);

    // --- Initial App Load ---
    updateUIForAuthState();
});