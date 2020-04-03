/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
function generateDetails(pokemon, cpCap, absolute) {

  // List Optimal Pokémon
  var optimalPokemon = listOptimallyLeveledPokemon(pokemon, cpCap).reverse();

  // Reset
  d3.select("#spRange")
    .selectAll("svg")
    .remove();

  // Dimensions
  var margin = {top: 20, right: 20, bottom: 20, left: 40}
  var width = 700 - margin.left - margin.right;
  var height = 150 - margin.top - margin.bottom;
  var n = optimalPokemon.length;

  // Min/Max
  var minSP = d3.min(optimalPokemon, p => p.statProduct);
  var maxSP = d3.max(optimalPokemon, p => p.statProduct);

  // Chart
  var svg = d3.select("#spRange").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Scales
  var xScale = d3.scaleLinear()
    .domain([0, n-1])
    .range([0, width]);
  var yScale = d3.scaleLinear()
    .domain([absolute ? 0 : minSP/maxSP*100, 100])
    .range([height, 0]);

  // Data Area
  var area = d3.area()
    .x((function(d,i) {
      return xScale(i);
    }))
    .y0(height)
    .y1((function(d) {
      return yScale(d.y);
    }));

  // Draw X Axis
  svg.append("g")
    .attr("class", "sp-xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(
      d3.axisBottom()
        .scale(xScale)
        .ticks(2)
    );

  // Draw Y Axis
  svg.append("g")
    .attr("class", "sp-yAxis")
    .call(
      d3.axisLeft()
        .scale(yScale)
        .tickValues([0, minSP/maxSP*100, 100])
    );

  // Data
  var dataset = d3.range(n).map((function(i) {
    return {"y": optimalPokemon[i].statProduct/maxSP*100};
  }));

  // Draw Line
  svg.append("path")
    .datum(dataset)
    .attr("class", "ps-area")
    .attr("d", area);
}

function loadPosition(country, wave) {
  d3.select("#position")
    .selectAll("svg")
      .remove();

  // Dimensions
  var margin = {top: 20, right: 20, bottom: 20, left: 40}
  var width = 700 - margin.left - margin.right;
  var height = 150 - margin.top - margin.bottom;
  var n = 10;

  // Chart
  var svg = d3.select("#position").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // No data
  if (countries[country][wave][7] === undefined) {
    svg.append("text")
      .attr("class", "error")
      .attr("x", width*0.5-10)
      .attr("y", height*0.5)
      .text("NO DATA");
    return;
  }

  // Get max percentage
  var max = 0;
  for (w in countries[country]) {
    if (countries[country][w][7] === undefined)
      continue;
    for (p of countries[country][w][7]) {
      if (p > max) max = p;
    }
  }

  // Scales
  var xScale = d3.scaleLinear()
    .domain([0, n-1])
    .range([0, width]);
  var yScale = d3.scaleLinear()
    .domain([0, max])
    .range([height, 0]);

  // Data Line
  var line = d3.line()
    .x((function(d,i) {
      return xScale(i);
    }))
    .y((function(d) {
      return yScale(d.y);
    }));
  var area = d3.area()
    .x((function(d,i) {
      return xScale(i);
    }))
    .y0(height)
    .y1((function(d) {
      return yScale(d.y);
    }));

  // Draw X Axis
  svg.append("g")
    .attr("class", "pos-xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(
      d3.axisBottom()
        .scale(xScale)
        .ticks(2)
        .tickValues([0,4.5,9])
        .tickFormat((function(d,i) {
          return ["Left", "Centre", "Right"][i];
        }))
    );

  // Draw Y Axis
  svg.append("g")
    .attr("class", "pos-yAxis")
    .call(
      d3.axisLeft()
        .scale(yScale)
        .ticks(3)
        .tickFormat(d3.format(".0%"))
    );

  // Data
  var dataset = d3.range(n).map((function(d) {
    return {"y": countries[country][wave][7][d]};
  }));

  // Draw Line
  svg.append("path")
    .datum(dataset)
    .attr("class", "pos-area")
    .attr("d", area);
  svg.append("path")
    .datum(dataset)
    .attr("class", "pos-line")
    .attr("d", line);
}
