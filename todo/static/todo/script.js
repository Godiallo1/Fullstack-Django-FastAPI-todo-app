document.addEventListener("DOMContentLoaded", () => {
    // --- API Configuration ---
    const API_BASE_URL = "/api";

    // --- State Management ---
    let token = null;
    let currentTab = 'Queue'; 
    let currentPriorityFilter = 'All'; 
    let allTasks = [];

    // --- DOM Elements ---
    const landingPage = document.getElementById("landing-page");
    const appContainer = document.getElementById("app-container");
    const getStartedBtn = document.getElementById("get-started-btn");
    
    // Task Elements
    const taskList = document.getElementById("task-list");
    const taskCountSpan = document.getElementById("task-count");
    const taskForm = document.getElementById("task-form");
    const editTaskForm = document.getElementById("edit-task-form");
    const priorityFilterSelect = document.getElementById("priority-filter"); 
    
    // Auth Elements
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const loginBtn = document.getElementById("login-btn");
    const signupBtn = document.getElementById("signup-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const showLoginLink = document.getElementById("show-login-link");
    const showRegisterLink = document.getElementById("show-register-link");
    const loginErrorDiv = document.getElementById("login-error");
    const registerErrorDiv = document.getElementById("register-error");

    // Modals
    const editModal = document.getElementById("edit-modal");
    const editModalOverlay = document.getElementById("edit-modal-overlay");
    const authModalOverlay = document.getElementById("auth-modal-overlay");
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");
    const closeModalBtns = document.querySelectorAll(
        "#close-login-modal-btn, #close-register-modal-btn, #close-modal-btn, #close-profile-modal-btn"
    );

    // Profile Elements
    const profileLink = document.getElementById("profile-link");
    const profileModal = document.getElementById("profile-modal");
    const closeProfileModalBtn = document.getElementById("close-profile-modal-btn");
    const profileForm = document.getElementById("profile-form");

    // Toast & Tabs
    const toast = document.getElementById('toast');
    const taskTemplate = document.getElementById("task-template");
    const tabButtons = document.querySelectorAll('.tab-btn');

    // --- Initialization ---
    const initializeApp = () => {
        const metaToken = document.querySelector('meta[name="jwt-access-token"]');
        if (metaToken) {
            const tokenContent = metaToken.getAttribute("content");
            if (tokenContent && tokenContent !== "null") {
                localStorage.setItem("accessToken", tokenContent);
            } else if (tokenContent === "null") {
                localStorage.removeItem("accessToken");
            }
        }

        token = localStorage.getItem("accessToken");
        updateUIForAuthState();
        
        // Set current date
        const dateDisplay = document.getElementById('current-date');
        if(dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
        }
    };

    // --- Toast Logic ---
    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    };

    const triggerWelcomeMessage = async () => {
        if (sessionStorage.getItem('welcomeShown')) return;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/profile`);
            if (response.ok) {
                const data = await response.json();
                const displayName = data.full_name || data.username;
                showToast(`Welcome back, ${displayName}!`);
                sessionStorage.setItem('welcomeShown', 'true');
            }
        } catch (error) {
            console.error("Error fetching welcome name:", error);
        }
    };

    const checkDueTasks = (tasks) => {
        const activeTasks = tasks.filter(t => t.status === 'Queue' || t.status === 'In Progress');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingTasks = activeTasks.filter(task => {
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            return diffDays <= 1;
        });

        if (upcomingTasks.length > 0) {
            setTimeout(() => {
                const count = upcomingTasks.length;
                const message = count === 1 ? `Reminder: 1 task due soon!` : `Reminder: ${count} tasks due soon!`;
                showToast(message);
            }, 4000);
        }
    };

    // --- UI Update Functions ---
    const updateUIForAuthState = () => {
        if (token) {
            // LOGGED IN
            if (loginBtn) loginBtn.classList.add("hidden");
            if (signupBtn) signupBtn.classList.add("hidden");
            if (logoutBtn) logoutBtn.classList.remove("hidden");
            
            // Show Dashboard, Hide Landing
            if(landingPage) landingPage.classList.add("hidden");
            if(appContainer) appContainer.classList.remove("hidden");
            if(profileLink) profileLink.classList.remove("hidden");

            closeAllModals();
            fetchTasks();
            triggerWelcomeMessage();
        } else {
            // LOGGED OUT
            if (loginBtn) loginBtn.classList.remove("hidden");
            if (signupBtn) signupBtn.classList.remove("hidden");
            if (logoutBtn) logoutBtn.classList.add("hidden");
            
            // Show Landing, Hide Dashboard
            if(landingPage) landingPage.classList.remove("hidden");
            if(appContainer) appContainer.classList.add("hidden");
            if(profileLink) profileLink.classList.add("hidden");

            if (taskList) taskList.innerHTML = "";
            sessionStorage.removeItem('welcomeShown');
        }
    };

    const closeAllModals = () => {
        [editModal, editModalOverlay, authModalOverlay, loginModal, registerModal, profileModal].forEach((el) => {
            if (el) el.classList.add("hidden");
        });
    };

    const openModal = (modal) => {
        if (authModalOverlay) authModalOverlay.classList.remove("hidden");
        if (modal) modal.classList.remove("hidden");
    };

    const handleTabClick = (event) => {
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#e5e7eb';
            btn.style.color = '#374151';
        });
        
        const clickedBtn = event.target;
        clickedBtn.classList.add('active');
        
        if (clickedBtn.dataset.tab === 'Aborted') {
            clickedBtn.style.background = '#fee2e2';
            clickedBtn.style.color = '#b91c1c';
        } else {
            clickedBtn.style.background = 'var(--primary-color)';
            clickedBtn.style.color = 'white';
        }

        currentTab = clickedBtn.dataset.tab;
        renderTasks();
    };

    // --- API Helper ---
    const fetchWithAuth = async (url, options = {}) => {
        const currentToken = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/json", ...options.headers };
        if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;
        return await fetch(url, { ...options, headers });
    };

    // --- Auth Logic ---
    const handleLogin = async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, { method: "POST", body: formData });
            if (!response.ok) throw new Error((await response.json()).detail || "Login failed.");
            const data = await response.json();
            
            localStorage.setItem("accessToken", data.access);
            token = data.access;
            updateUIForAuthState();
        } catch (error) {
            loginErrorDiv.textContent = error.message;
            loginErrorDiv.classList.remove("hidden");
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(formData.entries())),
            });
            if (!response.ok) throw new Error((await response.json()).detail || "Registration failed.");
            
            // SUCCESS - Don't auto-login. Show message for Email Verification.
            closeAllModals();
            alert("Registration successful! Please check your terminal console (or email) for the verification link before logging in.");
            
            // Optionally open login modal
            openModal(loginModal);
            loginForm.querySelector("#login-username").value = formData.get('username');
            
        } catch (error) {
            registerErrorDiv.textContent = error.message;
            registerErrorDiv.classList.remove("hidden");
        }
    };

    // --- Task Logic ---
    const fetchTasks = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`);
            if (response.status === 401) return;
            if (!response.ok) throw new Error("Failed to fetch tasks.");
            allTasks = await response.json();
            // Sort by order field
            allTasks.sort((a, b) => a.order - b.order); 
            renderTasks();
            checkDueTasks(allTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const renderTasks = () => {
        if (!taskList) return;
        taskList.innerHTML = "";
        
        // Filter tasks based on current active tab AND priority filter
        const filteredTasks = allTasks.filter(task => {
            const statusMatch = task.status === currentTab;
            const priorityMatch = currentPriorityFilter === 'All' || task.priority === currentPriorityFilter;
            return statusMatch && priorityMatch;
        });
        
        filteredTasks.forEach(renderSingleTask);
        updateTaskCount(filteredTasks.length);
    };

    const renderSingleTask = (task) => {
        const templateClone = taskTemplate.content.cloneNode(true);
        const taskItem = templateClone.querySelector(".task-item");
        taskItem.dataset.id = task.id;
        
        // --- DRAG AND DROP ATTRIBUTES ---
        taskItem.setAttribute('draggable', true);
        taskItem.addEventListener('dragstart', handleDragStart);
        taskItem.addEventListener('dragover', handleDragOver);
        taskItem.addEventListener('drop', handleDrop);
        taskItem.addEventListener('dragenter', handleDragEnter);
        taskItem.addEventListener('dragleave', handleDragLeave);
        // -------------------------------
        
        templateClone.querySelector(".task-title").textContent = task.title;
        templateClone.querySelector(".task-description").textContent = task.description || "No description";
        templateClone.querySelector(".task-due-date").textContent = `Due: ${task.due_date}`;
        
        const prioritySpan = templateClone.querySelector(".task-priority");
        prioritySpan.textContent = task.priority;
        prioritySpan.className = `task-priority priority-${task.priority}`;
        
        const statusSpan = templateClone.querySelector(".task-status-badge");
        statusSpan.textContent = task.status;
        if (task.status === 'Completed') statusSpan.style.color = 'green';
        else if (task.status === 'Aborted') statusSpan.style.color = 'red';
        else if (task.status === 'In Progress') statusSpan.style.color = 'orange';
        else statusSpan.style.color = 'gray';

        const actionsContainer = templateClone.querySelector(".task-actions");
        actionsContainer.innerHTML = ''; 

        if (task.status === 'Queue') {
            actionsContainer.appendChild(createActionButton('Start', 'btn-primary', () => updateTaskStatus(task.id, 'In Progress')));
            actionsContainer.appendChild(createActionButton('Abort', 'btn-secondary', () => updateTaskStatus(task.id, 'Aborted')));
            actionsContainer.appendChild(createActionButton('Edit', 'btn-icon', () => handleOpenEditModal(task), true));
        } else if (task.status === 'In Progress') {
            actionsContainer.appendChild(createActionButton('Complete', 'btn-primary', () => updateTaskStatus(task.id, 'Completed')));
            actionsContainer.appendChild(createActionButton('Abort', 'btn-secondary', () => updateTaskStatus(task.id, 'Aborted')));
        } else if (task.status === 'Aborted') {
            actionsContainer.appendChild(createActionButton('Restore', 'btn-primary', () => updateTaskStatus(task.id, 'Queue')));
            actionsContainer.appendChild(createActionButton('Delete Forever', 'btn-delete', () => handleDeleteTask(task.id, taskItem), true));
        } else if (task.status === 'Completed') {
             actionsContainer.appendChild(createActionButton('Delete', 'btn-icon', () => updateTaskStatus(task.id, 'Aborted'), true));
        }

        taskList.appendChild(templateClone);
    };

    // --- Drag and Drop Logic ---
    let dragSrcEl = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.outerHTML);
        this.classList.add('dragging');
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); 
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    async function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); 
        }

        if (dragSrcEl !== this) {
            const list = this.parentNode;
            const allItems = Array.from(list.children);
            const draggedIndex = allItems.indexOf(dragSrcEl);
            const droppedIndex = allItems.indexOf(this);

            if (draggedIndex < droppedIndex) {
                list.insertBefore(dragSrcEl, this.nextSibling);
            } else {
                list.insertBefore(dragSrcEl, this);
            }
            
            await updateTaskOrder(dragSrcEl.dataset.id, droppedIndex, allItems);
        }
        this.classList.remove('over');
        dragSrcEl.classList.remove('dragging');
        return false;
    }

    const updateTaskOrder = async (draggedId, newIndex, allItems) => {
        // Calculate new order value to fit between neighbors
        const currentItems = Array.from(document.querySelectorAll('.task-item'));
        const draggedItem = currentItems.find(item => item.dataset.id === draggedId);
        
        if (!draggedItem) return;

        const index = currentItems.indexOf(draggedItem);
        let newOrder = 0;
        
        const getOrder = (id) => {
            const t = allTasks.find(x => x.id == id);
            return t ? t.order : 0;
        };

        const prevItem = currentItems[index - 1];
        const nextItem = currentItems[index + 1];

        if (!prevItem && nextItem) {
            newOrder = getOrder(nextItem.dataset.id) - 1.0;
        } else if (prevItem && !nextItem) {
            newOrder = getOrder(prevItem.dataset.id) + 1.0;
        } else if (prevItem && nextItem) {
            newOrder = (getOrder(prevItem.dataset.id) + getOrder(nextItem.dataset.id)) / 2.0;
        } else {
            newOrder = new Date().getTime();
        }

        try {
            const task = allTasks.find(t => t.id == draggedId);
            if(task) task.order = newOrder;
            
            await fetchWithAuth(`${API_BASE_URL}/tasks/${draggedId}`, {
                method: 'PATCH',
                body: JSON.stringify({ order: newOrder })
            });
            fetchTasks(); 
        } catch (error) {
            console.error("Failed to reorder", error);
        }
    };

    const createActionButton = (text, className, onClick, isIcon = false) => {
        const btn = document.createElement('button');
        if (isIcon) {
            if (text === 'Edit') btn.textContent = '✏️';
            if (text === 'Delete' || text === 'Delete Forever') btn.textContent = '🗑️';
            btn.className = 'btn-icon';
            btn.title = text;
        } else {
            btn.textContent = text;
            btn.className = `btn btn-sm ${className}`;
            btn.style.padding = "5px 10px";
            btn.style.fontSize = "0.8rem";
        }
        btn.addEventListener('click', onClick);
        return btn;
    };

    const handleAddTask = async (event) => {
        event.preventDefault();
        const formData = new FormData(taskForm);
        const taskData = Object.fromEntries(formData.entries());
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`, {
                method: "POST",
                body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error("Failed to create task.");
            await fetchTasks();
            taskForm.reset();
            const queueTab = document.querySelector('[data-tab="Queue"]');
            if (queueTab) queueTab.click();
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error(`Failed to update status to ${newStatus}`);
            
            let msg = `Task moved to ${newStatus}`;
            if (newStatus === 'Aborted') msg = "Task moved to Recycle Bin";
            showToast(msg);
            
            await fetchTasks();
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update task status.");
        }
    };

    const handleEditTask = async (event) => {
        event.preventDefault();
        const taskId = editTaskForm.querySelector("#edit-task-id").value;
        const formData = new FormData(editTaskForm);
        const taskData = Object.fromEntries(formData.entries());
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}`, {
                method: "PUT",
                body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error("Failed to update task.");
            closeAllModals();
            fetchTasks();
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const handleDeleteTask = async (taskId, taskItem) => {
        if (!confirm("Are you sure you want to permanently delete this task?")) return;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${taskId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete task.");
            taskItem.remove();
            allTasks = allTasks.filter(t => t.id !== taskId);
            updateTaskCount(allTasks.filter(t => t.status === currentTab).length);
            showToast("Task deleted permanently.");
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const updateTaskCount = (count) => {
        if (taskCountSpan) taskCountSpan.textContent = `${count} ${currentTab}`;
    };

    const handleOpenEditModal = (task) => {
        editTaskForm.querySelector("#edit-task-id").value = task.id;
        editTaskForm.querySelector("#edit-title").value = task.title;
        editTaskForm.querySelector("#edit-description").value = task.description;
        editTaskForm.querySelector("#edit-priority").value = task.priority;
        editTaskForm.querySelector("#edit-due_date").value = task.due_date;
        editModalOverlay.classList.remove("hidden");
        editModal.classList.remove("hidden");
    };

    // --- Profile Logic ---
    const fetchAndRenderProfile = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/profile`);
            if (!response.ok) throw new Error("Failed to fetch profile");
            const data = await response.json();

            document.getElementById("profile-username-display").textContent = data.username;
            document.getElementById("profile-email-display").textContent = data.email;
            
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=random&color=fff`;
            document.getElementById("profile-avatar-display").src = data.avatar_url || defaultAvatar;

            profileForm.querySelector("#profile-fullname").value = data.full_name || "";
            profileForm.querySelector("#profile-bio").value = data.bio || "";
            profileForm.querySelector("#profile-location").value = data.location || "";
            profileForm.querySelector("#profile-avatar").value = data.avatar_url || "";

            authModalOverlay.classList.remove("hidden");
            profileModal.classList.remove("hidden");
        } catch (error) {
            console.error(error);
            alert("Could not load profile data.");
        }
    };

    const handleUpdateProfile = async (event) => {
        event.preventDefault();
        const formData = new FormData(profileForm);
        const profileData = Object.fromEntries(formData.entries());
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/profile`, {
                method: "PUT",
                body: JSON.stringify(profileData),
            });
            if (!response.ok) throw new Error("Failed to update profile");
            const data = await response.json();
            
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=random&color=fff`;
            document.getElementById("profile-avatar-display").src = data.avatar_url || defaultAvatar;

            showToast("Profile updated successfully!");
            closeAllModals();
        } catch (error) {
            console.error(error);
            alert("Failed to save profile.");
        }
    };

    // --- Event Listeners ---
    if (loginBtn) loginBtn.addEventListener("click", () => openModal(loginModal));
    if (signupBtn) signupBtn.addEventListener("click", () => openModal(registerModal));
    
    closeModalBtns.forEach((btn) => btn.addEventListener("click", closeAllModals));
    
    if (authModalOverlay) authModalOverlay.addEventListener("click", closeAllModals);
    if (editModalOverlay) editModalOverlay.addEventListener("click", closeAllModals);
    
    if (showLoginLink) showLoginLink.addEventListener("click", (e) => { e.preventDefault(); closeAllModals(); openModal(loginModal); });
    if (showRegisterLink) showRegisterLink.addEventListener("click", (e) => { e.preventDefault(); closeAllModals(); openModal(registerModal); });

    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (registerForm) registerForm.addEventListener("submit", handleRegister);
    
    if (taskForm) taskForm.addEventListener("submit", handleAddTask);
    if (editTaskForm) editTaskForm.addEventListener("submit", handleEditTask);
    
    if (profileLink) profileLink.addEventListener("click", (e) => { e.preventDefault(); fetchAndRenderProfile(); });
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", closeAllModals);
    if (profileForm) profileForm.addEventListener("submit", handleUpdateProfile);

    if (getStartedBtn) getStartedBtn.addEventListener('click', () => openModal(registerModal));

    tabButtons.forEach(btn => btn.addEventListener('click', handleTabClick));

    if (priorityFilterSelect) {
        priorityFilterSelect.addEventListener('change', (e) => {
            currentPriorityFilter = e.target.value;
            renderTasks();
        });
    }

    // --- Initial App Load ---
    initializeApp();
});