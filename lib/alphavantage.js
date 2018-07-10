// https://www.alphavantage.co/documentation/
const request = require("request");

// Internal caching of requests
// TODO: Need a timeout to flush the cache
// Format: {symbol: symbol, data: body}
var timeSeriesDailyData = [];


////////////////////////////////////////////////////////////////////////////////////
//
//  Retrieves the last 100 days.
//  Returns an object with the data.
//
////////////////////////////////////////////////////////////////////////////////////
exports.timeSeriesDaily = function (symbol, callback) {
  
  var foundSymbol = timeSeriesDailyData.find( element => {
    return element.symbol == symbol;
  });
  
  if (foundSymbol) {
    // console.log("Using cached value of " + symbol);
    callback(null, foundSymbol);
  }
  else {
    // console.log("Querying AlphaVantage for " + symbol);
    
    var url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY"
            + "&datatype=json" 
            + "&symbol=" + symbol
            //+ "&outputsize=full"
            + "&outputsize=compact"
            + "&apikey=" + process.env.ALPHA_VANTAGE_KEY;

    request.get( {url: url },
      function(error, response, body){
        var data = {symbol: symbol, data: JSON.parse(body)};
        timeSeriesDailyData.push(data);
        callback(error, data);
    });
  }
  
};

