var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var databaseRouter = require('./routes/database');
var socket = require('socket.io');
var Lock_Manager = require('./Lock_Manager');

let lock_manager = new Lock_Manager();

var app = express();

let current_users = []
let user_dict = {}
let history = []

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/database', databaseRouter);

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

const port = process.env.PORT || 3001
server = app.listen(port, () => {
  console.log("Backend server is up and listening on port 3001...")
})

// =================================================Frontend & Backend Communication ================================================

function process_formula() {
  console.log("processing formula");
}

io = socket(server);

io.on('connection', (socket) => {

  // get usernames from frontend
  socket.on('SEND_USERNAME', function(data) {
    user_dict[socket.id] = data.user_name
    current_users.push(data.user_name);
    let message_package = {
      current_users: current_users, 
      history: history
    }
    io.emit('ADD_NEW_USER', message_package);
    io.to(socket.id).emit("RECEIVE_ID", socket.id);
  })


  // receive shared lock request from frontend
  socket.on('REQUEST_SHARED_LOCK', function(shared_lock_request) {
    let row = shared_lock_request.row;
    let col = shared_lock_request.col;
    let request_result = lock_manager.request_Shared_Lock(row, col, socket.id);

    if (request_result) {
      let shared_lock_accept = {
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
  socket.on('SEND_MESSAGE', function(data) {

    // reflect data changes to other users
    console.log("The frontend that send the data is:", socket.id)
    io.emit('RECEIVE_MESSAGE', data);

    // send the new update_message
    let new_message = user_dict[socket.id] + " changed ";
    let change_table = data.data

    // get position, new value
    for (var x = 0; x < change_table.length; x++) {
      let letter = String.fromCharCode(64 + change_table[x][0]);
      let number = change_table[x][2]
      let new_value = change_table[x][1]

      // Check if the new value is a formula and parse it
      if (new_value.charAt(0) == '=') {
        new_value = process_formula(new_value);
      }
      if (x == change_table.length - 1) {
        new_message += "cell " + letter + number + " to " + new_value
      } else {
        new_message += "cell " + letter + number + " to " + new_value + ", "
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


  // listen for user disconnect
  socket.on('disconnect', function() {
    console.log("disconnected is is: ", socket.id)

    // remove the user from the current user list
    for (var i = 0; i < current_users.length; i++) {
      console.log("current loop on ", current_users[i])
      let user_name = user_dict[socket.id]
      if (current_users[i].localeCompare(user_name) == 0) {
        console.log("Disconnected user found")
        current_users.splice(i, 1);
        break;
      }
    }

    // send the new list of users back to frontend
    io.emit('CHANGE_CURRENT_USER', current_users);
    console.log(current_users)

    // remove all possible locks of that user
    let free_cells = lock_manager.finish_transaction(socket.id);
    let free_cell_package = {
      free_cells: free_cells,
      disconnect: true
    }
    io.emit("RECEIVE_FREED_CELLS", free_cell_package);
  });
  
});




module.exports = app;
