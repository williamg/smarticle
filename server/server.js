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

// Get data about a specific user
app.get ('/api/users/:userID/', users.getUser);

// Get a user's primary keywords
app.get ('/api/users/:userID/primaryKeywords', users.getPrimaryKeywords);

// Get a user's secondary keywords
app.get ('/api/users/:userID/secondaryKeywords', users.getSecondaryKeywords);

// Remove a user's primary keyword
app.del ('/api/users/:userID/primaryKeywords/:keyword',
	users.removePrimaryKeyword);

// Add a new primary keyword to a user
app.put ('/api/users/:userID/primaryKeywords/:keyword',
	users.addPrimaryKeyword);

// Get a user's suggested articles
app.get ('/api/users/:userID/articles', users.getArticles);


// -----------------------------------------------------------------------------
// Keyword  data
// ----------------------------------------------------------------------------
var keywords = require (__dirname + '/../routes/keywords');

// Get the list of all primary and secondary keywords of all users
app.get ('/api/keywords', keywords.getAllKeywords);

// Get info about a specific keyword
app.get ('/api/keywords/:keyword', keywords.getKeyword);

// Add a keyword
app.put ('/api/keywords/:keyword', keywords.addKeyword);

// =============================================================================
// Server Tasks
// =============================================================================
var search = require (__dirname + '/../server/search.js');
app.get ('/search', search.execute);
app.listen (3000);

