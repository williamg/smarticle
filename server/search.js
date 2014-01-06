var request	= require ('request');
var string	= require ('string');
var keyExtract	= require (__dirname + '/../server/keywordExtractor');
var db		= require (__dirname + '/../server/database');
var async	= require ('async');

exports.execute = function (req, res) {

  var keywords = [];

  async.series ([
    function (callback) {
      console.log ('Getting keywords...');
      var getKeywords = 'http://127.0.0.1:3000/api/keywords';
      
      request.get (getKeywords, function (err, res, body) {
	keywords = JSON.parse (body);
	return callback (null);
      });		
    },
    function (callback) {
      async.times (keywords.length, function (n, next) {
	handleArticles (keywords[n].name, function (err) {
          next (err);
	});
      }, function (err) {
        return callback (err);
      });	
    }
  ],
  function (err) {

    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }
			
    console.log ('Done!');
    return true;
  });
};

function handleArticles (keyword, callback) {
  console.log ('Getting articles for "' + keyword + '"...');

  var key =     'YgDPn7G04OM8CF3gbkBtfj4xLCAmBWvWy8xhdu1l108';	
  var top =     5;
  var search =  'https://user:' + key + '@api.datamarket.azure.com' + 
		'/Bing/Search/v1/Composite?Sources=%27news%27&Query=' + 
		'%27' + keyword  + '%27&Market=%27es-US%27&$format=JSON';

  request (search, function (err, res, body) {

    if (err) return callback (err);
		
    body = JSON.parse(body);	

    for (var i = 0; i < top; i++) {
      console.log ('Parsing articles...');
      var url = body.d.results[0].News[i].Url;
      
      parseArticle (url, keyword, saveArticle);
    }

    return callback (null);
  });
}

function parseArticle (url, keyword, callback) {
  var readbilityToken =   'cc589a05ab905a7d8d78ef900a3bb8cf59b8442d'; 
  var readbilityRequest = 'https://www.readability.com/api/content/v1/' +
                          'parser?url=' + url + '&token=' + readbilityToken;

  request (readbilityRequest, function (err, res, body) { 
    body = JSON.parse (body);
    body.title = string (body.title).stripTags ();
    body.title = string (body.title.s).decodeHTMLEntities ();
    body.content = string (body.content).stripTags ();
    body.content = string (body.content.s).decodeHTMLEntities ();

    var wordCount = body.word_count;
    var title = body.title.s;
    var site = body.domain;
    var url = body.url;
    var date = body.date_published;
		
    if (!date) {
      date = (new Date ()).toUTCString ();
    }
    
    var bodyKeywords = keyExtract.extract(body.content.s);	
    var article = {
      "title":        title,	
      "bodyKeywords": bodyKeywords,
      "site":         site,
      "url":          url,
      "wordCount":    wordCount,
      "date":         date,
      "keyword":      keyword
    };
	
      return callback (article);	
  });
}

function saveArticle (article) {
  console.log ('Saving article...');
  article.title = db.escape (article.title);

  var artQuery =  'INSERT INTO articles (title, date, url) VALUES ' +
                  '("' + article.title + '", "' + article.date + '", "' +
                  article.url + '")';
  var keywordReq = 'http://127.0.0.1:3000/api/keywords/' + article.keyword;
  var keyID = 0;
  var artID = 0;

  async.series ([
    function (callback) {
      request.put (keywordReq, function (err, res, body) {				
	body = JSON.parse (body);
	
        if (res.statusCode != 200) {
           return callback (body, null);
	}

	return callback (null);
      });
    },
    function (callback) {
      request.get (keywordReq, function (err, res, body) {
        body = JSON.parse (body);
	
        if (res.statusCode != 200) {
          return callback (body, null);
        }

	keyID = body.id;			
	return callback (null);
      });
    },
    function (callback) {
      db.queryDB (artQuery, function (err, rows) {

        if (err) {
          return callback (err);
        }

        artID = rows.insertId;
        return callback (null);
      });
    },
    function (callback) {
      var artKeyQuery =	'INSERT INTO keyArt (keyID, artID) ' + 
                        'VALUES ("' + keyID + '", "' + artID + '")';

      db.queryDB (artKeyQuery, function (err, rows) {

        if (err) {
          return callback (err);
	}

	return callback (null);
      });
    },
    function (callback) {
      var words = article.bodyKeywords;
      insertWords (words, artID, function (err) {
        return callback (err);
      }); 
    }
  ], 
  function (err) {
    if (err) {
      console.log (err);	
    }

    return;
  });
}

function insertWords (words, artID, callback) {
  async.times (words.length, function (n, next) {
    var term =  db.escape (words[n].term);
    var count = words[n].tf;
    var query = 'INSERT INTO words (word, artID, count) ' +
                'VALUES ("' + term + '", "' + artID + '", "' + count + '")"';

    db.queryDB (query, function (err, rows) {
      return next (err);
    });
  },
  function (err) {
    return callback (err);
  });
}
