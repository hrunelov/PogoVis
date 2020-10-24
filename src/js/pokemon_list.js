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

  generatePokemonList("");
}

function generatePokemonList(filter) {
  filter = filter.trim();
  let subset = (filter !== "" ? pokedex.pokemon.filter(d => d.name.toLowerCase().startsWith(filter.toLowerCase())) : []);
  subset.sort((a,b) => d3.ascending(a.name ,b.name));

  if (subset.length == 0) {
    d3.select("#pokemon-list")
      .listData({
        tag: "li"
      });

    d3.select("#pokemon-list-message")
      .html(filter === "" ? "Type to search for a Pokémon" : "No Pokémon found beginning with \"<b>" + filter + "</b>\"");

    d3.select("#pokemon-list-message-wrapper")
      .interrupt()
      .transition()
      .duration(TRANSITION_DURATION_FAST)
      .style("height", "60px");
  }
  else {
    d3.select("#pokemon-list-message-wrapper")
      .interrupt()
      .transition()
      .duration(TRANSITION_DURATION_FAST)
      .style("height", "0px");

    d3.select("#pokemon-list")
      .listData({
        data:      subset,
        key:       d => d.key,
        tag:       "li",
        onenter:   function(s) {
          let r = s.classed("pokemon-list-row-wrapper", true)
            .append("div")
            .classed("pokemon-list-row", true)
            .attr("id", d => "row-" + d.key)
            .on("mouseover", function(d) {
              d3.select(this)
                .select(".pokemon-list-type1-color")
                .style("background", d => d.forms[0].types[0].color);
              d3.select(this)
                .select(".pokemon-list-type2-color")
                .style("background", d => d.forms[0].types[d.forms[0].types.length > 1 ? 1 : 0].color);
              d3.select(this)
                .select(".pokemon-list-image-background")
                .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.35));
            })
            .on("mouseout", function(d) {
              d3.select(this)
                .select(".pokemon-list-type1-color")
                .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.75));
              d3.select(this)
                .select(".pokemon-list-type2-color")
                .style("background", d => mixColors("#000", d.forms[0].types[d.forms[0].types.length > 1 ? 1 : 0].color, 0.75));
              d3.select(this)
                .select(".pokemon-list-image-background")
                .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.2));
            })
            .on("mousedown", function(d) {
              hidePokemonList();
              setSelectedPokemon(d);
            });

          r.append("div")
            .classed("split-top", true)
            .classed("pokemon-list-type1-color", true)
            .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.75));

          r.append("div")
            .classed("split-bottom", true)
            .classed("pokemon-list-type2-color", true)
            .style("background", d => mixColors("#000", d.forms[0].types[d.forms[0].types.length > 1 ? 1 : 0].color, 0.75));

          r.append("div")
            .classed("pokemon-list-image-background", true)
            .style("background", d => mixColors("#000", d.forms[0].types[0].color, 0.2))
            .append("img")
            .classed("pokemon-list-image", true)
            .attr("src", d => POKEMON_IMG_PATH + d.forms[0].key + IMG_EXTENSION);

          r.append("div")
            .classed("pokemon-list-name", true)
            .text(d => d.name);
        }
      });
  }
}

d3.select("#pokemon-list-filter")
  .on("focus", function() {
    showPokemonList();
    d3.select("#pokemon-list-filter-icon")
      .style("display", "none");
  })
  .on("input", function() {
    generatePokemonList(d3.select(this).node().value);
  })
  .on("blur", function() {
    setTimeout(function() {
      hidePokemonList();
      d3.select("#pokemon-list-filter-icon")
        .style("display", "block");
    }, 1);
  });
