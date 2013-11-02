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
				link: rows[i].url
			};

		
		}

		return callback (articles);
	});

};

exports.getCategories = function (userID, callback) {
	var query =	'SELECT DISTINCT categories.name ' +
			'FROM userCat ' +
			'INNER JOIN categories ON categories.id = userCat.catID ' +
			'WHERE userCat.primary = 1 AND userCat.userID = ' + userID;

	connection.query (query, function (err, rows) {
		if (err) {
			console.log ('database.js/getCategories - error with DB: ' + err.code);
			return null;
		}

		var categories = [];

		for (var i = 0; i < rows.length; i++) {
			categories[i] = {name: rows[i].name };
		}

		return callback (categories);
	});
};

// Add a category to a user.
// If the category does not already exist, it is created and added to the
// categories table. From there, it is determined whether or not the category
// is already a secondary category of the user. If it is, it is made a primary category.
// Then, if it is not already a primary category of the user, an entry is added in the userCat
// table that links the user and the category.
exports.addCategory = function (category, userID, callback) {

	category = connection.escape (category.toLowerCase ());

	// If the category doesn't exist, create it.
	// Link the category and the user
	categoryExists (category, function (exists) {
		if (exists)
			return addCatToUser (category, userID, callback);
	
		var query =	'INSERT INTO categories (name, popularity) VALUES (' + category + ', 0)';
		
		connection.query (query, function (err, result) {
			if (err) {
				console.log ('database.js/addCategory - error connecting to DB: ' + err.code);
				return null;
			}

			// Connection successful.
			return addCatToUser (category, userID, callback);
		});			
	});

	
};

// Make a category a primary category of a user
function addCatToUser (category, userID, callback) {
	// If the category is already a seconday category of the user,
	// promote it to be a primary category.
	makePrimaryCategory (category, userID, function () {
		userHasPrimaryCategory (category, userID, function (userHas) {
			// Don't do anything if it's already a primary category of the user
			if (userHas) return callback;

			return addPrimaryCategory (category, userID, callback);
		});
	});
}

// Check whether or not a category exists
function categoryExists (category, callback) {
	var query =	'SELECT COUNT(*) AS total FROM categories WHERE name = ' + category;
	
	connection.query (query, function (err, rows) {
		if (err) {
			console.log ('database.js/categoryExists - error with  DB: ' + err.code);
			return null;
		}

		// Return the result of the query
		return callback (rows[0].total > 0);
	});

}

// Check whether or not the specified category is a secondary category of the user
function userHasSecondaryCategory (category, userID, callback) {
	var query =	'SELECT COUNT(*) AS total FROM userCat ' +
			'INNER JOIN categories ON categories.id = userCat.catID ' + 
			'WHERE categories.name = ' + category + ' ' +
			'AND userCat.primary = 0 AND userCat.userID = ' + userID;
	
	connection.query (query, function (err, rows) {
		if (err) {
			console.log ('database.js/userHasSecondaryCategory - error with DB: ' + err.code);
			return null;
		}
		
		// Return the result of the query
		return callback(rows[0].total > 0);
	});
}

// Force a users category to be a primary category
function makePrimaryCategory (category, userID, callback) {	
	var query =	'UPDATE userCat ' + 
			'INNER JOIN categories ON categories.id = userCat.catID ' +
			'SET userCat.primary=1 WHERE userCat.userID = ' + userID + ' ' +
			'AND categories.name = ' + category;
	
	connection.query (query, function (err, rows) {
		if (err) {
			console.log ('database.js/makePrimaryCategory - error with DB: ' + err.code);
			return null;
		}

		// Connection successful.
		return callback();
	});
}

function userHasPrimaryCategory (category, userID, callback) {
	var query =	'SELECT COUNT(*) AS total FROM userCat ' +
			'INNER JOIN categories ON categories.id = userCat.catID ' + 
			'WHERE categories.name = ' + category + ' ' +
			'AND userCat.primary = 1  AND userCat.userID = ' + userID;
	
	connection.query (query, function (err, rows) {
		if (err) {
			console.log ('database.js/userHasPrimaryCategory - error with DB: ' + err.code);
			return null;
		}

		// Connection successful
		return callback (rows[0].total > 0);
	});
}

function addPrimaryCategory (category, userID, callback) {
	var query =	'INSERT INTO userCat (userID, catID, `primary`) ' +
			'SELECT ' + userID + ', id, 1 ' +
			'FROM categories WHERE name = ' +  category;

	connection.query (query, function (err, result) {
		if (err) {
			console.log ('database.js/addPrimaryCategory - error with DB: ' + err.code);
			return null;
		}

		// Connection successful.
		return callback;
	});	
}

exports.removeCategory = function (category, userUD) {
};
