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
			console.log ('database.js/getArticles - ' + 
				'error with DB: ' + err.code);
			return callback (err, null);
		}

		// Connection successful. 
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

exports.getCategories = function (userID, callback) {
	var query =	'SELECT DISTINCT categories.name ' +
			'FROM userCat ' +
			'INNER JOIN categories ' + 
			'ON categories.id = userCat.catID ' +
			'WHERE userCat.primary = 1 AND userCat.userID = ' +
			userID;

	connection.query (query, function (err, rows) {
		if (err) {
			console.log ('database.js/getCategories - ' + 
				'error with DB: ' + err.code);
			return callback (err, null);
		}

		var categories = [];
		for (var i = 0; i < rows.length; i++) {
			categories[i] = {name: rows[i].name };
		}

		return callback (null, categories);
	});
};

// Add a category to a user.
// If the category does not already exist, it is created and added to the
// categories table. From there, it is determined whether or not the category
// is already a secondary category of the user. If it is, it is made a primary category.
// Then, if it is not already a primary category of the user, an entry is added in the userCat
// table that links the user and the category.
exports.addPrimaryCatToUser = function (category, userID, callback) {
	category = connection.escape (category.toLowerCase ());
	addCategory (category, function (err) {
		// If the category is already a seconday category of the user,
		// promote it to be a primary category	
		return makePrimaryCat (category, userID, callback);
		
	});
};

function addCategory (category, callback) {	
	// If the category doesn't exist, create it.	
	var query =	'INSERT INTO categories (name, popularity) ' +
			'VALUES (' + category + ', 0)' + 
			'ON DUPLICATE KEY UPDATE name = name';
	
	connection.query (query, function (err, result) {
		if (err) {
			console.log ('database.js/addCategory - ' + 
				'error connecting to DB: ' + err.code);
			return callback (err2);
		}

		// Connection successful.
		return callback (null);
	});			
}
function makePrimaryCat (category, userID, callback) {
	var query =	'INSERT INTO userCat (userID, catID, `primary`) ' +
			'SELECT ' + userID + ', id, 1 ' +
			'FROM categories WHERE name = ' +  category + ' ' + 
			'ON DUPLICATE KEY UPDATE userCat.primary = 1';	
			
	connection.query (query, function (err, result) {
		if (err) {
			console.log ('database.js/addPrimaryCategory - error with DB: ' + err.code);
			return null;
		}

		// Connection successful.
		return callback;
	});	
}

exports.removePrimaryCatFromUser = function (category, userID, callback) {
		removePrimaryCategory (category, userID, function () {
				return removeUnusedCategories (category, callback);
		});
};

function removePrimaryCategory (category, userID, callback) {
	var query =	'DELETE userCat FROM userCat ' +
			'INNER JOIN categories ON categories.id = userCat.catID ' + 
			'WHERE userCat.userID = ' + userID + ' ' +
			'AND categories.name = "' + category + '" ' +
			'AND userCat.primary = 1';		

	connection.query (query, function (err, result) {
		if (err) {
			console.log ('database.js/removePrimaryCategory - error with DB: ' + err.code);
			return null;
		}

		// Connection successful.
		return callback ();
	});	
}

function removeUnusedCategories (category, callback) {
	var query =	'DELETE FROM categories ' +	
			'WHERE NOT EXISTS (' + 
			'SELECT 1 FROM userCat ' + 
			'WHERE userCat.catID = categories.id)';	

	connection.query (query, function (err, result) {
		if (err) {
			console.log ('database.js/removePrimaryCategory - error with DB: ' + err.code);
			return null;
		}

		// Connection successful.
		return callback;
	});
}
