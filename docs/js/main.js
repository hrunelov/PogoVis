/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var uiScale;

// Scale to fit width
function scaleToFit() {
  uiScale = (d3.select("body").node().offsetWidth - MAIN_MARGIN*2) / d3.select("#main").node().offsetWidth;
  if (uiScale > 1)
    uiScale = 1;

  d3.select("#main")
    .style("transform", "scale(" + uiScale + "," + uiScale + ") translate(-1.5px, 0)")
    .style("height", ((1/uiScale)*100) + "%")
    .style("top", (-(1-uiScale)/(2*uiScale)*100) + "%");
}

function mobile() {
  return uiScale < 1;
}

// Get scaled mouse/touch position
function mouse(s) {
  return {
    x: d3.mouse(s)[0]/uiScale,
    y: d3.mouse(s)[1]/uiScale
  }
}

function updateProgress(amount) {
  d3.select("#progress")
    .style("width", Math.round(amount*100) + "%");
}

function init() {
  d3.select("#loading")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("opacity", 0);

    setTimeout((function() {
      d3.select("#loading")
        .remove();
    }), TRANSITION_DURATION_MEDIUM);

  generatePokemonList("");
  setSelectedPokemon(pokedex.pokemon[Math.floor(Math.random() * pokedex.pokemon.length)]);
}

d3.json("data/pokedex.json").then(
  /*data => d3.json("img/pokemon/index.json").then(*/
  /*index*/ data => pokedex = new Pokedex(data, /*index*/ null, updateProgress, init));

scaleToFit();
window.addEventListener("resize", scaleToFit);
