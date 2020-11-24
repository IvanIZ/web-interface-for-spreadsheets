var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// Function that gets connection to SQL database
function getConnection() {
    return mysql.createConnection({
      // host: 'localhost',
      // user: 'root',
      // password: 'password', 
      // database: 'training_data',
      // port: 3307,
      // multipleStatements: true

      
      host: "us-cdbr-east-02.cleardb.com",
      user: "be99851caba131",
      password: "941059a0",
      database: "heroku_0e7e9ca9cbde5f9",
      multipleStatements: true
    })
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Batabase backend page running!!' });
});

// Send training data from the frontend to the database
router.post('/send-training-data/academic', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_academic (name, action, attribute1, attribute2, feature, table_name, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', item);
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
router.post('/send-training-data/financing', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_financing (name, action, attribute1, attribute2, feature, table_name, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', item);
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
router.post('/send-training-data/management', (req, res) => {
    console.log("Trying to update the tuples")
    
    //data matrix and number of attributes in the current table
    let user_actions = []
    user_actions = req.body.action_package.user_actions;
    console.log(user_actions)
  
    var queries = '';
  
    user_actions.forEach(function (item) {
      // queries += mysql.format('UPDATE excel SET attribute' + '?' + ' = ? WHERE (id = ?);', item);
      queries += mysql.format('INSERT INTO training_management (name, action, attribute1, attribute2, feature, table_name, schema_id, schema_attr, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', item);
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