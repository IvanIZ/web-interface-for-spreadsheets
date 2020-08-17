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
        queryString = queryString + "attribute" + (i + 1) + " INT, "
      } else {
        queryString = queryString + "attribute" + (i + 1) + " INT)"
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
})

module.exports = router;
