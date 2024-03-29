/* 
Author: Mischa Barmettler
Date: 23.02.2024
Version: 1.0
Description: Kanban-Board
*/


const todoForms = document.querySelectorAll('.todo-form');

function handleFormSubmit(event) {
    event.preventDefault();
    const inputValue = event.target.querySelector('input').value;
    if (!inputValue) return;
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2,   9);
    const taskData = {
        id: taskId,
        content: inputValue,
        columnNumber: this.id
    };
    saveTaskToDatabase(taskData);
    const listItem = document.createElement('p');
    listItem.classList.add('task-item');
    listItem.setAttribute('draggable', 'true');
    listItem.textContent = inputValue;
    listItem.id = taskId;
    const column = event.target.closest('.board-column > div');
    column.appendChild(listItem);
    event.target.reset();
    listItem.addEventListener('dragstart', handleDragStart);
    listItem.addEventListener('dblclick', function () {
        toggleEditMode(listItem);
    });
}

function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDropWithinColumn(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    let index = Array.from(taskElement.parentNode.children).indexOf(event.target);
    if (index === -1 || !event.target.classList.contains('task-item')) {
        index = taskElement.parentNode.children.length;
    }
    taskElement.parentNode.insertBefore(taskElement, taskElement.parentNode.children[index]);

    // Update the column_number in the database
    const newColumnNumber = taskElement.parentNode.closest('.board-column > div').id;
    updateTaskColumnNumber(taskId, newColumnNumber);
}

function handleDropBetweenColumns(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    const targetColumn = event.target.closest('.board-column > div');
    if (!targetColumn) return;
    const originalColumn = taskElement.parentElement;
    originalColumn.removeChild(taskElement);
    targetColumn.appendChild(taskElement);

    // Update the column_number in the database
    const newColumnNumber = targetColumn.id;
    updateTaskColumnNumber(taskId, newColumnNumber);
}

function handleDropOnTrashCan(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    const originalColumn = taskElement.parentElement;
    originalColumn.removeChild(taskElement);

    // Send a request to the server to delete the task
    fetch(`/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            console.log(`Task ${taskId} deleted successfully`);
        } else {
            console.error(`Failed to delete task ${taskId}`);
        }
    })
    .catch(error => {
        console.error(`Error deleting task ${taskId}:`, error);
    });
}

async function updateTaskColumnNumber(taskId, newColumnNumber) {
    try {
        const response = await fetch(`/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ column_number: newColumnNumber })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Task column number updated successfully');
    } catch (error) {
        console.error('Error updating task column number:', error);
    }
}

function toggleEditMode(taskItem) {
    const currentText = taskItem.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    taskItem.textContent = '';
    taskItem.appendChild(input);
    input.focus();
    input.select();
    input.addEventListener('blur', function () {
        taskItem.textContent = input.value;
        input.remove();
    });
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            taskItem.textContent = input.value;
            input.remove();
        }
    });
}

todoForms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
});

const columns = document.querySelectorAll('.board-column > div');
columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDropWithinColumn);
});

const columnContainers = document.querySelectorAll('.board-column');
columnContainers.forEach(container => {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDropBetweenColumns);
});

document.querySelectorAll('.task-item').forEach(function (taskItem) {
    taskItem.addEventListener('dblclick', function () {
        toggleEditMode(taskItem);
    });
});

const trashCan = document.getElementById('trashCan');
trashCan.addEventListener('dragover', handleDragOver);
trashCan.addEventListener('drop', handleDropOnTrashCan);

function handleTrashClick() {
    const confirmDelete = window.confirm("Do you really want to delete all tasks?");
    if (confirmDelete) {
        // Send a request to the server to delete all tasks
        fetch('/tasks/delete-all', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // If the server responds with success, remove all task items from the UI
                const taskItems = document.querySelectorAll('.task-item');
                taskItems.forEach(taskItem => {
                    const originalColumn = taskItem.parentElement;
                    originalColumn.removeChild(taskItem);
                });
                console.log('All tasks deleted successfully');
            } else {
                console.error('Failed to delete all tasks');
            }
        })
        .catch(error => {
            console.error('Error deleting all tasks:', error);
        });
    }
}

trashCan.addEventListener('click', handleTrashClick);

async function saveTaskToDatabase(taskData) {
    try {
        const response = await fetch('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        if (response.ok) {
            console.log('Task saved successfully');
        } else {
            console.error('Failed to save task');
        }
    } catch (error) {
        console.error('Error saving task:', error);
    }
}

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tasks = await response.json();
        tasks.forEach(task => {
            const listItem = document.createElement('p');
            listItem.classList.add('task-item');
            listItem.setAttribute('draggable', 'true');
            listItem.textContent = task.content;
            listItem.id = task.id;
            const column = document.querySelector(`.column${task.column_number}`);
            column.appendChild(listItem);
            listItem.addEventListener('dragstart', handleDragStart);
            listItem.addEventListener('dblclick', function () {
                toggleEditMode(listItem);
            });
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

window.onload = loadTasks;
