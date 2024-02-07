const todoForms = document.querySelectorAll('.todo-form');

function handleFormSubmit(event) {
    event.preventDefault();
    const inputValue = event.target.querySelector('input').value;
    if (!inputValue) return;
    const listItem = document.createElement('p');
    listItem.classList.add('task-item');
    listItem.setAttribute('draggable', 'true');
    listItem.textContent = inputValue;
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2,   9);
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
trashCan.addEventListener('drop', function(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    const originalColumn = taskElement.parentElement;
    originalColumn.removeChild(taskElement);
});

function handleTrashClick() {
    const confirmDelete = window.confirm("Do you really want to delete all tasks?");
    if (confirmDelete) {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(taskItem => {
            const originalColumn = taskItem.parentElement;
            originalColumn.removeChild(taskItem);
        });
    }
}

trashCan.addEventListener('click', handleTrashClick);
