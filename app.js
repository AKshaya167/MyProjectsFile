var format = require('date-fns/format')
var isMatch = require('date-fns/isMatch')
const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

let db = null
const dbPath = (__dirname, 'todoApplication.db')

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(e)
  }
}
initialize()

const hasPriorityAndStatus = reqQuery => {
  return reqQuery.priority !== undefined && reqQuery.status !== undefined
}
const hasSerch_q = reqQuery => {
  return reqQuery.search_q !== undefined
}
const hasCategoryAndStatus = reqQuery => {
  return reqQuery.category !== undefined && reqQuery.status !== undefined
}
const hasCategoryAndPriority = reqQuery => {
  return reqQuery.category !== undefined && reqQuery.priority !== undefined
}
const hasStatus = reqQuery => {
  return reqQuery.status !== undefined
}
const hasPriortiy = reqQuery => {
  return reqQuery.priority !== undefined
}
const hasCategory = reqQuery => {
  return reqQuery.category !== undefined
}

const outputRes = dbObj => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    category: dbObj.category,
    status: dbObj.status,
    dueDate: dbObj.due_date,
  }
}

app.get('/todos/', async (req, res) => {
  const {search_q = '', priority, status, category} = req.query
  let getTodoQuery = ''
  let data = ''
  switch (true) {
    case hasStatus(req.query):
      if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
        getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE status = '${status}';`
        data = await db.all(getTodoQuery)
        res.send(data)
      } else {
        res.status(400).send('Invalid Todo Status')
      }
      break

    case hasPriortiy(req.query):
      if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE priority = '${priority}';`
        data = await db.all(getTodoQuery)
        res.send(data)
      } else {
        res.status(400).send('Invalid Todo Priority')
      }
      break

    case hasPriorityAndStatus(req.query):
      if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
          getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE status = '${status}' AND priority = '${priority}';`
          data = await db.all(getTodoQuery)
          res.send(data)
        } else {
          res.status(400).send('Invalid Todo Status')
        }
      } else {
        res.status(400).send('Invalid Todo Priority')
      }
      break

    case hasSerch_q(req.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getTodoQuery)
      res.send(data)
      break

    case hasCategoryAndStatus(req.query):
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
          getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE category = '${category}' AND status = '${status}';`
          data = await db.all(getTodoQuery)
          res.send(data)
        } else {
          res.status(400).send('Invalid Todo Status')
        }
      } else {
        res.status(400).send('Invalid Todo Category')
      }
      break

    case hasCategory(req.query):
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE category = '${category}';`
        data = await db.all(getTodoQuery)
        res.send(data)
      } else {
        res.status(400).send('Invalid Todo Category')
      }
      break

    case hasCategoryAndPriority(req.query):
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
          getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
      From todo WHERE category = '${category}' AND priority = '${priority}';`
          data = await db.all(getTodoQuery)
          res.send(data)
        } else {
          res.status(400).send('Invalid Todo Priority')
        }
      } else {
        res.status(400).send('Invalid Todo Category')
      }
      break
    default:
      getTodoQuery = `SELECT * FROM todo;`
      data = await db.all(getTodoQuery)
      res.send(data)
  }
})

app.get('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const getSpecificQuery = `SELECT id,todo,priority,status,category,due_date as dueDate 
  From todo WHERE id = ${todoId};`
  const todo = await db.get(getSpecificQuery)
  res.send(todo)
})

app.get('/agenda/', async (req, res) => {
  const {date} = req.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    var dateFormat = format(new Date(date), 'yyyy-MM-dd')
    const getDateQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE due_date = '${dateFormat}';`
    const todos = await db.all(getDateQuery)
    res.send(todos)
  } else {
    res.status(400).send('Invalid Due Date')
  }
})

app.post('/todos/', async (req, res) => {
  const {id, todo, priority, status, category, dueDate} = req.body
  if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const addTodoQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
        VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
          await db.run(addTodoQuery)
          res.send('Todo Successfully Added')
        } else {
          res.status(400).send('Invalid Due Date')
        }
      } else {
        res.status(400).send('Invalid Todo Category')
      }
    } else {
      res.status(400).send('Invalid Todo Status')
    }
  } else {
    res.status(400).send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (req, res) => {
  const reqBody = req.body
  const {todoId} = req.params
  let colName = ''
  let getTodoQuery = ''
  switch (true) {
    case reqBody.status !== undefined:
      if (['TO DO', 'IN PROGRESS', 'DONE'].includes(reqBody.status)) {
        colName = 'Status'
        getTodoQuery = `UPDATE todo SET status = '${reqBody.status}' WHERE id = ${todoId};`
        await db.run(getTodoQuery)
        res.send('Status Updated')
      } else {
        res.status(400).send('Invalid Todo Status')
      }
      break
    case reqBody.priority !== undefined:
      if (['HIGH', 'MEDIUM', 'LOW'].includes(reqBody.priority)) {
        colName = 'Priority'
        getTodoQuery = `UPDATE todo SET priority = '${reqBody.priority}' WHERE id = ${todoId};`
        await db.run(getTodoQuery)
        res.send('Priority Updated')
      } else {
        res.status(400).send('Invalid Todo Priority')
      }
      break
    case reqBody.todo !== undefined:
      colName = 'Todo'
      getTodoQuery = `UPDATE todo SET todo = '${reqBody.todo}' WHERE id = ${todoId};`
      await db.run(getTodoQuery)
      res.send('Todo Updated')
      break
    case reqBody.category !== undefined:
      if (['WORK', 'HOME', 'LEARNING'].includes(reqBody.category)) {
        colName = 'Category'
        getTodoQuery = `UPDATE todo SET category = '${reqBody.category}' WHERE id = ${todoId};`
        await db.run(getTodoQuery)
        res.send('Category Updated')
      } else {
        res.status(400).send('Invalid Todo Category')
      }
      break
    case reqBody.dueDate !== undefined:
      if (isMatch(reqBody.dueDate, 'yyyy-MM-dd')) {
        colName = 'Due Date'
        var dateFormat = format(new Date(reqBody.dueDate), 'yyyy-MM-dd')
        getTodoQuery = `UPDATE todo SET due_date = '${dateFormat}' WHERE id = ${todoId};`
        await db.run(getTodoQuery)
        res.send('Due Date Updated')
      } else {
        res.status(400).send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(deleteTodoQuery)
  res.send('Todo Deleted')
})

module.exports = app
