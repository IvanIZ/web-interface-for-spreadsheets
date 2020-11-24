var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// Function that gets connection to SQL database
function getConnection() {
    return mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password', 
      database: 'academic_simulation',
      port: 3307,
      multipleStatements: true
    })
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Batabase backend page running!!' });
});

//get the next 50 rows from database with id greater than start_id
router.get('/attendance/fetch-fifty-rows/:start_id', (req, res) => {
    console.log("trying to fetch rows based on entered index and attribute")
  
    const connection = getConnection();
  
    const start_id = req.params.start_id;
    const end_id = Number(start_id) + 200;
  
    //exclude the start, include the end
    let queryString = "SELECT * FROM attendance WHERE id >= " + start_id + " AND id < " + end_id
    console.log("the query string to fetch 50 rows is: "  + queryString)
    connection.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log("Failed to fetch 50 more rows: " + err);
        res.sendStatus(500);
        return;
      }
  
      console.log("I think we fetched 50 more rows seccessfully")
      //console.log(rows)
      res.json(rows)
    })
  
    //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/grade_book/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM cs225_gradebook WHERE id >= " + start_id + " AND id < " + end_id
  console.log("the query string to fetch 50 rows is: "  + queryString)
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch 50 more rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched 50 more rows seccessfully")
    //console.log(rows)
    res.json(rows)
  })

  //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/student_status/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM student_status WHERE id >= " + start_id + " AND id < " + end_id
  console.log("the query string to fetch 50 rows is: "  + queryString)
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch 50 more rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched 50 more rows seccessfully")
    //console.log(rows)
    res.json(rows)
  })

  //res.end()
});

module.exports = router;