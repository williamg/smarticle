var request = require ('request');
var url = require ('url');
var db = require (__dirname + '/../server/database.js');
var async = require ('async');

function getTableName (req) {
  // Determine if it's primary or secondary
  var pathname = url.parse (req.url).pathname;
  pathname = pathname.split('/'); 
  var tableName = pathname[4];
  return tableName;
}

// =============================================================================
// Get a user's keywords
// =============================================================================
exports.getUserKeywords = function (req, res) {
	
  // Verify valid api parameters
  if (req.params.userID < 0) {
    res.statusCode = 400;
    return res.send ('Invalid userID.');
  }

  var tableName = getTableName (req);

  var userID = req.params.userID;
  var query =	'SELECT DISTINCT *  FROM ' + tableName +
		' INNER JOIN keywords ON keywords.id = ' +
                tableName + '.keyID ' +
		'WHERE ' + tableName + '.userID = ' + userID;

  db.queryDB (query, function (err, rows) {
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }			
    
    return res.json (rows);
  });
};

// =============================================================================
// Remove a user's keyword
// =============================================================================
exports.removeUserKeyword = function (req, res) {

  // Verify valid api parameters  
  if (req.params.userID < 0) {
    res.statusCode = 400;
    return res.send ('Invalid userID');
  }

  if (req.params.keyword === '') {
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  // Determine if it's primary or secondary
  var tableName = getTableName (req);
  var userID = req.params.userID;
  var keyword = req.params.keyword;		
  var query = 'DELETE ' + tableName + ' FROM ' + tableName  +
              ' INNER JOIN keywords ON keywords.id = ' + tableName + '.keyID ' + 
              'WHERE ' + tableName + '.userID = ' + userID + ' ' +
              'AND keywords.name = "' + keyword + '"';	

  db.queryDB (query, function (err) {
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }

    return res.json (true);
  });
};

// =============================================================================
// Add a keyword to a user
// =============================================================================
exports.addKeywordToUser = function (req, res) {

  if (req.params.userID < 0) {
    res.statusCode = 400;
    return res.send ('Invalid userID');
  }

  if (req.params.keyword === '') {
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  // Determine if it's primary or secondary
  var tableName = getTableName (req);
  var userID = req.params.userID;
	
  // TODO: Sanitize keyword
  var keyword = req.params.keyword;
		
  async.series ([
    function (callback) {
      addKeyword (keyword, function (err) {
        return callback (err);
      });        
    },
    function (callback) {
      assignToUser (userID, keyword, tableName, callback);
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

function assignToUser (userID, keyword, tableName,  callback) {
  var query = 'INSERT INTO ' + tableName + ' (userID, keyID) ' +
              'SELECT ' + userID + ', id ' +
              'FROM keywords WHERE name = "' + keyword + '" ' + 
              'ON DUPLICATE KEY UPDATE userID=userID';
			
  db.queryDB (query, function (err, result) {
    
    if (err) {
      callback(err);
      return;
    }

    // Connection successful.
    callback(null);
  });	
}

function addKeyword (keyword, callback) {

  // Verify Valid api parameters
  if (keyword === '') {
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  var query = 'INSERT INTO keywords (name, popularity) ' +
              'VALUES ("' + keyword + '", 0)' + 
              'ON DUPLICATE KEY UPDATE name = name';
	
  db.queryDB (query, function (err, result) {
    return callback (err);
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
