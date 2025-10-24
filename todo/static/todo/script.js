document.addEventListener('DOMContentLoaded', () => {
    // API base URL for tasks
    const API_URL = '/api/tasks';

    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const taskTemplate = document.getElementById('task-template');
    const taskCountSpan = document.getElementById('task-count');
    const editModal = document.getElementById('edit-modal');
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editTaskForm = document.getElementById('edit-task-form');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Fetches all tasks from the API and renders them
    const fetchAndRenderTasks = async () => {
        try {
            const response = await fetch(`${API_URL}/`);
            if (!response.ok) throw new Error('Failed to fetch tasks.');
            
            const tasks = await response.json();
            taskList.innerHTML = ''; // Clear the list before rendering
            tasks.forEach(task => renderTask(task));
            updateTaskCount();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Renders a single task item and appends it to the list
    const renderTask = (task) => {
        const templateClone = taskTemplate.content.cloneNode(true);
        const taskItem = templateClone.querySelector('.task-item');

        taskItem.dataset.id = task.id;

        // Populate the template with task data
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

        // Add event listeners for actions
        checkbox.addEventListener('change', () => handleCompleteTask(task.id, checkbox));
        templateClone.querySelector('.btn-delete').addEventListener('click', () => handleDeleteTask(task.id, taskItem));
        templateClone.querySelector('.btn-edit').addEventListener('click', () => handleOpenEditModal(task));

        taskList.appendChild(templateClone);
        
    };

    // Handles the form submission to create a new task
    const handleAddTask = async (event) => {
        event.preventDefault();

        const formData = new FormData(taskForm);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            due_date: formData.get('due_date'),
        };

        try {
            const response = await fetch(`${API_URL}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) throw new Error('Failed to create task.');

            const newTask = await response.json();
            renderTask(newTask); // Render the new task immediately
            updateTaskCount();
            taskForm.reset();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    // Handles toggling the completion status of a task
    const handleCompleteTask = async (taskId, checkbox) => {
        const is_completed = checkbox.checked;

        try {
            const response = await fetch(`${API_URL}/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_completed }), // Send the new status
            });

            if (!response.ok) throw new Error('Failed to update task status.');
        
            // Refetching all tasks ensures the UI is perfectly in sync with the DB
            fetchAndRenderTasks();
        } catch (error) {
            console.error('Error completing task:', error);
            // Revert checkbox on error
            checkbox.checked = !is_completed;
        }
    };

    // Handles deleting a task
    const handleDeleteTask = async (taskId, taskItem) => {
        // Optional: Add a confirmation dialog
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`${API_URL}/${taskId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete task.');

            taskItem.remove(); // Remove the task from the UI
            updateTaskCount();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // Opens the edit modal and populates it with task data
    const handleOpenEditModal = (task) => {
        editTaskForm.querySelector('#edit-task-id').value = task.id;
        editTaskForm.querySelector('#edit-title').value = task.title;
        editTaskForm.querySelector('#edit-description').value = task.description;
        editTaskForm.querySelector('#edit-priority').value = task.priority;
        editTaskForm.querySelector('#edit-due_date').value = task.due_date;
    
        editModal.classList.remove('hidden');
        editModalOverlay.classList.remove('hidden');
    };

    // Closes the edit modal
    const handleCloseEditModal = () => {
        editModal.classList.add('hidden');
        editModalOverlay.classList.add('hidden');
    };

    // Handles the submission of the edit form
    const handleEditTask = async (event) => {
        event.preventDefault();

        const taskId = editTaskForm.querySelector('#edit-task-id').value;
        const formData = new FormData(editTaskForm);

        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            due_date: formData.get('due_date'),
        };
    
        try {
            const response = await fetch(`${API_URL}/${taskId}`, {
                method: 'PUT', // PUT replaces the entire resource
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) throw new Error('Failed to update task.');
        
            handleCloseEditModal();
            fetchAndRenderTasks(); // Refresh the list to show changes
        } catch (error) {
        console.error('Error updating task:', error);
        }
    };
    

    // Updates the count of remaining (incomplete) tasks
    const updateTaskCount = () => {
        const remainingTasks = taskList.querySelectorAll('.task-item:not(.completed)').length;
        taskCountSpan.textContent = remainingTasks;
    };

    // Attach event listener to the form and fetch initial data
    taskForm.addEventListener('submit', handleAddTask);
    fetchAndRenderTasks();

    closeModalBtn.addEventListener('click', handleCloseEditModal);
    editModalOverlay.addEventListener('click', handleCloseEditModal);
    editTaskForm.addEventListener('submit', handleEditTask);
});