var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const alphavantage = require("./lib/alphavantage.js");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// Keep a global list of all symbols users have asked for.
// Format: {symbol: symbol, data: body}
var symbolList = [];


////////////////////////////////////////////////////////////////////////////////
//  Socket IO message routing
//
//  REFERENCE:
//  https://socket.io/get-started/chat/
////////////////////////////////////////////////////////////////////////////////
io.on('connect', function(socket){
  
  // console.log('user connected');
  socket.emit("curentstocks", JSON.stringify(symbolList));
  
  socket.on("disconnect", function() {
      // console.log("user disconnected");
  });
  
  socket.on("addstock", function(symbol) {
    
    // console.log("Received addstock: " + symbol);
    
    if (!symbol){
      // console.log("Ignoring null symbol");
      return;
    }
    
    alphavantage.timeSeriesDaily(symbol, function (error, data) {
      
      if (error) {
        // console.log("alphavantage Error: " + error);
        io.emit("stocknotfound", error);
        return;
      };
      
      if (data.data["Error Message"]) {
        // console.log("alphavantage Stock not found: " + data["Error Message"]);
        io.emit("stocknotfound", JSON.stringify(data));
        return;
      }
      
      var foundSymbol = symbolList.find( element => {
        return element.symbol == symbol;
      });
      
      if (!foundSymbol) {
        symbolList.push(data);
        io.emit("addstock", JSON.stringify(data));
      }
      else {
        // console.log("Symbol found already:" + symbol);
      }
      
    });
  });
  
  socket.on("removestock", function(symbol) {
    
    // console.log("Received removestock: " + symbol);

    var foundSymbol = symbolList.find( element => {
      return element.symbol == symbol;
    });
    
    if (foundSymbol) {
      symbolList = symbolList.filter( (s) => {if (s.symbol != symbol) return true;});
      io.emit("removestock", symbol);
    }
  });
  
  
});


////////////////////////////////////////////////////////////////////////////////
//
// listen for requests
//
// We call http.listen(), not app.listen! This allows socket.io to intercept
// the requests it wants.
////////////////////////////////////////////////////////////////////////////////
var listener = http.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
