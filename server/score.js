var db = require (__dirname + '/../server/database.js');
var request = require ('request');
var async = require ('async');
var nat = require ('natural');

exports.scoreArticles = function (req, res) {
  getUsers (function (err, users) {
  
    if (err) {
      res.statusCode = 500;
      return res.send (err);
    }

    var errArray = [];

    // Loop through each user
    async.times (users.length, function (n, nextKey) {
      var userID = users[n].id;

      handleUser (userID, function (err) {
        if (err) errArray.push (err);
        return nextKey (null);
      });
    },
    function (err) {
      
      if (errArray.length !== 0) {
        res.statusCode = 500;
        return res.json (errArray);
      }

      res.statusCode = 200;
      return res.json (true);
    });
  });
};

function getUsers (callback) {
  var query = 'SELECT id FROM users';

  db.queryDB (query, function (err, rows) {
    
    if (err) return callback (err);
    return callback (null, rows);
  });
}

function handleUser (userID, callback) {
  // Collect user data
  async.parallel ([
    function (callback) {
      getPrimaryKeywords (userID, callback);
    },
    function (callback) {
      getSecondaryKeywords(userID, callback);
    },
    function (callback) {
      getArticles (userID, callback);
    },
  ],
  function (err, results) {

    if (err) {
      errArray.push (err);
      return callback (err);
    }
    
    var primaryKeys = (results[0]) ? results[0] : [];
    var secondaryKeys = (results[1]) ? results[1] : [];
    var articles = (results[2]) ? results[2] : [];
    var artData = calcArtData (articles);

    // Loop through each article
    async.times (articles.length, function (n, nextKey) { 

      // Skip an article that the user has already rated
      if(articles[n].userScore !== null) return nextKey (null);

      articles[n] = scoreArticle (articles[n], artData, primaryKeys, secondaryKeys);

      saveScore (articles[n], userID, function (err) {
        return nextKey (null);
      });
    },
    function (err) {
      return callback (err);
    });
  });
}

function getPrimaryKeywords (userID, callback) {
  var primaryReq =  'http://127.0.0.1:3000/api/users/' + userID +
                    '/primaryKeywords'; 
  request.get (primaryReq, function (err, res, body) {
    body = JSON.parse (body);

    if (err) return callback (err);
    if (res.statusCode != 200) return callback (body);
    return callback (null, body);
  });
}

function getSecondaryKeywords (userID, callback) {
   var secondaryReq =  'http://127.0.0.1:3000/api/users/' + userID +
                       '/secondaryKeywords';

    request.get (secondaryReq, function (err, res, body) {
      body = JSON.parse (body);

      if (err) return callback (err);
      if (res.statusCode != 200) return callback (body);
      return callback (null, body);
    });
}

function getArticles (userID, callback) {
  var query = 'SELECT articles.*, userArt.*, ' + 
              'GROUP_CONCAT(words.word) as bodyText, ' + 
              'GROUP_CONCAT(words.count) as frequencies ' +
              'FROM articles ' + 
              'INNER JOIN keyArt ON keyArt.artID = articles.id ' +
              'INNER JOIN primaryKeywords ' + 
              'ON primaryKeywords.keyID = keyArt.keyID ' +
              'INNER JOIN words ON words.artID = articles.id ' +
              'LEFT JOIN userArt ON userArt.artID = articles.id ' +
              'WHERE primaryKeywords.userID = ' + userID + ' ' +
              'GROUP BY words.artID';

  db.queryDB (query, function (err, rows) {

    if (err) return callback (err);
    return callback (null, rows);
  });
}

function calcArtData (articles) {
  
  var artData = {};
  artData.siteCounts = [{}, {}];
  artData.bodyScoreAvg = [0, 0];
  artData.titleScoreAvg = [0, 0];
  artData.wordCountAvg = [0, 0];
  artData.bodyScoreVar = [0, 0];
  artData.titleScoreVar = [0, 0];
  artData.wordCountVar = [0, 0];
  artData.count = [0, 0];

  var art, index;

  for (var k = 0; k < articles.length; k++) {
    art = articles[k];
    if (art.userScore == 1) artData.count[0]++;
    if (art.userScore == -1) artData.count[1]++;
  }

  for (var i = 0; i < articles.length; i++) {
    art = articles[i];
    if (art.userScore === null) continue;
    index = (art.userScore == 1) ? 0 : 1;
    
    if (artData.siteCounts[index][art.site]) artData.siteCounts[index][art.site]++;
    else artData.siteCounts[index][art.site] = 1;

    artData.bodyScoreAvg[index] += art.bodyKeyScore / artData.count[index];
    artData.titleScoreAvg[index] += art.titleKeyScore / artData.count[index];
    artData.wordCountAvg[index] += art.wordcount / artData.count[index];
  }

  for (var j = 0; j < articles.length; j++) {
    art = articles[j];
    if (art.userScore === null) continue;
    index = (art.userScore == 1) ? 0 : 1;

    var bodyScoreDif = art.bodyKeyScore - artData.bodyScoreAvg[index];
    var titleScoreDif = art.titleKeyScore - artData.titleScoreAvg[index];
    var wordCountDif = art.wordCount - artData.wordCountAvg[index];
    var count = artData.count[index];

    artData.bodyScoreVar[index] += Math.pow (bodyScoreDif, 2) / (count-1);
    artData.titleScoreVar[index] += Math.pow (titleScoreDif, 2) / (count-1);
    artData.wordCountVar[index] += Math.pow (wordCountDif,  2) / (count-1);
  }
  
  return artData;
}

