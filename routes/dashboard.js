var db = require (__dirname + '/../server/database.js');

exports.main = function (req, res) {

	db.getArticles (1, function(articles) {
		res.render ('dashboard', {articles:articles});	
	});
};
