var db = require (__dirname + '/../server/database.js');
var async = require ('async');

// =============================================================================
// Retrieve basic info about a user
// =============================================================================
exports.getUser = function (req, res) {

};

// =============================================================================
// Create a new user
// =============================================================================
exports.addUser = function (req, res) {

};

// =============================================================================
// Get a user's primary keywords
// =============================================================================
exports.getPrimaryKeywords = function (req, res) {
	
	// Verify valid api parameters
	if (req.params.userID < 0) {
		res.statusCode = 400;
		return res.send ('Error 400: Invalid userID.');
	}

	var userID = req.params.userID;

	var query =	'SELECT DISTINCT categories.name ' +
			'FROM userCat ' +
			'INNER JOIN categories ' + 
			'ON categories.id = userCat.catID ' +
			'WHERE userCat.primary = 1 AND userCat.userID = ' +
			userID;

       db.queryDB (query, function (err, rows) {
		if (err) {
			res.statusCode = 401;
			return res.send ('Error 401: ' + err);
		}
			
		return res.json (rows);
       });
};

// =============================================================================
// Get a user's secondary keywords
// =============================================================================
exports.getSecondaryKeywords = function (req, res) {

	// Verify valid api parameters
	if (req.params.userID < 0) {
		res.statusCode = 400;
		return res.send ('Error 400: Invalid userID.');
	}

	var userID = req.params.userID;

	var query =	'SELECT DISTINCT categories.name ' +
			'FROM userCat ' +
			'INNER JOIN categories ' + 
			'ON categories.id = userCat.catID ' +
			'WHERE userCat.primary = 0 AND userCat.userID = ' +
			userID;

       db.queryDB (query, function (err, rows) {
		if (err) {
			res.statusCode = 499;
			return res.send ('Error 499: ' + err);
		}
			
		return res.json (rows);
       });
	};

// =============================================================================
// Remove a user's primary keyword
// =============================================================================
exports.removePrimaryKeyword = function (req, res) {
	
	if (req.params.userID < 0) {
		res.statusCode = 400;
		return res.send ('Error 400: Invalid userID');
	}

	if (req.params.keyword === '') {
		res.statusCode = 401;
		return res.send ('Error 401: Keyword must not be null');
	}

	var userID = req.params.userID;
	var keyword = req.params.keyword;	
	
	var query =	'DELETE userCat FROM userCat ' +
			'INNER JOIN categories ON ' +
			'categories.id = userCat.catID ' + 
			'WHERE userCat.userID = ' + userID + ' ' +
			'AND categories.name = "' + keyword + '" ' +
			'AND userCat.primary = 1';		

	db.queryDB (query, function (err) {
		if (err) {
			res.statusCode = 499;
			return res.send ('Error 499: ' + err);
		}

		return res.json (true);
	});
};

// =============================================================================
// Add a primary keyword to a user
// =============================================================================
exports.addPrimaryKeyword = function (req, res) {

	if (req.params.userID < 0) {
		res.statusCode = 400;
		return res.send ('Error 400: Invalid userID');
	}

	if (req.params.kewyord === '') {
		res.statusCode = 401;
		return res.send ('Error 401: Keyword must not be null');
	}

	var userID = req.params.userID;
	
	// TODO: Sanitize keyword
	var keyword = req.params.keyword;
		
	async.series ([
		function (callback) {
			addKeyword (keyword, callback);
		},
		function (callback) {
			makePrimaryKeyword (userID, keyword, callback);
		}
	],
	function (err) {
		if (err) {
			res.statusCode = 499;
			return res.send ('Error 499: ' + err);
		}

		return res.json (true);
	});
};

function addKeyword (keyword, callback) {

	// If the category doesn't exist, create it.	
	var query =	'INSERT INTO categories (name, popularity) ' +
			'VALUES ("' + keyword + '", 0)' + 
			'ON DUPLICATE KEY UPDATE name = name';
	
	db.queryDB (query, function (err, result) {
		if (err) {
			callback (err);
			return;
		}

		// Connection successful.
		callback (null);
	});			

}

function makePrimaryKeyword (userID, keyword, callback) {
	
	var query =	'INSERT INTO userCat (userID, catID, `primary`) ' +
			'SELECT ' + userID + ', id, 1 ' +
			'FROM categories WHERE name = "' + keyword + '" ' + 
			'ON DUPLICATE KEY UPDATE userCat.primary = 1';	
			
	db.queryDB (query, function (err, result) {
		if (err) {
			callback(err);
			return;
		}

		// Connection successful.
		callback(null);
	});	
}

// =============================================================================  
// Get a user's articles
// ============================================================================= 
exports.getArticles = function (req, res) {
	
	if (req.params.userID < 0) {
		res.status = 400;
		return res.send ("Error 400: Invalid userID");
	}

	var query =	'SELECT DISTINCT articles.title, articles.url ' +
			'FROM userCat ' +
			'INNER JOIN catArt ON userCat.catID = catArt.catID ' +
			'INNER JOIN articles ON catArt.artID = articles.id ' +
			'WHERE userCat.userID = ' +  userID;
	
	db.queryDB (query, function (err, rows) {
		if (err)
		{
			res.status = 499;
			return res.send ("Error 499: " + err);
		}
	
		return res.json (rows);	
	});
};
