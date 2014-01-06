var mysql = require ('mysql');

// Database credentials
var host = 'localhost';
var user = 'root';
var password = 'root';
var database = 'smarticle';
var port = '8889';

var connection = mysql.createConnection ({
  host:     host,
  user:     user,
  password: password,
  database: database,
  port:     port
});

// Execute a database query
exports.queryDB = function (query, callback) {
  connection.query (query, function (err, result) {
		
    if (err) {
      console.log ('Error executing query: ' + query);
      callback (err, null);
      return;
    }

    callback (null, result);
  });
};

// Safely escape a string for MySQL insertion
exports.escape = function (string) {
  return connection.escape (string);
};
