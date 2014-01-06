// Stripped down/cleaned up version of "Gramophone" by "bxjx" on GitHub
// https://github.com/bxjx/gramophone
var _ = require ('lodash');
var natural = require ('natural');
var util = require ('util');
var stopWords = require (__dirname + '/../stopwords.json');


// =============================================================================
// Keyword Detection
// =============================================================================
exports.extract = function (text) {
  var results = [];
  var keywords = {};
  var combined, combinedResults = {};
	
  // Defaults
  var options = {};
  options.ngrams = [1, 2, 3];
  options.cutoff = 0.5;
  options.min = 2;

  // Loop through each ngram (1, 2, 3)	
  _.each (options.ngrams, function(ngram) {

    // Tokenize the text
    var tokenRegex = /[^a-zA-z'’0-9]/;
    var tokenizer = new natural.RegexpTokenizer ({ pattern: tokenRegex });
    var tokens = tokenizer.tokenize (text);	

    // Combine each array of tokens to a single string
    tokens = _.map (natural.NGrams.ngrams (tokens, ngram), function (ngram) {
      return ngram.join (' ').toLowerCase ();
    });	

    // Sort the keywords by frequency and eliminate blacklisted words		
    var keywordsForNgram;
    var tf = new Tf ();

    tf.addDocument (tokens);
    keywordsForNgram = tf.listMostFrequentTerms (0);
    keywordsForNgram = _.select (keywordsForNgram, function (item) {
      return usePhrase (item.term, options);
    });
			
    // Add to any existing keywords
    results = results.concat (keywordsForNgram);
  });

  // Combine all the results
  _.each (results, function (result) {
    combinedResults[result.term] = result.tf;
  });

  // Filter redundant/duplicate keywords
  combined = exports.combine (combinedResults, options.cutoff);

  // Fancy mumbo-jumbo
  combined = _.chain (combined)
              .pairs ()
              .sortBy (_.last)
              .reverse ()
              .map (function (combination) { 
		return {
                  term: combination[0], 
                tf: combination[1] 
		};
              })
              .value();

  combined = _.select (combined, function (result) {
    return result.tf > options.min;
  });

  // Return the keywords
  return combined;
};

/* Copy-pasta from original Gramophone docs:
*  Attempt to combine the results for different ngrams in order to work out
*  whether we should use "national broadband network", rather than "national
*  broadband" and "broadband network". In this example with a cutoff of .2,
*  if the longer phrase (ngram of 3) was used 20 times, and "broadband network"
*  was used 22 times (within the cutoff of 20 * 0.2), then it would be removed
*  from the results. If "national broadband" was used more than the cutoff,
*  e.g. 30 times, it would be left in the results. */
exports.combine = function (phrases, cutoff) {
  var combined = _.clone (phrases);

  _.each (_.keys (phrases), function (phrase) {

    // Looking for overlap with "smaller" ngrams
    var ngramToTry = phrase.split (' ').length - 1;
		
    // Can't have a 0-gram
    if (ngramToTry < 1) return;

    _.each (natural.NGrams.ngrams (phrase, ngramToTry), function (ngram) {
      var subPhrase = ngram.join (' ');

      if (!phrases[subPhrase]) return;

      var ratio = phrases[phrase] / phrases[subPhrase];
      
      if (ratio  >= (1 - cutoff)) {
	delete combined[subPhrase];
      }
    });
  });

  return combined;
};

// =============================================================================
// Extended term-scoring class
// =============================================================================
var Tf = function () {
  natural.TfIdf.call (this);
};

util.inherits (Tf, natural.TfIdf);

Tf.prototype.listMostFrequentTerms = function (d) {
  var terms = [];
  
  for (var term in this.documents[d]) {
    terms.push ({
      term: term, 
      tf:natural.TfIdf.tf (term, this.documents[d])
    });
  }

  return terms.sort (function (x, y) {return y.td - x.tf; });
};

// =============================================================================
// Helper functions
// =============================================================================
function blacklisted (term) {

  if (term.match(/^\d+$/) || term.match (/^_/)) {
    return true;
  }

  return _.indexOf(stopWords, term) !== -1;
}

function usePhrase (phrase, options) {	

  return !_.detect (phrase.split (' '), function (term) {
    return blacklisted (term);
  });
}
