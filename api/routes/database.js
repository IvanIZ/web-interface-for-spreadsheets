var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// Function that gets connection to SQL database
function getConnection() {
    return mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password', 
      database: 'spreadsheetweb',
      port: 3307
      //insecureAuth : true
    })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Batabase backend page running!!' });
});

//Create Table
router.get('/create-table/:num_attr', (req, res) => {
    console.log("Trying to create a new table...")

    //generate sql query based on required number of columns
    let queryString = "CREATE TABLE excel (id INT AUTO_INCREMENT PRIMARY KEY, "
    for (var i = 0; i < Number(req.params.num_attr); i++) {
      if (i !== Number(req.params.num_attr) - 1) {
        queryString = queryString + "attribute" + (i + 1) + " VARCHAR(255), "
      } else {
        queryString = queryString + "attribute" + (i + 1) + " VARCHAR(255))"
      }
    }
    console.log("the query string is: " + queryString)
    
    getConnection().query(queryString, function (err, result)  {
        
      if (err) {
            console.log("Failed to create new table: " + err)
            res.sendStatus(500)
            return
        }
      console.log('New Table Created!')
    })
    res.end()
    //return res.json(results)
})


//Delete Table
router.get('/delete-table', (req, res) => {
  console.log("Trying to delete a table...")
  
  const queryString = "DROP TABLE excel"
  
  getConnection().query(queryString, function (err, result)  {
      
    if (err) {
          console.log("Failed to drop table: " + err)
          res.sendStatus(500)
          return
      }
    console.log('Table deleted!')
  })
  res.end()
  //return res.json(results)
})


//insert tuples from spreadsheet to DB
router.post('/insert-content', (req, res) => {
  console.log("Trying to insert the tuples")
  
  //data matrix and number of attributes in the current table
  let matrix = []
  matrix = req.body.formResults.matrix
  let num_attr = req.body.formResults.num_attr

  //generate sql query
  let queryStart = 'INSERT INTO excel ('
  for (var i = 0; i < num_attr; i++) {
    if (i !== num_attr - 1) {
      queryStart = queryStart + 'attribute' + (i + 1) + ', '
    } else {
      queryStart = queryStart + 'attribute' + (i + 1) + ') VALUES ?'
    }
  }
  console.log("the generated query string to insert is: " + queryStart)
  getConnection().query(queryStart, [matrix], (err, results, fields) => {
    if (err) {
        console.log("Failed to insert new user: " + err)
        res.sendStatus(500)
        return
    }
  })
  res.end()
  //return res.json(results)
})


//get the next 50 rows from database with id greater than start_id
router.get('/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 50;

  //exclude the start, include the end
  let queryString = "SELECT * FROM excel WHERE id > " + start_id + " AND id <= " + end_id
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


//function that retrieves rows with a single key on customized attribute
router.post('/single-index-retrieval', (req, res) => {
  console.log("Fetching 50 more rows with starting id: " + req.params.start_id)

  const connection = getConnection();

  let onID = req.body.formResults.onID
  let attribute = "attribute" + req.body.formResults.attribute
  if (onID === true) {
    attribute = 'id'
  }
  let index = req.body.formResults.index

  //exclude the start, include the end
  let queryString = "SELECT * FROM excel WHERE " + attribute +  " = " + index
  console.log("the query string to do single index fetch is: "  + queryString)
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch single index retrieval rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched single index retrieval rows seccessfully")
    //console.log(rows)
    res.json(rows)
  })

  //res.end()
});

//Delete Table
router.get('/delete-result-table', (req, res) => {
  console.log("Trying to delete a table...")
  
  const queryString = "DROP TABLE result"
  
  getConnection().query(queryString, function (err, result)  {
      
    if (err) {
          console.log("Failed to drop table: " + err)
          res.sendStatus(500)
          return
      }
    console.log('Result Table deleted!')
  })
  res.end()
  //return res.json(results)
})

//Create Reslt Table
router.get('/create-result-table/:num_attr', (req, res) => {
  console.log("Trying to create a new result table...")

  //generate sql query based on required number of columns
  let queryString = "CREATE TABLE result (id INT AUTO_INCREMENT PRIMARY KEY, "
  for (var i = 0; i < Number(req.params.num_attr); i++) {
    if (i !== Number(req.params.num_attr) - 1) {
      queryString = queryString + "attribute" + (i + 1) + " VARCHAR(255), "
    } else {
      queryString = queryString + "attribute" + (i + 1) + " VARCHAR(255))"
    }
  }
  console.log("the query string is: " + queryString)
  
  getConnection().query(queryString, function (err, result)  {
      
    if (err) {
          console.log("Failed to create new result table: " + err)
          res.sendStatus(500)
          return
      }
    console.log('New Result Table Created!')
  })
  res.end()
  //return res.json(results)
})

//get the next 10 rows from database result table with id greater than start_id
router.get('/fetch-ten-rows/:start_id', (req, res) => {
  console.log("trying to fetch rows based on entered index and attribute")

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = Number(start_id) + 10;

  //exclude the start, include the end
  let queryString = "SELECT * FROM result WHERE id > " + start_id + " AND id <= " + end_id
  console.log("the query string to fetch 10 rows is: "  + queryString)
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch 10 more rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched 10 more rows seccessfully")
    //console.log(rows)
    res.json(rows)
  })

  //res.end()
});

//insert tuples from search result to DB
router.post('/insert-result-content', (req, res) => {
  console.log("Trying to insert result the tuples")
  
  //data matrix and number of attributes in the current table
  let matrix = []
  matrix = req.body.formResults_result_buffer.matrix
  let num_attr = req.body.formResults_result_buffer.num_attr

  //generate sql query
  let queryStart = 'INSERT INTO result ('
  for (var i = 0; i < num_attr; i++) {
    if (i !== num_attr - 1) {
      queryStart = queryStart + 'attribute' + (i + 1) + ', '
    } else {
      queryStart = queryStart + 'attribute' + (i + 1) + ') VALUES ?'
    }
  }
  console.log("the generated query string to insert is: " + queryStart)
  getConnection().query(queryStart, [matrix], (err, results, fields) => {
    if (err) {
        console.log("Failed to insert new user: " + err)
        res.sendStatus(500)
        return
    }
  })
  res.end()
  //return res.json(results)
})


//function that retrieves rows with a range key on customized attribute
router.post('/range-index-retrieval', (req, res) => {

  const connection = getConnection();

  let attribute = "attribute" + req.body.formResults.attribute
  let onID = req.body.formResults.onID
  if (onID === true) {
    attribute = 'id'
  }
  let lower_index = req.body.formResults.lower_index
  let upper_index = req.body.formResults.upper_index

  //exclude the start, include the end
  let queryString = "SELECT * FROM excel WHERE " + attribute +  " >= " + lower_index + " AND " + attribute + " <= " + upper_index
  console.log("the query string to do range index fetch is: "  + queryString)
  connection.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch range index retrieval rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched single index retrieval rows seccessfully")
    //console.log(rows)
    res.json(rows)
  })

  //res.end()
});



module.exports = router;
