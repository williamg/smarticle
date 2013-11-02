var express = require ('express');
var app = express ();

// Routes
var dash = require (__dirname + '/../routes/dashboard');

// Config
app.set ('view engine', 'jade');
app.set ('views', __dirname + '/../views/');
app.use (express.static (__dirname + '/../public/'));
app.use (express.bodyParser ());

// Main page
app.get ('/', function (req, res) {
	res.render('index', null);
});

// Routing
app.get('/dashboard', dash.main);
app.post('/dashboard', dash.post);

// Start app
app.listen (3000);

