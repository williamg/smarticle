// Defines functionality for retrieving and storing  DB information

// Database credentials
var host = 'localhost';
var user = 'root';
var password = 'root';
var database = 'smarticle';
var port = '8889';

var mysql = require ('mysql');
var connection = mysql.createConnection ({
	host:		host,
	user:		user,
	password:	password,
	database:	database,
	port:		port
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

