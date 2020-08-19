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

    return res.json(results)
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
  return res.json(results)
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
})


//get the next 50 rows from database with id greater than start_id
router.get('/fetch-fifty-rows/:start_id', (req, res) => {
  console.log("Fetching 50 more rows with starting id: " + req.params.start_id)

  const connection = getConnection();

  const start_id = req.params.start_id;
  const end_id = start_id + 50;
  const queryString = "SELECT * FROM excel WHERE id > ? AND id <= ?";
  connection.query(queryString, [start_id, end_id], (err, rows, fields) => {
    if (err) {
      console.log("Failed to fetch 50 more rows: " + err);
      res.sendStatus(500);
      return;
    }

    console.log("I think we fetched 50 more rows seccessfully")
    console.log(rows)
    res.json(rows)
  })

  //res.end()
});

module.exports = router;
