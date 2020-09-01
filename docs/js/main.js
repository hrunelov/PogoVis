/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */

// Scale to fit width
function scaleToFit() {
  let ratio = (d3.select("body").node().offsetWidth - MAIN_MARGIN*2) / d3.select("#main").node().offsetWidth;
  if (ratio > 1)
    ratio = 1;

  d3.select("#main")
    .style("transform", "scale(" + ratio + "," + ratio + ") translate(-1.5px, 0)")
    .style("height", ((1/ratio)*100) + "%")
    .style("top", (-(1-ratio)/(2*ratio)*100) + "%");
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

d3.json("data/pokedex.min.json").then(
  /*data => d3.json("img/pokemon/index.json").then(*/
  /*index*/ data => pokedex = new Pokedex(data, /*index*/ null, updateProgress, init));

scaleToFit();
window.addEventListener("resize", scaleToFit);
