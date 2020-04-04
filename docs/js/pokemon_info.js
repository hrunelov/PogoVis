/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var statChart;
var lastPokemon;
var selectedPokemon;
var lastForm;
var selectedForm;

function setSelectedPokemon(pokemon, formIdx) {
  lastPokemon = selectedPokemon;
  selectedPokemon = pokemon;

  updateCaptionPokemon();
  setSelectedForm(formIdx ? formIdx : 0);
}

function setSelectedForm(idx) {
  lastForm = selectedForm;
  selectedForm = selectedPokemon.forms[idx];

  d3.select("#form-general-container")
    .node().scrollTo({
      top: 0,
      behavior: "smooth"
    });

  updateCaptionForm();
  updateFormSelectionBar();
  updateGeneralInfo();
  //statChart.update(Object.values(selectedForm.baseStats));
}

// Caption (Pokémon Name)
function updateCaptionPokemon() {
  d3.select("#pokemon-caption-name")
    .text(selectedPokemon.name);

  d3.select("#pokemon-caption-category")
    .text(selectedPokemon.category);

  if (selectedPokemon.rarity) {
    d3.select("#pokemon-caption-rarity")
      .classed("legendary", selectedPokemon.rarity === "legendary")
      .classed("mythical", selectedPokemon.rarity === "mythical")
      .text(selectedPokemon.rarity)
      .transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .style("transform", "rotate(-45deg) translate(-14px)");
  }
  else {
    d3.select("#pokemon-caption-rarity")
      .transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .style("transform", "rotate(-45deg) translate(200px)");
  }
}

// Caption (Form)
function updateCaptionForm() {
  d3.select("#pokemon-caption")
  .style("background", getTypeSplitColor(selectedForm.types, 0.8, 0.75));

  d3.select("#pokemon-caption-image-background")
  .style("background", mixColors("#000", selectedForm.types[0].color, 0.2));

  let imgPath = POKEMON_IMG_PATH + selectedForm.image + IMG_EXTENSION;
  if (imgPath !== d3.select("#pokemon-caption-image").attr("src")) {
    fadeIn(d3.select("#pokemon-caption-image")
    .interrupt()
    .attr("src", imgPath));
  }
}

// Form Selection Bar
function updateFormSelectionBar() {
  d3.select("#form-selection-bar")
    .classed("collapsed", selectedPokemon.forms.length == 1)
    .classed("expanded", selectedPokemon.forms.length > 1)
    .selectAll("div")
    .remove();

  if (selectedPokemon.forms.length == 1)
    return;

  d3.select("#form-selection-bar")
    .selectAll("div")
    .data(selectedPokemon.forms)
    .enter()
    .append("div")
    .classed("form-selection-button", true)
    .classed("selected", d => d.key === selectedForm.key)
    .classed("unselected", d => d.key !== selectedForm.key)
    .classed("pad-top", true)
    .classed("pad-left-half", (d, i) => i > 0)
    .classed("pad-right-half", (d, i) => i < selectedPokemon.forms.length - 1)
    .attr("title", d => selectedPokemon.forms.length < 10 ? "" : d.name)
    .style("width", 1/selectedPokemon.forms.length * 100 + "%")
    .style("background", d => getTypeSplitColor(d.types, 0.72, d.key === selectedForm.key ? 0.8 : 0.35))
    .on("mouseover", (function(d) {
      if (d.key === selectedForm.key)
        return;
      d3.select(this)
        .style("background", getTypeSplitColor(d.types, 0.72, 0.5));
    }))
    .on("mouseout", (function(d) {
      if (d.key === selectedForm.key)
        return;
      d3.select(this)
        .style("background", getTypeSplitColor(d.types, 0.72, 0.35));
    }))
    .on("mousedown", (function(d,i) {
      if (d.key !== selectedForm.key)
        setSelectedForm(i);
    }))
    .append("div")
    .classed("no-letter-spacing", d => selectedPokemon.forms.length >= 10)
    .text(d => selectedPokemon.forms.length < 10 ? d.name : d.name.substr(0,2));
}

// statChart = new SpiderChart(d3.select("#form-stats-body"),
//                             "form-stats-shape",
//                             280, 200,
//                             500, 100,
//                             ["Stamina", "Attack", "Defense"]);
