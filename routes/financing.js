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
    setTimeout(() => {
      connection.end();
    }, 5 * 1000);
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
  setTimeout(() => {
    connection.end();
  }, 5 * 1000);
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
    setTimeout(() => {
      connection.end();
    }, 5 * 1000);
    //res.end()
  });

  // load content from the check_book2 table for check book simulation
router.get('/check_book2/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM check_book2 WHERE id >= " + start_id + " AND id < " + end_id
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
  setTimeout(() => {
    connection.end();
  }, 5 * 1000);
  //res.end()
});

// load content from the check_book3 table for check book simulation
router.get('/check_book3/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM check_book3 WHERE id >= " + start_id + " AND id < " + end_id
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
  setTimeout(() => {
    connection.end();
  }, 5 * 1000);
  //res.end()
});

// updates the tables under the academic simulation
router.post('/update', (req, res) => {
  console.log("Trying to update the tuples")
  
  //data matrix and number of attributes in the current table
  let data = []
  data = req.body.pending_changes.data
  console.log("---------------------------------------------------------")
  console.log(data)
  if (data.length == 0) {
    return;
  }

  var queries = '';
  for (var i = 0; i < data.length; i++) {
    queries += "UPDATE " + data[i][0] + " SET " + data[i][4] + " = '" + data[i][2] + "' WHERE ID = " + (data[i][3] - 1) + "; ";
  }
  console.log("the generated query string to insert is: " + queries)

  //generate sql query
  // y, value, x
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Headers', "*");
  var connection = getConnection();
  connection.query(queries, (err, results, fields) => {
    if (err) {
        console.log("Failed to insert new user: " + err)
        res.sendStatus(500)
        return
    }
  })
  res.end()
  connection.end();
  //return res.json(results)
})

module.exports = router;