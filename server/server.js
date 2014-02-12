// =============================================================================
// Config 
// =============================================================================
var express = require ('express');
var app = express ();

app.use (express.static (__dirname + '/../public/'));
app.use (express.bodyParser ());

// =============================================================================
// API Routing
// =============================================================================

// -----------------------------------------------------------------------------
// User data
// ----------------------------------------------------------------------------
var users = require (__dirname + '/../routes/users');

// Get a user's primary keywords
app.get ('/api/users/:userID/primaryKeywords', users.getUserKeywords);

// Get a user's secondary keywords
app.get ('/api/users/:userID/secondaryKeywords', users.getUserKeywords);

// Remove a user's primary keyword
app.del ('/api/users/:userID/primaryKeywords/:keyword',
	users.removeUserKeyword);

app.del ('/api/users/:userID/secondaryKeywords/:keyword',
	users.removeUserKeyword);

// Add a new primary keyword to a user
app.put ('/api/users/:userID/primaryKeywords/:keyword',
	users.addKeywordToUser);

app.put ('/api/users/:userID/secondaryKeywords/:keyword',
        users.addKeywordToUser);

// Get a user's suggested articles
app.get ('/api/users/:userID/articles', users.getArticles);


// -----------------------------------------------------------------------------
// Keyword  data
// ----------------------------------------------------------------------------
var keywords = require (__dirname + '/../routes/keywords');

// Get all keywords
app.get ('/api/keywords', keywords.getAllKeywords);

// Get a specific keyword
app.get ('/api/keywords/:keyword', keywords.getKeyword);

// =============================================================================
// Server Tasks
// =============================================================================
var search = require (__dirname + '/../server/search.js');
app.get ('/search', search.execute);

var score = require (__dirname + '/../server/score.js');
app.get ('/score', score.scoreArticles);
app.listen (3000);
