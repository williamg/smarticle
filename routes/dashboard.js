var db = require (__dirname + '/../server/database.js');

exports.main = function (req, res) {
	renderDashboard (req, res);
};

exports.post = function (req, res) {
	
	var category = req.body.category;
	var action = req.body.action;
	var user = req.body.userID;

	if (action == 'add') return db.addCategory (category, user, res.redirect ('/dashboard'));
	else return db.removeCategory (category, user, res.redirect ('/dashboard'));
};

function renderDashboard (req, res) {
	db.getArticles (1, function(articles) {
		db.getCategories (1, function (categories) {
			res.render ('dashboard', {data:{articles:articles, categories:categories}});
		});	
	});
}
