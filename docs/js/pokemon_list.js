/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
function showPokemonList() {
  generatePokemonList("");
  d3.select("#pokemon-list-wrapper")
    .classed("shown", true)
    .classed("hidden", false);

  d3.select("#pokemon-list-filter").node().focus();
}

function hidePokemonList() {
  d3.select("#pokemon-list-wrapper")
    .classed("shown", false)
    .classed("hidden", true);

  d3.select("#pokemon-list-filter")
    .node().value = "";
}

function generatePokemonList(filter) {
  filter = filter.trim();
  let subset = (filter !== "" ? pokedex.pokemon.filter(d => d.name.toLowerCase().includes(filter.toLowerCase())) : []);
  subset.sort((function(a,b) {
    let i = 0;
    if (a.name.toLowerCase().startsWith(filter.toLowerCase())) --i;
    if (b.name.toLowerCase().startsWith(filter.toLowerCase())) ++i;
    if (i != 0) return i;
    if (a.name < b.name) return -1;
    if (b.name < a.name) return 1;
    return 0;
  }));

  if (subset.length == 0) {
    d3.select("#pokemon-list")
      .selectAll("li")
      .remove();

    d3.select("#pokemon-list")
      .append("li")
      .attr("id", "pokemon-list-message")
      .html(filter === "" ? "Type to search for a Pokémon" : "No Pokémon found with \"<b>" + filter + "</b>\" in its name");
  }
  else {
    d3.select("#pokemon-list-message")
      .remove();

    let p = d3.select("#pokemon-list")
      .selectAll("li")
      .data(subset, d => d);

    generatePokemonRows(p);

    p.exit()
      .remove();
  }
}

function generatePokemonRows(p) {
  let r = p.enter()
    .append("li")
    .merge(p)
    .classed("pokemon-list-row", true)
    .classed("pad-top", (d, i) => i > 0)
    .attr("id", d => "row-" + d.key)
    .style("background", d => getTypeSplitColor(d.forms[0].types, 0.75, 0.6))
    .on("mouseover", (function(d) {
      d3.select(this)
        .style("background", d => getTypeSplitColor(d.forms[0].types, 0.75, 0.8))
        .select(".pokemon-list-image-background")
        .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.25));
    }))
    .on("mouseout", (function(d) {
      d3.select(this)
        .style("background", d => getTypeSplitColor(d.forms[0].types, 0.75, 0.6))
        .select(".pokemon-list-image-background")
        .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.125));
    }))
    .on("mousedown", (function(d) {
      hidePokemonList();
      setSelectedPokemon(d);
    }));

    r.selectAll("div")
      .remove();

    r.append("div")
      .classed("pokemon-list-image-background", true)
      .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.125))
      .append("img")
      .classed("pokemon-list-image", true)
      .attr("src", d => POKEMON_IMG_PATH + d.forms[0].key + IMG_EXTENSION);

    r.append("div")
      .classed("pokemon-list-name", true)
      .text(d => d.name);
}

d3.select("#pokemon-list-filter")
  .on("focus", (function() {
    showPokemonList();
    animateHeight("#pokemon-list-wrapper", TRANSITION_DURATION_FAST, true);
    d3.select("#pokemon-list-filter-icon")
      .style("display", "none");
  }))
  .on("input", (function() {
    generatePokemonList(d3.select(this).node().value);
    animateHeight("#pokemon-list-wrapper", TRANSITION_DURATION_FAST, true);
  }))
  .on("blur", (function() {
    setTimeout((function() {
      hidePokemonList();
      d3.select("#pokemon-list-filter-icon")
        .style("display", "block");
    }), 1);
  }));
