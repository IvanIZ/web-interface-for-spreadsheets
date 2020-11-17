var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// Function that gets connection to SQL database
function getConnection() {
    return mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password', 
      database: 'training_data',
      port: 3307,
      multipleStatements: true
    })
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Batabase backend page running!!' });
});

// Send training data from the frontend to the database
router.post('/send-training-data/attendance', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_attendance (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/grade_book', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_gradebook (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/check_book', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_checkbook (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/monthly_expense', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_monthly_expense (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/monthly_income', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_monthly_income (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/employee_schedule_v1', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_schedule_v1 (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/employee_schedule_v2', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_schedule_v2 (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

// Send training data from the frontend to the database
router.post('/send-training-data/progress_log', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_progress_log (action, attribute1, attribute2, feature, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?);', item);
    });
    console.log("the generated query string to insert is: " + queries)
  
    //generate sql query
    // y, value, x
    getConnection().query(queries, (err, results, fields) => {
      if (err) {
          console.log("Failed to insert new user: " + err)
          res.sendStatus(500)
          return
      }
    })
    res.end()
    //return res.json(results)
})

module.exports = router;