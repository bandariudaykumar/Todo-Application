const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbServerWithNodeJs = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
};

initializeDbServerWithNodeJs();

const hasPriorityAndStatusDefined = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityDefined = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusDefined = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let todoData = null;
  let getTodoQuery = "";
  const { square_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusDefined(request.query):
      getTodoQuery`
        SELECT *
        FROM todo
        WHERE 
            todo LIKE '%${square_q}%'
            AND priority = '${priority}'
            AND status = '${status}';`;
      break;
    case hasPriorityDefined(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${square_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusDefined(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${square_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
        SELECT * 
        FROM todo
        WHERE todo LIKE '%${square_q}%';`;
  }
  todoData = await db.all(getTodoQuery);
  response.send(todoData);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const specificTodo = `
    SELECT 
        *
    FROM 
        todo
    WHERE 
        id = ${todoId};`;
  const specificTodoId = await db.get(specificTodo);
  response.send(specificTodoId);
});

//API 3

app.post("/todos/", async (request, response) => {
  const todosData = request.body;
  const { id, todo, priority, status } = todosData;
  const addTodo = `
  INSERT INTO 
    todo (id, todo, priority, status)
  VALUES 
    (${id},
    '${todo}',
    '${priority}',
    '${status}'
    );`;
  await db.run(addTodo);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodo = `
    SELECT 
        *
    FROM todo
    WHERE 
        id = ${todoId};`;
  const getPreviousTodo = await db.get(previousTodo);
  const {
    todo = getPreviousTodo.todo,
    priority = getPreviousTodo.priority,
    status = getPreviousTodo.status,
  } = request.body;
  const updateQuery = `
  UPDATE 
    todo
  SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE 
    id = ${todoId}`;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//API 5

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        todo
    WHERE 
        id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
