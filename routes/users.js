var request = require ('request');
var db = require (__dirname + '/../server/database.js');
var async = require ('async');

// =============================================================================
// Retrieve basic info about a user
// =============================================================================
exports.getUser = function (req, res) {

};

// =============================================================================
// Get a user's primary keywords
// =============================================================================
exports.getPrimaryKeywords = function (req, res) {
	
  // Verify valid api parameters
  if (req.params.userID < 0) {
    res.statusCode = 400;
    return res.send ('Invalid userID.');
  }

  var userID = req.params.userID;
  var query =	'SELECT DISTINCT keywords.name FROM userKey ' +
		'INNER JOIN keywords ON keywords.id = userKey.keyID ' +
		'WHERE userKey.primary = 1 AND userKey.userID = ' + userID;

  db.queryDB (query, function (err, rows) {
    if (err) {
      res.statusCode = 500;
      return res.send (err);
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
    return res.send ('Invalid userID.');
  }

  var userID = req.params.userID;
  var query =	'SELECT DISTINCT keywords.name FROM userKey ' +
		'INNER JOIN keywords ON keywords.id = userKey.keyID ' +
		'WHERE userKey.primary = 0 AND userKey.userID = ' + userID;

  db.queryDB (query, function (err, rows) {
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }
			
    return res.json (rows);
  });
};

// =============================================================================
// Remove a user's primary keyword
// =============================================================================
exports.removePrimaryKeyword = function (req, res) {

  // Verify valid api parameters  
  if (req.params.userID < 0) {
    res.statusCode = 400;
    return res.send ('Invalid userID');
  }

  if (req.params.keyword === '') {
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  var userID = req.params.userID;
  var keyword = req.params.keyword;		
  var query = 'DELETE userKey FROM userKey INNER JOIN keywords ' + 
              'ON keywords.id = userKey.keyID ' + 
              'WHERE userKey.userID = ' + userID + ' ' +
              'AND keywords.name = "' + keyword + '" ' +
              'AND userKey.primary = 1';		

  db.queryDB (query, function (err) {
    if (err) {
      res.statusCode = 500;
      return res.send (err);
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
    return res.send ('Invalid userID');
  }

  if (req.params.keyword === '') {
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  var userID = req.params.userID;
	
  // TODO: Sanitize keyword
  var keyword = req.params.keyword;
		
  async.series ([
    function (callback) {
      var addKey = 'http://127.0.0.1:3000/api/keywords/' + keyword;
      
      request.put (addKey, function (err, res2, body) {
	body = JSON.parse (body);
	
        if (res2.statusCode != 200) {
          return callback (body, null);
	}

	return callback (null);
      });	
    },
    function (callback) {
      makePrimaryKeyword (userID, keyword, callback);
    }
  ],
  function (err) {
    
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }

    return res.json (true);
  });
};

function makePrimaryKeyword (userID, keyword, callback) {
  var query = 'INSERT INTO userKey (userID, keyID, `primary`) ' +
              'SELECT ' + userID + ', id, 1 ' +
              'FROM keywords WHERE name = "' + keyword + '" ' + 
              'ON DUPLICATE KEY UPDATE userKey.primary = 1';	
			
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

  // Verify valid api parameters  
  if (req.params.userID < 0) {
    res.status = 400;
    return res.send ("Error 400: Invalid userID");
  }

  var query = 'SELECT DISTINCT articles.title, articles.url FROM userKey ' +
              'INNER JOIN keyArt ON userKey.keyID = keyArt.keyID ' +
              'INNER JOIN articles ON keyArt.artID = articles.id ' +
              'WHERE userKey.userID = ' +  userID;
	
  db.queryDB (query, function (err, rows) {
    
    if (err) {
      res.status = 499;
      return res.send ("Error 499: " + err);
    }
	
    return res.json (rows);	
  });
};
