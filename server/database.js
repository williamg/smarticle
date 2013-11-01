// Defines functionality for retrieving DB information

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

exports.getArticles = function (userID, callback) {
	var query =	'SELECT DISTINCT articles.title, articles.url ' +
			'FROM userCat ' +
			'INNER JOIN catArt ON userCat.catID = catArt.catID ' +
			'INNER JOIN articles ON catArt.artID = articles.id ' +
			'WHERE userCat.userID = ' +  userID;
	
	connection.query (query, function (err, rows) {
		if (err) {
			console.log ("Error connecting to DB: " + err.code);
			return null;
		}

		// Connection successful. 
		// Package articles into a pretty format
		var articles = [];
		
		console.log ('Retrieved ' + rows.length + ' articles');
		for (var i = 0; i < rows.length; i++) {
			articles[i] = {
				title: rows[i].title,
				link: rows[i].link
			};
		}

		return callback (articles);
	});

};
