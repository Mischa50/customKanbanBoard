function addTask(event) {
    event.preventDefault(); // Verhindert das Standardverhalten des Formulars (Seitenneuladen)
    
    var taskInput = document.getElementById("taskInput");
    var taskList = document.getElementById("taskList");
    var taskText = taskInput.value;

    if (taskText.trim() !== "") {
        var newTask = document.createElement("p");
        newTask.textContent = taskText;
        taskList.appendChild(newTask);
        taskInput.value = ""; // Leert das Texteingabefeld nach dem Hinzufügen einer Aufgabe
    }
}
