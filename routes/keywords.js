var db = require (__dirname + '/../server/database.js');

// =============================================================================
// Get all keywords
// =============================================================================
exports.getAllKeywords = function (req, res) {
  var query = 'SELECT * FROM keywords';
	
  db.queryDB (query, function (err, rows) {
    
    if (err) {
       res.statusCode = 500;
      return res.send (err);
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
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  var keyword = req.params.keyword;
  var query = 'SELECT * FROM keywords WHERE name = "' + keyword + '"';

  db.queryDB (query, function (err, rows) {
    
    if (err) {
      res.statusCode = 500;
      return res.send (err);
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

  // Verify Valid api parameters
  if (req.params.keyword === '') {
    res.statusCode = 400;
    return res.send ('Keyword must not be null');
  }

  var keyword = req.params.keyword;
  var query = 'INSERT INTO keywords (name, popularity) ' +
              'VALUES ("' + keyword + '", 0)' + 
              'ON DUPLICATE KEY UPDATE name = name';
	
  db.queryDB (query, function (err, result) {
      
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }

    res.statusCode = 200;
    return res.json (true);
  });			
};
