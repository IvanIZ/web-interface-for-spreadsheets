var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var databaseRouter = require('./routes/database');
var academicRouter = require('./routes/academic');
var managementRouter = require('./routes/management');
var financingRouter = require('./routes/financing');
var trainingRouter = require('./routes/training');
var socket = require('socket.io');
var Lock_Manager = require('./Lock_Manager');
let cors = require('cors')

let lock_manager = new Lock_Manager();

var app = express();
// app.use(express.static(path.join(__dirname, 'web_spreadsheet/build')))
app.use('/static', express.static(path.join(__dirname, 'web_spreadsheet/build')));

const excelToJson = require('convert-excel-to-json');
const employee_tables = excelToJson({
  sourceFile: 'employees_schema.xlsx'
});
console.log("converted file: ", employee_tables)

let current_users = []
let user_dict = {}
let history = []

let academic_users = [];
let financing_users = [];
let management_users = [];

let num_table = 0
let table_names = ["Empty", "Empty", "Empty", "Empty", "Empty"]
let curr_tables = [[], [], [], [], []]

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/database', databaseRouter);
app.use('/academic', academicRouter);
app.use('/management', managementRouter);
app.use('/financing', financingRouter);
app.use('/training', trainingRouter);

// app.get('*', function(req, res) {
//   res.sendFile(path.join(__dirname + '/web_spreadsheet/build/index.html'));
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//  || 3001
// "start": "node ./bin/www"
const port = process.env.PORT|| 3001
server = app.listen(port, () => {
  console.log('Backend server is up and listening on ${PORT} 3001...')
})

// =================================================Frontend & Backend Communication ================================================ restart

io = socket(server);

