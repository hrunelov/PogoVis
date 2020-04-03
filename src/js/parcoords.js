function drawStats() {
  var margin = {
    top: 30, right: 50, bottom: 10, left: 50
  };
  var width = 460 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var svg = d3.select("#stats")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var dimensions = ["Attack", "Defense", "Stamina"];

  var x = d3.scalePoint()
    .domain(dimensions)
    .range([0,width]);

  var y = {};
  for (var i in dimensions) {
    y[dimensions[i]] = d3.scaleLinear()
      .domain([Math.floor(minStat/50)*50, Math.ceil(maxStat/50)*50])
      .range([height,0]);
  }

  svg.selectAll("stat-path")
    .data(pokedex)
    .enter()
    .append("path")
      .classed("stat-line", true)
      .attr("id", function(d) {
        return "stat-line-" + d.Name;
      })
      .attr("d", function(d) {
        return d3.line() (
          dimensions.map(function(p) {
            return [x(p), y[p](d[p])];
          })
        )
      })
      .style("fill", "none")
      .style("stroke", function(d) {
        return getTypeColor(d.Types);
      })
      .on("mouseover", function(d) {
        d3.selectAll(".stat-line")
          .classed("grayed", true);
        d3.select(this)
          .classed("grayed", false)
          .classed("highlit", true);
        d3.select("#image")
          .attr("src", "img/" + d.Image);
      })
      .on("mouseout", function(d) {
        d3.selectAll(".stat-line")
          .classed("highlit", false)
          .classed("grayed", false);
        d3.select("#image")
          .attr("src", "");
      });

  svg.selectAll("axis")
    .data(dimensions)
    .enter()
    .append("g")
      .classed("axis", true)
      .attr("transform", function(d) {
        return "translate(" + x(d) + ")";
      })
      .each(function(d) {
        d3.select(this)
          .call(
            d3.axisLeft()
              .ticks(10)
              .scale(y[d])
          );
      })
    .append("text")
      .classed("axis-label", true)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .attr("y", -9)
      .text(function(d) {
        return d;
      });
}
