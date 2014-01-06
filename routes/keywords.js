var db = require (__dirname + '/../server/database.js');

// =============================================================================
// Get all keywords
// =============================================================================
exports.getAllKeywords = function (req, res) {

	var query = 'SELECT * FROM keywords';
	
	db.queryDB (query, function (err, rows) {
		if (err) {
			res.statusCode = 499;
			return res.send ('Error 499: ' + err);
		}

		res.statusCode = 200;
		return res.json (rows);
	});

};

// =============================================================================
// Get a specific keyword
// =============================================================================
exports.getKeyword = function (req, res) {
	
	// Verify valid api parameters
	if (req.params.keyword === '') {
		res.statusCode = 401;
		return res.send ('Error 401: Keyword must not be null');
	}

	var keyword = req.params.keyword;
	var query = 'SELECT * FROM keywords WHERE name = "' + keyword + '"';

	db.queryDB (query, function (err, rows) {
		if (err) {
			res.statusCode = 499;
			return res.send ('Error 499: ' + err);
		}

		if (rows.length === 0) {
			res.statusCode = 404;
			return res.json (null);
		}

		res.statusCode = 200;
		return res.json (rows[0]);
	});
};

// =============================================================================
// Add a keyword
// ============================================================================
exports.addKeyword = function (req, res) {

	if (req.params.keyword === '') {
		res.statusCode = 401;
		return res.send ('Error 401: Keyword must not be null');
	}

	var keyword = req.params.keyword;
	var query =	'INSERT INTO keywords (name, popularity) ' +
			'VALUES ("' + keyword + '", 0)' + 
			'ON DUPLICATE KEY UPDATE name = name';
	
	db.queryDB (query, function (err, result) {
		if (err) {
			res.statusCode = 499;
			return res.send ('Error 499: ' + err);
		}

		res.statusCode = 201;
		return res.json (true);
	});			

};

