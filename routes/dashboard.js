var db = require (__dirname + '/../server/database.js');

exports.main = function (req, res) {
	renderDashboard (req, res);
};

exports.post = function (req, res) {
	
	var category = req.body.category;
	var action = req.body.action;
	var user = req.body.userID;

	if (action == 'add') {
		db.addPrimaryCatToUser (category, user, function (err) {
			if (err) return null;
			return res.redirect ('/dashboard');
		});
	} else {
		db.removePrimaryCatFromUser (category, user, function (err) {
			if (err) return null;
			return res.redirect ('/dashboard');
		});
	}
};

function renderDashboard (req, res) {
	db.getArticles (1, function(err, articles) {
		if (err) {
			console.log ('error retrieving articles');
			articles = [];
		}

		db.getCategories (1, function (err2, categories) {
			if (err2) {
				console.log ('error retrieving categories');
				categories = [];
			}

			res.render ('dashboard', {data:{articles:articles, categories:categories}});
		});	
	});
}
