// Make syntax highlighting happy :-)
var ReactDOM;
var React;
var io;
var createChart;

// Connect to the server
var socket = io();

// Track the data from the server
var symbolList = [];

var errorMessage = "";


// Format: error
socket.on("stocknotfound", function(errmsg) {
  errorMessage = JSON.parse(errmsg);
  ReactDOM.render(
    <StockControlUI/>,
    document.getElementById("app")
  );
});


// Format: {symbol: symbol, data: body}
socket.on("addstock", function(stockData) {
  symbolList.push(JSON.parse(stockData));
  createChart(symbolList);
  ReactDOM.render(
    <StockControlUI/>,
    document.getElementById("app")
  );
});


// Format: symbol
socket.on("removestock", function(symbol) {
  
  var foundSymbol = symbolList.find( element => {
    return element.symbol == symbol;
  });

  if (foundSymbol) {
    symbolList = symbolList.filter( (s) => {if (s.symbol != symbol) return true;});
    createChart(symbolList);
    ReactDOM.render(
      <StockControlUI/>,
      document.getElementById("app")
    );
  }
  
});


// Format: [{symbol: symbol, data: body}]
socket.on("curentstocks", function(allStockData) {
  symbolList = JSON.parse(allStockData);
  createChart(symbolList);
  ReactDOM.render(
    <StockControlUI/>,
    document.getElementById("app")
  );
});


//  React class that displays basic info about a stock.
//  Also allows it to be removed.
class StockUI extends React.Component {

  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
  }
  
  close() {
    socket.emit('removestock', this.props.symbol);
  }
  
  render() {
    return (
      <div className="card bg-light border-dark mb-3">
        <div className="card-body">
          <button type="button" className="close" aria-label="Close" onClick={this.close}>
            <span aria-hidden="true">&times;</span>
          </button>
          <h5>{this.props.symbol}</h5>
        </div>
      </div>
    );
  }
}



class AddStockUI extends React.Component {

  constructor(props) {
    super(props);
    this.state = {symbol: ""};
    
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  handleChange(event) {
    errorMessage = "";
    var value = event.target.value;
    value = value.toUpperCase();
    value = value.trim();
    this.setState({symbol: value});
  }
  
  handleSubmit(event) {
    
    event.preventDefault();
    
    // Check for empty symbols
    if (this.state.symbol) {
      socket.emit('addstock', this.state.symbol);

      this.setState({symbol: ""});
      errorMessage = "";
      ReactDOM.render(
        <StockControlUI/>,
        document.getElementById("app")
      );
    }
  }
  
  render() {
    var err = "";
    if (errorMessage) {
      err = <h6>Error getting quote for {errorMessage.symbol}</h6>;
    }
    
    return (
      <div className="card bg-light border-dark mb-3">
        <div className="card-body">
          <h5 className="card-title">Add a Stock</h5>
          <input  type="text" className="form-control" 
                  placeholder="Enter the stock's symbol" 
                  value={this.state.symbol} 
                  onChange={this.handleChange} />
          <a href="#" id="submitbtn" className="btn btn-secondary" onClick={this.handleSubmit}>Submit</a>
          {err}
        </div>
      </div>
    );
  }
}


class StockControlUI extends React.Component {
  
  constructor(props) {
    super(props);
  }
  
  render() {
    
    var cardDeck = [];
    var cardLineCount = 0;
    var fullDecks = Math.trunc(symbolList.length / 3);
    var remainingCards = symbolList.length % 3;
    var i = 0;

    for (var j = 0; j < fullDecks; j++) {      
      cardDeck.push(
        <div className="card-deck" key={j}>
          <StockUI symbol={symbolList[i++].symbol} />
          <StockUI symbol={symbolList[i++].symbol}/>
          <StockUI symbol={symbolList[i++].symbol}/>
        </div>
        )
    }
    
    switch(remainingCards){
      case 2:
        cardDeck.push(
          <div className="card-deck" key={j+1}>
            <StockUI symbol={symbolList[i++].symbol}/>
            <StockUI symbol={symbolList[i++].symbol}/>
          </div>
          )
        break;
        
      case 1:
        cardDeck.push(
          <div className="card-deck" key={j+1}>
            <StockUI symbol={symbolList[i++].symbol}/>
          </div>
          )
        break;
    }
    
    return (
      <div>
      {cardDeck}
      <AddStockUI/>
      </div>
    );
  }
}


ReactDOM.render(
  <StockControlUI/>,
  document.getElementById("app")
);

