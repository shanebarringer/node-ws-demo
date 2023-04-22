const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const kvjs = require("@heyputer/kv.js");

const server = new WebSocket.Server({ port: 8081 });
const webSockets = [];
const intialTasks = [
  {
    uuid: "1",
    name: "Task 1!!!",
    completed: false,
    due: new Date(),
  },
  {
    uuid: "2",
    name: "Task 2",
    completed: true,
    due: new Date(),
  },
  {
    uuid: "3",
    name: "Task 3",
    completed: false,
    due: new Date(),
  },
];

const tasks = new kvjs();
tasks.set("tasks", intialTasks);
console.log(tasks.get("tasks"));

server.on("connection", (socket) => {
  console.log("WebSocket connected");
  webSockets.push(socket);
  const todos = tasks.get("tasks");

  socket.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Message received: ", data);
    switch (data.action) {
      case "FETCH_TASKS":
        socket.send(JSON.stringify({ type: "tasks", data: todos }));
        break;
      case "ADD_TASK":
        console.log("ADDING: ", data);
        const newTodo = {
          uuid: uuidv4(),
          name: data.task.name,
          completed: false,
          due: new Date(),
        };
        tasks.set("tasks", [...todos, newTodo]);
        console.log("NEW TASKS: ", tasks.get("tasks"));
        webSockets.forEach((client) =>
          client.send(JSON.stringify({ type: "ADD_TASK", data: newTodo }))
        );
        break;
      case "UPDATE_TASK":
        const tasksArr = tasks.get("tasks");

        // Find the index of the task to update
        const updatedTaskIndex = tasksArr.findIndex(
          (todo) => todo.uuid === data.task.uuid
        );
        
        console.log({ updatedTodoIndex, data});
      // Update the task
      if (updatedTaskIndex !== -1) {
        tasksArr[updatedTaskIndex].completed = !updatedTaskIndex.completed;
      }

      // Store the updated tasks array
      tasks.set("tasks", tasksArr);
        const updatedTodoIndex = tasks.findIndex(
          (todo) => todo.uuid === data.task.uuid
        );

        if (updatedTodoIndex !== -1) {
        
          webSockets.forEach((client) =>
            client.send(
              JSON.stringify({
                type: "UPDATE_TASK",
                data
              })
            )
          );
        }
        break;
    }
  });

  socket.on("close", () => {
    const index = webSockets.indexOf(socket);
    webSockets.splice(index, 1);
    console.log("WebSocket closed");
  });
});

console.log("WebSocket server listening on port 8081");
