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
function queryDB (query, callback) {
	connection.query (query, function (err, result) {
		
		if (err) {
			console.log ('Error executing query: ' + query);
			return callback (err, null);
		}

		return callback (null, result);
	});
}

// Select the articles waiting for a user
exports.getArticles = function (userID, callback) {
	var query =	'SELECT DISTINCT articles.title, articles.url ' +
			'FROM userCat ' +
			'INNER JOIN catArt ON userCat.catID = catArt.catID ' +
			'INNER JOIN articles ON catArt.artID = articles.id ' +
			'WHERE userCat.userID = ' +  userID;
	
	queryDB (query, function (err, rows) {
		if (err) return callback (err, null);

		// Query successful. 
		// Package articles into a pretty format
		var articles = [];		
		for (var i = 0; i < rows.length; i++) {
			articles[i] = {
				title: rows[i].title,
				link: rows[i].url
			};
		}

		return callback (null, articles);
	});

};

// Select a user's primary categories
exports.getCategories = function (userID, callback) {
	var query =	'SELECT DISTINCT categories.name ' +
			'FROM userCat ' +
			'INNER JOIN categories ' + 
			'ON categories.id = userCat.catID ' +
			'WHERE userCat.primary = 1 AND userCat.userID = ' +
			userID;

       queryDB (query, function (err, rows) {
		if (err) return callback (err, null);

		// Query successful
		var categories = [];
		for (var i = 0; i < rows.length; i++) {
			categories[i] = {name: rows[i].name };
		}

		return callback (null, categories);
	});
};

// Add a category to a user.
exports.addPrimaryCatToUser = function (category, userID, callback) {
	category = connection.escape (category.toLowerCase ());
	
	// Create the category if it is not used by any other user
	addCategory (category, function (err) {

		if (err) return callback (err);

		// Make the category a primary category for the user
		return makePrimaryCat (category, userID, callback);
		
	});
};

function addCategory (category, callback) {	
	// If the category doesn't exist, create it.	
	var query =	'INSERT INTO categories (name, popularity) ' +
			'VALUES (' + category + ', 0)' + 
			'ON DUPLICATE KEY UPDATE name = name';
	
	queryDB (query, function (err, result) {
		if (err) return callback (err);

		// Connection successful.
		return callback (null);
	});			
}

function makePrimaryCat (category, userID, callback) {
	var query =	'INSERT INTO userCat (userID, catID, `primary`) ' +
			'SELECT ' + userID + ', id, 1 ' +
			'FROM categories WHERE name = ' +  category + ' ' + 
			'ON DUPLICATE KEY UPDATE userCat.primary = 1';	
			
	queryDB (query, function (err, result) {
		if (err) return callback(err);

		// Connection successful.
		return callback(null);
	});	
}

exports.removePrimaryCatFromUser = function (category, userID, callback) {
		removePrimaryCategory (category, userID, function (err) {

			if (err) return callback (err);

			return removeUnusedCategories (category, callback);
		});
};

function removePrimaryCategory (category, userID, callback) {
	var query =	'DELETE userCat FROM userCat ' +
			'INNER JOIN categories ON categories.id = userCat.catID ' + 
			'WHERE userCat.userID = ' + userID + ' ' +
			'AND categories.name = "' + category + '" ' +
			'AND userCat.primary = 1';		

	queryDB (query, function (err, result) {
		if (err) return callback(err);

		// Connection successful.
		return callback (null);
	});	
}

function removeUnusedCategories (category, callback) {
	var query =	'DELETE FROM categories ' +	
			'WHERE NOT EXISTS (' + 
			'SELECT 1 FROM userCat ' + 
			'WHERE userCat.catID = categories.id)';	

	queryDB (query, function (err, result) {
		if (err) return callback (err);

		// Connection successful.
		return callback(null);
	});
}
