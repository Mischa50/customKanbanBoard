// Select all forms
const todoForms = document.querySelectorAll('.todo-form');

// Function to handle form submission
function handleFormSubmit(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get the input value
    const inputValue = event.target.querySelector('input').value;

    // Check if there's any input
    if (!inputValue) return;

    // Create a new list item element
    const listItem = document.createElement('p');
    listItem.classList.add('task-item'); // Add a class for styling
    listItem.setAttribute('draggable', 'true'); // Make the item draggable
    listItem.textContent = inputValue;

    // Generate a unique ID for the task item
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2,   9);
    listItem.id = taskId; // Set the ID for the task item

    // Append the list item to the parent column
    const column = event.target.closest('.board-column > div');
    column.appendChild(listItem);

    // Clear the input field
    event.target.reset();

    // Attach event listener to the newly created task item for dragstart
    listItem.addEventListener('dragstart', handleDragStart);
}

// Function to handle drag start
function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
}

// Function to handle drag over
function handleDragOver(event) {
    event.preventDefault();
}

// Function to handle drop within a single column
function handleDropWithinColumn(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);

    // Calculate the index of the drop target
    let index = Array.from(taskElement.parentNode.children).indexOf(event.target);
    if (index === -1) {
        // Drop target is not a task item, so insert at the end
        index = taskElement.parentNode.children.length;
    } else if (event.target.classList.contains('task-item')) {
        // Drop target is a task item, so insert before it
        index = Array.from(taskElement.parentNode.children).indexOf(event.target);
    }

    // Insert the task at the calculated index
    taskElement.parentNode.insertBefore(taskElement, taskElement.parentNode.children[index]);
}

// Function to handle drop between columns
function handleDropBetweenColumns(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);

    // Check if the drop target is a valid column container
    const targetColumn = event.target.closest('.board-column > div');
    if (!targetColumn) {
        // Not a valid drop target, ignore the drop event
        return;
    }

    // Remove the task from its original column
    const originalColumn = taskElement.parentElement;
    originalColumn.removeChild(taskElement);

    // Append the task to the target column
    targetColumn.appendChild(taskElement);
}

// Attach the event listener to each form
todoForms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
});

// Attach event listeners for drag and drop to columns
const columns = document.querySelectorAll('.board-column > div');
columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDropWithinColumn);
});

// Attach event listeners for drag and drop between columns
const columnContainers = document.querySelectorAll('.board-column');
columnContainers.forEach(container => {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDropBetweenColumns);
});
