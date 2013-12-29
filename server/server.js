var express = require ('express');
var app = express ();

// Routes
var users = require (__dirname + '/../routes/users');
var search = require (__dirname + '/../server/search');

// Config
//app.set ('view engine', 'jade');
//app.set ('views', __dirname + '/../views/');
app.use (express.static (__dirname + '/../public/'));
app.use (express.bodyParser ());

// Main page
app.get ('/', function (req, res) {
	res.render('index', null);
});

// API Routing
app.get ('/api/users/:userID/', users.getUser);
app.post ('/api/users', users.addUser);
app.get ('/api/users/:userID/primaryKeywords', users.getPrimaryKeywords);
app.get ('/api/users/:userID/secondaryKeywords', users.getSecondaryKeywords);
app.del ('/api/users/:userID/primaryKeywords/:keyword', users.removePrimaryKeyword);
app.put ('/api/users/:userID/primaryKeywords/:keyword', users.addPrimaryKeyword);
app.get ('/api/users/:userID/articles', users.getArticles);

/*
app.get('/dashboard', dash.main);
app.post('/dashboard', dash.post);
app.get('/search', search.execute);
*/

// Start app
app.listen (3000);

