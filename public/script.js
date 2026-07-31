const API="http://localhost:5000/tasks";

async function loadTasks(){

const response=await fetch(API);

const tasks=await response.json();

const table=document.getElementById("taskTable");

table.innerHTML="";

tasks.forEach(task=>{

table.innerHTML+=`

<tr>

<td>${task.id}</td>

<td>${task.title}</td>

<td>

<span class="${task.completed?'completed':'pending'}">

${task.completed?'Completed':'Pending'}

</span>

</td>

<td>

<button class="update"

onclick="editTask(${task.id})">

<i class="fa-solid fa-pen"></i>

Update

</button>

<button class="delete"

onclick="deleteTask(${task.id})">

<i class="fa-solid fa-trash"></i>

Delete

</button>

</td>

</tr>

`;

});

}

async function addTask(){

const title=document.getElementById("title").value;

const completed=document.getElementById("completed").checked;

if(title===""){

alert("Enter Task Title");

return;

}

await fetch(API,{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

title,

completed

})

});

document.getElementById("title").value="";

document.getElementById("completed").checked=false;

loadTasks();

}

async function editTask(id){

const title=prompt("Enter Updated Title");

if(title==null)return;

const completed=confirm("Mark Completed?");

await fetch(API+"/"+id,{

method:"PUT",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

title,

completed

})

});

loadTasks();

}

async function deleteTask(id){

if(!confirm("Delete Task?")) return;

await fetch(API+"/"+id,{

method:"DELETE"

});

loadTasks();

}

// Load All Tasks
async function loadTasks() {

    try {

        const response = await fetch(API);

        const tasks = await response.json();

        const table = document.getElementById("taskTable");

        table.innerHTML = "";

        if (tasks.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">No Tasks Available</td>
                </tr>
            `;

            return;
        }

        tasks.forEach(task => {

            table.innerHTML += `

            <tr>

                <td>${task.id}</td>

                <td>${task.title}</td>

                <td>

                    <span class="${task.completed ? 'completed' : 'pending'}">

                        ${task.completed ? 'Completed' : 'Pending'}

                    </span>

                </td>

                <td>

                    <button class="update-btn"
                        onclick="editTask(${task.id})">

                        <i class="fa-solid fa-pen"></i>

                        Update

                    </button>

                    <button class="delete-btn"
                        onclick="deleteTask(${task.id})">

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>

                </td>

            </tr>

            `;

        });

    }

    catch (error) {

        console.error(error);

        alert("Unable to load tasks.");

    }

}

// Add Task
async function addTask() {

    const title = document.getElementById("title").value.trim();

    const completed = document.getElementById("completed").checked;

    if (title === "") {

        alert("Please enter a task title.");

        return;

    }

    try {

        const response = await fetch(API, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                title,

                completed

            })

        });

        const data = await response.json();

        alert(data.message);

        document.getElementById("title").value = "";

        document.getElementById("completed").checked = false;

        loadTasks();

    }

    catch (error) {

        console.error(error);

        alert("Failed to add task.");

    }

}

// Update Task
async function editTask(id) {

    const title = prompt("Enter Updated Task Title");

    if (title === null || title.trim() === "") return;

    const completed = confirm("Mark this task as Completed?");

    try {

        const response = await fetch(`${API}/${id}`, {

            method: "PUT",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                title,

                completed

            })

        });

        const data = await response.json();

        alert(data.message);

        loadTasks();

    }

    catch (error) {

        console.error(error);

        alert("Failed to update task.");

    }

}

// Delete Task
async function deleteTask(id) {

    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    try {

        const response = await fetch(`${API}/${id}`, {

            method: "DELETE"

        });

        const data = await response.json();

        alert(data.message);

        loadTasks();

    }

    catch (error) {

        console.error(error);

        alert("Failed to delete task.");

    }

}

// Load Tasks When Page Opens
window.onload = loadTasks;