io.on('connection', (socket) => {

  // get usernames from frontend
  socket.on('SEND_USERNAME', function(data) {
    console.log("NEW USER SENDING USER NAME!");
    user_dict[socket.id] = [data.user_name, data.simulation]

    if (data.simulation === "academic") {
      academic_users.push(data.user_name);
      current_users = academic_users;

    } else if (data.simulation === "financing") {
      financing_users.push(data.user_name);
      current_users = financing_users; 

    } else if (data.simulation === "management") {
      management_users.push(data.user_name);
      current_users = management_users;
    }

    let message_package = {
      current_users: current_users, 
      history: history,
      simulation: data.simulation
    }
    io.emit('ADD_NEW_USER', message_package);
    io.to(socket.id).emit("RECEIVE_ID", socket.id);
  })

  // send existing tables to frontend
  socket.on('REQUEST_TABLES', function() {
    console.log("frontend requesting existing tables! ");
    io.emit('UPDATE_FRONTEND_TABLE', employee_tables);
  })

  // receive updates on existing tables from frontend
  socket.on('UPDATE_BACKEND_TABLES', function(data) {
    console.log("A user is sending updates to tables!");

    curr_tables = data.curr_tables;
    table_names = data.table_names;
    num_table = data.num_table;

    io.emit('UPDATE_FRONTEND_TABLE', data);
  })

  // receive shared lock request from frontend
  socket.on('REQUEST_SHARED_LOCK', function(shared_lock_request) {
    let row = shared_lock_request.row;
    let col = shared_lock_request.col;
    let table = shared_lock_request.table;
    let request_result = lock_manager.request_Shared_Lock(table, row, col, socket.id);

    if (request_result) {
      let shared_lock_accept = {
        table: table,
        row: row, 
        col: col
      }
      io.emit("REQUEST_SHARED_ACCEPT", shared_lock_accept)

    } else {
      let shared_lock_reject = {
        row: row, 
        col: col
      }
      io.to(socket.id).emit("REQUEST_SHARED_REJECT", shared_lock_reject)
    }
  })

  // receive exclusive lock request from frontend
  socket.on('REQUEST_EXCLUSIVE_LOCK', function(exclusive_lock_request) {
    console.log("receive exclusive request!!")
    let row = exclusive_lock_request.row;
    let col = exclusive_lock_request.col;
    let request_result = lock_manager.request_Exclusice_Lock(row, col, socket.id);

    if (request_result) {
      let exclusive_lock_accept = {
        row: row, 
        col: col, 
        id: socket.id
      }
      io.emit("REQUEST_EXCLUSIVE_ACCEPT", exclusive_lock_accept)

    } else {
      let exclusive_lock_reject = {
        row: row, 
        col: col
      }
      io.to(socket.id).emit("REQUEST_EXCLUSIVE_REJECT", exclusive_lock_reject)
    }
  })


  // listen for cell data change 
  // NOTE: currently this function does not differentiate users from different simulations !!!!!!!!!!!
  socket.on('SEND_MESSAGE', function(data) {

    // reflect data changes to other users
    console.log("The frontend that send the data is:", socket.id)
    io.emit('RECEIVE_MESSAGE', data);

    // send the new update_message
    let target_user = user_dict[socket.id];
    if (typeof target_user === "undefined") {
      return;
    }
    let new_message = target_user[0];
    let change_table = data.data

    // get position, new value
    for (var x = 0; x < change_table.length; x++) {
      // [table_name, change_type, update_value, update_attribute, search_attribute1, search_attribute2, y_coord, x_coord] for cell changes
      // [table_name, change_type, operation, direction, search_attribute, socket_id] for remove row
      // [table_name, change_type, operation, value, search_attribute, socket_id] for insert row
      console.log("the current change is: ", change_table[x])
      let table = change_table[x][0];
      let change_type = change_table[x][1];

      if (change_type === "layout_change") {
        let operation = change_table[x][2];
        if (operation === "remove_r") {
          if (table === "attendance") {
            new_message += " removed the entry for student with netID " + change_table[x][4] + " in table " + table + "; ";
          } else if (table === "cs225_gradebook") {
            new_message += " removed the entry for student with netID " + change_table[x][4] + " in table " + table + "; ";
          } else if (table === "students") {
            new_message += " removed the entry for student with netID " + change_table[x][4] + " in table " + table + "; ";
          } else if (table === "team_grades") {
            new_message += " removed the entry for team: " + change_table[x][4] + " in table " + table + "; ";
          } else if (table === "team_comments") {
            new_message += " removed the entry for team: " + change_table[x][4] + " in table " + table + "; ";
          }

        } else if (operation === "insert_r") {
          new_message += " added a new entry in table " + table + "; ";
        }

      } else if (change_type === "cell_change" || change_type === "special_remove") {
        let letter = String.fromCharCode(64 + change_table[x][7] + 1);
        let number = change_table[x][6] + 1;
        let new_value = change_table[x][2];
        if (x == change_table.length - 1) {
          new_message += " updated cell " + letter + number + " in " + table + " table to " + new_value
        } else {
          new_message += " updated cell " + letter + number + " in " + table + " table to " + new_value + ", "
        }
      }
    }

    // push the update into edit history, and send user the history
    let history_line = (history.length + 1) + ". " + new_message + "\n"
    history.push(history_line)
    console.log("The history is: ", history);

    // send the current update to user
    new_message = "Last Edit: " + new_message
    console.log(new_message)

    let message_package = {
      new_message: new_message, 
      history: history
    }
    io.emit('UPDATE_EDIT_MESSAGE', message_package);
  })

  socket.on('FINISH_TRANSACTION', function() {

    // remove all possible locks of that user
    let free_cells = lock_manager.finish_transaction(socket.id);
    let free_cell_package = {
      free_cells: free_cells,
      disconnect: false
    }
    io.emit("RECEIVE_FREED_CELLS", free_cell_package);
  });

  // receive layout changes from a client. Send it to all client
  socket.on('LAYOUT_CHANGES_TO_SOCKET', function(layout_changes) {
    io.emit('LAYOUT_CHANGES_TO_CLIENT', layout_changes);
  });


  // listen for user disconnect
  socket.on('disconnect', function() {
    console.log("disconnected is is: ", socket.id)

    // remove the user from the current user list
    let target_user = user_dict[socket.id];
    if (typeof target_user === "undefined") {
      return;
    }
    let user_name = target_user[0];
    let simulation = target_user[1];
    if (simulation === "academic") {
      current_users = academic_users;
    } else if (simulation === "financing") {
      current_users = financing_users;
    } else if (simulation === "management") {
      current_users = management_users;
    }

    for (var i = 0; i < current_users.length; i++) {
      console.log("current loop on ", current_users[i])
      if (current_users[i].localeCompare(user_name) == 0) {
        console.log("Disconnected user found")
        current_users.splice(i, 1);
        break;
      }
    }

    let message_package = {
      current_users: current_users, 
      simulation: simulation
    }

    // send the new list of users back to frontend
    io.emit('CHANGE_CURRENT_USER', message_package);
    console.log(current_users)

  });
  
});




module.exports = app;
