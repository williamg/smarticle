var express = require ('express');
var app = express ();

// Routes
var dash = require (__dirname + '/../routes/dashboard');

// Config
app.set ('view engine', 'jade');
app.set ('views', __dirname + '/../views/');
app.use (express.static(__dirname + '/../public/'));

// Main page
app.get ('/', function (req, res) {
	res.render('index', null);
});

// Routing
app.get('/dashboard', dash.main);

// Start app
app.listen (3000);

