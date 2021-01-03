var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// Function that gets connection to SQL database
function getConnection() {
    return mysql.createConnection({
      // host: 'localhost',
      // user: 'root',
      // password: 'password', 
      // database: 'academic_simulation',
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

//get the next 50 rows from database with id greater than start_id
router.get('/attendance/fetch-fifty-rows/:start_id', (req, res) => {
    console.log("trying to fetch rows based on entered index and attribute")
  
    const connection = getConnection();
  
    const start_id = req.params.start_id;
    const end_id = Number(start_id) + 200;
  
    //exclude the start, include the end
    let queryString = "SELECT * FROM attendance"
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
    });
    connection.end();
    // setTimeout(() => {
    //   connection.end();
    // }, 5 * 1000);
    //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/grade_book/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM cs225_gradebook"
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
  connection.end();
  // setTimeout(() => {
  //   connection.end();
  // }, 5 * 1000);
  //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/student_status/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM student_status"
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
  connection.end();
  // setTimeout(() => {
  //   connection.end();
  // }, 5 * 1000);
  //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/students/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM students"
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
  connection.end();
  // setTimeout(() => {
  //   connection.end();
  // }, 5 * 1000);
  //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/team_grades/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 200;

  //exclude the start, include the end
  let queryString = "SELECT * FROM team_grades"
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
  connection.end();
  // setTimeout(() => {
  //   connection.end();
  // }, 5 * 1000);
  //res.end()
});

//get the next 50 rows from database with id greater than start_id
router.get('/team_comments/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 28;

  //exclude the start, include the end
  let queryString = "SELECT * FROM team_comments"
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
  connection.end();
  // setTimeout(() => {
  //   connection.end();
  // }, 5 * 1000);
  //res.end()
});


// updates the tables under the academic simulation
router.post('/update', (req, res) => {
  console.log("Trying to update the tuples")
  
  //data matrix and number of attributes in the current table
  let data = []
  data = req.body.pending_changes.data
  console.log(data)
  if (data.length == 0) {
    res.end();
    return;
  }

  var queries = '';
  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === "cell_change") { // [table_name, change_type, update_value, update_attribute, search_attribute1, search_attribute2, x_coord, y_coord] for cell changes
      if (data[i][0] === "attendance") {
        queries += "UPDATE " + data[i][0] + " SET " + data[i][3] + " = '" + data[i][2] + "' WHERE NetID = '" + data[i][4] + "' OR NAME = '" + data[i][5] + "';";
      } else if (data[i][0] === "cs225_gradebook") {
        queries += "UPDATE " + data[i][0] + " SET " + data[i][3] + " = '" + data[i][2] + "' WHERE NetID = '" + data[i][4] + "' OR NAME = '" + data[i][5] + "';";
      } else if (data[i][0] === "students") {
        queries += "UPDATE " + data[i][0] + " SET " + data[i][3] + " = '" + data[i][2] + "' WHERE NetID = '" + data[i][4] + "' OR NAME = '" + data[i][5] + "';";
      } else if (data[i][0] === "team_grades") {
        queries += "UPDATE " + data[i][0] + " SET " + data[i][3] + " = '" + data[i][2] + "' WHERE Team = '" + data[i][4] + "';";
      } else if (data[i][0] === "team_comments") {
        queries += "UPDATE " + data[i][0] + " SET " + data[i][3] + " = '" + data[i][2] + "' WHERE Team = '" + data[i][4] + "';";
      }
    }

    else if (data[i][1] === "layout_change") {
      if (data[i][0] === "attendance") {    // [table_name, change_type, operation, direction, search_attribute ]
        if (data[i][2] === "remove_r") {
          queries += "DELETE FROM " + data[i][0] +  " WHERE NetID = '" + data[i][4] + "'; ";
        }

        if (data[i][2] === "insert_r") {  // [table_name, change_type, operation, value, search_attribute] for insert
          queries += "INSERT INTO " + data[i][0] +  " (" + data[i][4] + ") VALUES ('" + data[i][3] + "');";
        }
      } else if (data[i][0] === "cs225_gradebook") {
        if (data[i][2] === "remove_r") {
          queries += "DELETE FROM " + data[i][0] +  " WHERE NetID = '" + data[i][4] + "'; ";
        }

        if (data[i][2] === "insert_r") {  // [table_name, change_type, operation, value, search_attribute] for insert
          queries += "INSERT INTO " + data[i][0] +  " (" + data[i][4] + ") VALUES ('" + data[i][3] + "');";
        }
      } else if (data[i][0] === "students") {
        if (data[i][2] === "remove_r") {
          queries += "DELETE FROM " + data[i][0] +  " WHERE NetID = '" + data[i][4] + "'; ";
        }

        if (data[i][2] === "insert_r") {  // [table_name, change_type, operation, value, search_attribute] for insert
          queries += "INSERT INTO " + data[i][0] +  " (" + data[i][4] + ") VALUES ('" + data[i][3] + "');";
        }
      } else if (data[i][0] === "team_grades") {
        if (data[i][2] === "remove_r") {
          queries += "DELETE FROM " + data[i][0] +  " WHERE Team = '" + data[i][4] + "'; ";
        }

        if (data[i][2] === "insert_r") {  // [table_name, change_type, operation, value, search_attribute] for insert
          queries += "INSERT INTO " + data[i][0] +  " (" + data[i][4] + ") VALUES ('" + data[i][3] + "');";
        }
      } else if (data[i][0] === "team_comments") {
        if (data[i][2] === "remove_r") {
          queries += "DELETE FROM " + data[i][0] +  " WHERE Team = '" + data[i][4] + "'; ";
        }

        if (data[i][2] === "insert_r") {  // [table_name, change_type, operation, value, search_attribute] for insert
          queries += "INSERT INTO " + data[i][0] +  " (" + data[i][4] + ") VALUES ('" + data[i][3] + "');";
        }
      }
    }
    
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