// =============================================================================
// Score an article for a user
// =============================================================================
function scoreArticle (article, artData, primaryKeys, secondaryKeys) {

  console.log (JSON.stringify (article, null, 4)); 

  var score = [0, 0];
  var ts = 0;
  var bs = 0;

  for (var i = 0; i < 2; i++) {

    if (article.titleKeyScore === null) {
      ts = titleScore (article.title, primaryKeys, secondaryKeys);
      article.titleKeyScore = ts;
    } else
      ts = article.titleKeyScore;

    if (article.bodyKeyScore === null) {
      bs = bodyScore (article.bodyText, article.frequencies,
            article.wordcount, primaryKeys, secondaryKeys);
      article.bodyKeyScore = bs;
    } else
      bs = article.bodyKeyScore;

    var titleProb = continuousProb (titleScore, artData.titleScoreAvg[i],
                    artData.titleScoreVar[i]);
    var bodyProb =  continuousProb (bodyScore, artData.bodyScoreAvg[i],
                    artData.bodyScoreVar[i]);
    var wordCountProb = continuousProb (article.wordcount,
                        artData.wordCountAvg[i], artData.wordCountVar[i]);
    var siteProb = artData.siteCounts[i][article.site] /
                    (artData.count[i]); 
    var catProb = artData.count[i] / (artData.count[0] + artData.count[1]);

    score[i] = catProb * titleProb * bodyProb * wordCountProb * siteProb;
  }

  if (score[0] > score[1]) article.score = score[0];
  else article.score =  1 - score[1];

  if (isNaN (article.score)) article.score = 0;

  return article;
}

function titleScore (title, primaryKeys, secondaryKeys) {
  
  title = title.split (' ');
  var score = 0;

  for (var i = 0; i < title.length; i++) {
    var word = title[i];

    var pIndex = keyArrayIndexOf (word, primaryKeys);
    var sIndex = keyArrayIndexOf (word, secondaryKeys);

    if (pIndex > -1) score++;
    else if (sIndex > -1) score += secondaryKeys[sIndex].weight; 
  }

  score /= title.length;
  return score;
}

function bodyScore (bodyText, frequencies, wordCnt, primaryKeys, secondaryKeys) {

  bodyText = bodyText.split (',');
  frequencies = frequencies.split (',');
  var score = 0;

  for (var i = 0; i < bodyText.length; i++) {
    var word = bodyText[i];

    var pIndex = keyArrayIndexOf (word, primaryKeys);
    var sIndex = keyArrayIndexOf (word, secondaryKeys);

    if (pIndex > -1) score += frequencies[pIndex];
    else if (sIndex > -1) score += secondaryKeys[sIndex].weight * freq; 
  }

  score /= wordCnt;
  return score;
}

function keyArrayIndexOf (val, array) {
  for (var i = 0; i < array.length; i++) {
   
    val = removePadding (val);
    var arrVal = removePadding (array[i].name);

    arrVal = nat.PorterStemmer.stem (arrVal.toLowerCase ());
    val = nat.PorterStemmer.stem (val.toLowerCase ());

    if (arrVal === val) return i;
  }

  return -1;
}

function removePadding (word) {
  // From beginning
  for (var i = 0; i < word.length; i++) {
      if (word.charAt(i).match(/^[a-z0-9]+$/i)) {
        word = word.substring(i);
        break;
      }
  }

  // From end
  for (var j = word.length-1; j > -1; j--) {
    if (word.charAt(j).match(/^[a-z0-9]+$/i)) {
      word = word.substring(0, j+1);
      break;
    }
  }

  return word;
}

function continuousProb (val, avg, variance) {
  if (variance === 0) return Number(val == avg);
  
  var coef = Math.pow (2 * Math.PI * variance, -0.5);
  var exp = Math.pow (Math.E, -(Math.pow (val-avg, 2) / (2 * variance)));
  return coef * exp;
}

// =============================================================================
// Save an article
// =============================================================================
function saveScore (article, userID, callback) {
  
  var query =   'INSERT INTO userArt (userID, artID, score, bodyKeyScore, ' +
                'titleKeyScore) VALUES (' + userID + ', ' + article.id +
                ', ' + article.score + ', ' + article.bodyKeyScore + ', ' +
                article.titleKeyScore + ') ON DUPLICATE KEY UPDATE score = ' + 
                article.score;

  db.queryDB (query, function (err, result) {
    return callback (err);
  });
}
