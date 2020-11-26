var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// Function that gets connection to SQL database
function getConnection() {
    return mysql.createConnection({
      // host: 'localhost',
      // user: 'root',
      // password: 'password', 
      // database: 'financing_simulation',
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

// load content from the check_book table for check book simulation
router.get('/check_book/fetch-fifty-rows/:start_id', (req, res) => {
    console.log("trying to fetch rows based on entered index and attribute")
  
    const connection = getConnection();
  
    const start_id = req.params.start_id;
    const end_id = Number(start_id) + 200;
  
    //exclude the start, include the end
    let queryString = "SELECT * FROM check_book WHERE id >= " + start_id + " AND id < " + end_id
    console.log("the query string to fetch 50 rows is: "  + queryString)
    connection.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log("Failed to fetch 50 more rows: " + err);
        res.sendStatus(500);
        return;
      }
  
      console.log("I think we fetched 50 more rows seccessfully")
      
      res.header('Access-Control-Allow-Origin', "*");
      res.header('Access-Control-Allow-Headers', "*");
      res.json(rows)
    })
  
    //res.end()
});

// load content from the monthly expense table for monthly expense simulation
router.get('/monthly_expense/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM monthly_expense WHERE id >= " + start_id + " AND id < " + end_id
  console.log("the query string to fetch 50 rows is: "  + queryString)
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch 50 more rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched 50 more rows seccessfully")
    
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    res.json(rows)
  })

  //res.end()
});

// load content from the monthly income table for monthly income simulation
router.get('/monthly_income/fetch-fifty-rows/:start_id', (req, res) => {
    console.log("trying to fetch rows based on entered index and attribute")
  
    const connection = getConnection();
  
    const start_id = req.params.start_id;
    const end_id = Number(start_id) + 200;
  
    //exclude the start, include the end
    let queryString = "SELECT * FROM monthly_income WHERE id >= " + start_id + " AND id < " + end_id
    console.log("the query string to fetch 50 rows is: "  + queryString)
    connection.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log("Failed to fetch 50 more rows: " + err);
        res.sendStatus(500);
        return;
      }
  
      console.log("I think we fetched 50 more rows seccessfully")
      
      res.header('Access-Control-Allow-Origin', "*");
      res.header('Access-Control-Allow-Headers', "*");
      res.json(rows)
    })
  
    //res.end()
  });

module.exports = router;