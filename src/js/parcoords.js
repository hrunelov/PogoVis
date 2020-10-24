var margin = {
  top: 30, right: 50, bottom: 10, left: 50
};
var width = 460 - margin.left - margin.right;
var height = 300 - margin.top - margin.bottom;

var svg = d3.select("#main")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var US = 0, EU = 1;
var SHIRT = 0, JEANS = 1;
var S = 0, M = 1, THIRTYTWO = 2, THIRTYFOUR = 3;
var STORE = 0, ONLINE = 1;
var TWO = 0, FIVE = 1, TEN = 2, FIFTEEN = 3;

var dimensions = ["Region", "Product", "Size", "Business Model", "Sales"];
var data = [
	[EU, JEANS, THIRTYTWO,  ONLINE, FIVE],
  [EU, JEANS, THIRTYTWO,  STORE,  FIFTEEN],
  [EU, JEANS, THIRTYFOUR, ONLINE, TWO],
  [EU, JEANS, THIRTYFOUR, STORE,  TEN],
  [EU, SHIRT, S,          ONLINE, TWO],
  [EU, SHIRT, S,          STORE,  TEN],
  [EU, SHIRT, M,          ONLINE, TWO],
  [EU, SHIRT, M,          STORE,  FIVE],
  [US, JEANS, THIRTYTWO,  ONLINE, FIVE],
  [US, JEANS, THIRTYTWO,  STORE,  TWO],
  [US, JEANS, THIRTYFOUR, ONLINE, FIFTEEN],
  [US, JEANS, THIRTYFOUR, STORE,  FIVE],
  [US, SHIRT, S,          ONLINE, FIVE],
  [US, SHIRT, S,          STORE,  TWO],
  [US, SHIRT, M,          ONLINE, TEN],
  [US, SHIRT, M,          STORE,  FIVE]
];

var x = d3.scalePoint()
.domain(dimensions)
.range([0,width]);

var y = {};
for (var i in dimensions) {
  y[dimensions[i]] = d3.scaleLinear()
    .domain([0,3])
    .range([height,0]);
}



svg.selectAll(".data-path")
  .data(data)
  .enter()
  .append("path")
  .classed("data-line", true)
  .attr("id", d => "data-line-" + d.Name)
  .attr("d", function(d) {
    return d3.line() (
      dimensions.map(function(p) {
      	var i = dimensions.indexOf(p);
        return [x(p), y[p](d[i])];
      })
    )
  })
  .style("fill", "none")
  .style("stroke", "#f00")
  .on("mouseovers", function(d) {
    d3.selectAll(".stat-line")
      .classed("grayed", true);
    d3.select(this)
      .classed("grayed", false)
      .classed("highlit", true);
    d3.select("#image")
      .attr("src", "img/" + d.Image);
  })
  .on("mouseouts", function(d) {
    d3.selectAll(".stat-line")
      .classed("highlit", false)
      .classed("grayed", false);
    d3.select("#image")
      .attr("src", "");
	});

svg.selectAll(".axis")
  .data(dimensions)
  .enter()
  .append("g")
  .classed("axis", true)
  .attr("transform", d => "translate(" + x(d) + ")")
  .each(function(d) {
    d3.select(this)
      .call(
        d3.axisLeft()
          .ticks(3)
          .scale(y[d])
      );
  })
  .append("text")
  .classed("axis-label", true)
  .style("text-anchor", "middle")
  .style("fill", "black")
  .attr("y", -9)
  .text(d => d);
