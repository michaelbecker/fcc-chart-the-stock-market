const chartWidth = 800;
const chartHeight = 500;

const margin = {
  top: 10,
  bottom: 70,
  left: 50,
  right: 10
};

// Make glitch syntax highlighting happy :-)
var d3;

/*
  The data we receive is in a complex format. We simplify it for now
  to make it easier to work with.

  rawData is:
  -----------------------------------------
  [ 
    {
      "symbol": "MSFT",
      "data": {
        "Meta Data": {...}
        "Time Series (Daily)": {
          "2018-06-29": {
            "1. open": "98.9300",
            "2. high": "99.9100",
            "3. low": "98.3300",
            "4. close": "98.6100",
            "5. volume": "27553289"
          },
        }
      }
    },
    ...
  ]

  dataset is:
  -----------------------------------------
  [
    {
      "min" : <min value>,
      "max" : <max value>,
      "startDate" : Date Obj,
      "endDate" : Date Obj,
      "data": [
        {  date: <a date>,
           value: <a value>
          "symbol": "MSFT",
        },
        ...
      ],
    ...
    }
  ]
*/  
function preprocessData(rawData) {
  
  var dataset = [];
  
  for (var i = 0; i < rawData.length; i++) {
  
    var s = rawData[i];
    var dataObj = s.data["Time Series (Daily)"];
    
    var processed = {};
    processed.data = [];

    for (var key in dataObj) {
      if (dataObj.hasOwnProperty(key)) {
        var d = {  date: new Date(key), 
                   value: parseFloat(dataObj[key]["4. close"]),
                   symbol: s.symbol
                };
        processed.data.push(d);
      }
    }

    processed.startDate = processed.data[ processed.data.length - 1 ].date;
    processed.endDate = processed.data[0].date;
    
    processed.min = d3.min(processed.data, (d, i) => {return d.value});
    processed.max = d3.max(processed.data, (d, i) => {return d.value});
    
    dataset.push(processed);
  }
  
  return dataset;
}

var svg;


var createChart = function(rawData) {

  if (svg)
    svg.remove();
  
  // Trap when we don't have stock data yet.
  if (!rawData || !rawData.length)
    return;
  
  // Simplify the data for charting ...
  var dataset = preprocessData(rawData);
  
  var min = 10000;
  var max = 0;
  for (var stock_idx = 0; stock_idx < dataset.length; stock_idx++) {
    if (dataset[stock_idx].min < min) {
      min = dataset[stock_idx].min;
    }
    if (dataset[stock_idx].max > max) {
      max = dataset[stock_idx].max;
    }
  }
  
  // Need to massage the data a bit for d3...
  var xRangeWidth = chartWidth - margin.right - margin.left;
  
  var startDate = dataset[0].startDate;
  var endDate = dataset[0].endDate;
  
  var formatTime = d3.timeFormat("%x");
  
  var xScale = d3.scaleTime()
                .domain([startDate, endDate])
                .range([0, xRangeWidth])
                ;

  var yScale = d3.scaleLinear()
                .domain([min, max])
                .range([chartHeight - margin.bottom, margin.top])
                ;
  
  var color = d3.scaleOrdinal(d3.schemeCategory10);
  
  svg = d3.select("#chart")
              .append("svg")
              .attr("width", chartWidth)
              .attr("height", chartHeight);
  
  var line = d3.line()
              .x( (d)=>{var x = xScale(d.date) + margin.left; 
                        return x;} )
              .y( (d)=>{var y = yScale(d.value); 
                        return y;} );
  

  // Reference for Tooltip:
  // http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
  var toolTipDiv = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
  
  for (var stock_idx = 0; stock_idx < dataset.length; stock_idx++) {
    svg.append("path")
        .datum(dataset[stock_idx].data)
        .attr("stroke", function(d, i){return color(stock_idx);})
        .attr("fill", "none")
        .attr("stroke-width", "2.0")
        .attr("d", line);
    
    svg.selectAll("dot")	
            .data(dataset[stock_idx].data)
            .enter().append("circle")								
            .attr("r", 4)
            .attr("stroke", function(d, i){return color(stock_idx);})
            .attr("stroke-width", "1.0")
            .attr("fill", function(d, i){return color(stock_idx);})
            .style("opacity", .5)		
            .attr("cx", function(d) { return xScale(d.date) + margin.left; })		 
            .attr("cy", function(d) { return yScale(d.value); })
            .on("mouseover", function(d) {
              toolTipDiv.transition()		
                  .duration(200)
                  .style("opacity", .9);
              toolTipDiv.html( 
                  d.symbol + "<br/>" +
                  formatTime(d.date) + "<br/>" + d3.format("($.2f")(d.value))	
                  .style("left", (d3.event.pageX) + "px")		
                  .style("top", (d3.event.pageY - 28) + "px");	
            })					
            .on("mouseout", function(d) {		
              toolTipDiv.transition()		
                  .duration(500)		
                  .style("opacity", 0);	
            });
    
  }
  
  var xAxis = d3.axisBottom()
              .scale(xScale)
              .ticks(12)
              .tickFormat(formatTime)
              ;

  svg.append("g")
    .attr("transform", "translate(" 
                          + margin.left + "," 
                          + (chartHeight - margin.bottom + margin.top) 
                          + ")")
    .call(xAxis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");
  
  var yAxis = d3.axisLeft()
              .scale(yScale)
              ;
  
  svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(yAxis);

  // Tooltip
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")               
    .style("opacity", 0);
}

