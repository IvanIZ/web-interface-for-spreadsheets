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


router.get('/test', (req, res) => {
    console.log("Trying to create a new table...")
    
    const queryString = "CREATE TABLE test (col1 VARCHAR(255), col2 VARCHAR(255))"
    
    getConnection().query(queryString, function (err, result)  {
        
      if (err) {
            console.log("Failed to create new table: " + err)
            res.sendStatus(500)
            return
        }
      console.log('New Table Created!')
    })
})

module.exports = router;
