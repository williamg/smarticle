var request	= require ('request');
var string	= require ('string');
var keyExtract	= require (__dirname + '/../server/keywordExtractor');
var db		= require (__dirname + '/../server/database');
var async	= require ('async');

// =============================================================================
// Article Search
// ============================================================================
exports.execute = function (req, res) {

  getKeywords (function (err, keywords) {
    
    // Exit immediately if keywords can't be retrieved
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }

    handleKeywords (keywords, function (urlErrors, articleErrors) {
      
      // TODO: Better error handling
      if (urlErrors.length === 0 && articleErrors.length === 0) {
        res.statusCode = 200;
        return res.send ("Success!");
      }

      res.statusCode = 500;
      var errors = {};

      if (urlErrors.length > 0) errors.urlErrors = urlErrors;
      if (articleErrors.length > 0) errors.articleErrors = articleErrors;

      return res.json (errors);   
    });
  });
};

function getKeywords (callback) {
  var keyReq = 'http://127.0.0.1:3000/api/keywords';
  
  request.get (keyReq, function (err, res, body) {
    
    if (err) return callback (err);

    // Keywords are returned as an array
    var keywords = JSON.parse (body);
    return callback (null, keywords); 
  });
}

function handleKeywords (keywords, callback) {
 
  // Collect errors retrieving URLs and articles
  var urlErrors = [];
  var articleErrors = [];

  // Handle the articles for each keyword
  async.times (keywords.length, function (n, nextKey) {
    var keyword = keywords[n].name;  

     // Get the URLs
    getURLs (keyword, 5, function (err, urls) {

    // If a URL request fails, move on to the next keyword
      if (err) {
        urlErrors.push ({
          "keyword": keyword,
          "error": err
        });
        return nextKey (null);
      }

      // Handle the requested URLs
      handleURLs (keyword, urls, function (errors) {
        articleErrors = articleErrors.concat (errors);
        return nextKey (null);
      });
    });
  },
  function (err) {
    return callback (urlErrors, articleErrors);
  });
}

function getURLs (keyword, amount, callback) { 
  var key =     'YgDPn7G04OM8CF3gbkBtfj4xLCAmBWvWy8xhdu1l108';	
  var search =  'https://user:' + key + '@api.datamarket.azure.com' + 
		'/Bing/Search/v1/Composite?Sources=%27news%27&Query=' + 
		'%27' + keyword  + '%27&Market=%27es-US%27&$format=JSON';

  request.get (search, function (err, res, body) {

    if (err) return callback (err);
		
    // TODO: Handle statusCodes other than 200
    body = JSON.parse(body);	
    var urls = [];

    for (var i = 0; i < amount; i++) {
      urls.push (body.d.results[0].News[i].Url);
    }

    return callback (null, urls);
  });
}

function handleURLs (keyword, urls, callback) {
  var errors = [];

  // Handle the article at each URL
  async.times (urls.length, function (n, nextUrl) {
    var url = urls[n];

    handleArticle (url, keyword, function (err) {

      // If there is an error parsing the article, move on to the next URL
      if (err) errors.push ({
        "url": url,
        "error": err
      });

      return nextUrl (null);
    });
  }, 
  function (err) {
     return callback (errors);     
  });
}

// =============================================================================
// Storing article
// =============================================================================
function handleArticle (url, keyword, callback) {
  parseArticle (url, keyword, function (err, article) {
    if (err) return callback (err);

    saveArticle (article, function (err2) {
      return callback (err2);
    });
  });
}

function parseArticle (url, keyword, callback) {
  var readbilityToken =   'cc589a05ab905a7d8d78ef900a3bb8cf59b8442d'; 
  var readbilityRequest = 'https://www.readability.com/api/content/v1/' +
                          'parser?url=' + url + '&token=' + readbilityToken;
 
  request (readbilityRequest, function (err, res, body) { 
    if (err)  return callback (err);
    
    body = JSON.parse (body); 
    
    if (res.statusCode != 200) {
      return callback (body.messages);
    }

    body.title = string (body.title).stripTags ();
    body.title = string (body.title.s).decodeHTMLEntities ();
    body.content = string (body.content).stripTags ();
    body.content = string (body.content.s).decodeHTMLEntities ();

    var wordCount = body.word_count;
    var title = body.title.s;
    var site = body.domain; 
    var date = body.date_published;

    // TODO: Fix this...something isn't working    
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
	
    return callback (null, article);	
  });
}

function saveArticle (article, callback2) {
  var keyID = 0;
  var artID = 0;

  async.series ([
    function (callback) {
      getKeyID (article.keyword, function (err, id) {
        if (err) return callback (err);

        keyID = id;
        return callback (null);
      });
    },
    function (callback) {
      insertArticle (article, function (err, id) {
        if (err) return callback (err);

        artID = id;
        return callback (null);
      });
    },
    function (callback) {
      linkKeyArt (keyID, artID, callback);
    },
    function (callback) {
      var words = article.bodyKeywords;
      insertWords (words, artID, callback);
    }
  ], 
  function (err) {
    return callback2 (err);
  });
}

function getKeyID (keyword, callback) {
  var keywordReq = 'http://127.0.0.1:3000/api/keywords/' + keyword;

  request.get (keywordReq, function (err, res, body) {
    if (err) return callback (err);

    body = JSON.parse (body);
	
    if (res.statusCode != 200) return callback (body);	
    return callback (null, body.id);
  });
}

function insertArticle (article, callback) {
  article.title = db.escape (article.title);
  var artQuery =  'INSERT INTO articles (title, date, url, wordcount, site) ' +
                  'VALUES ("' + article.title + '", "' + article.date + '", "' +
                  article.url + '", "' + article.wordCount + '", "' + 
                  article.site + '")';

  db.queryDB (artQuery, function (err, rows) {
    if (err)  return callback (err);
    return callback (null, rows.insertId);
  });
}

function linkKeyArt (keyID, artID, callback) {
  var artKeyQuery = 'INSERT INTO keyArt (keyID, artID) ' + 
                    'VALUES ("' + keyID + '", "' + artID + '")';

  db.queryDB (artKeyQuery, function (err, rows) {
    if (err) return callback (err);
    return callback (null);
  });
}

function insertWords (words, artID, callback) {
  async.times (words.length, function (n, next) {
    var term =  db.escape (words[n].term);
    var count = words[n].tf;
    var query = 'INSERT INTO words (word, artID, count) ' +
                'VALUES ("' + term + '", "' + artID + '", "' + count + '")';

    db.queryDB (query, function (err, rows) {
      return next (err);
    });
  },
  function (err) {
    return callback (err);
  });
}
