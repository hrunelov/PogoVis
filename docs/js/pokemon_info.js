/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
const PAGE_GENERAL = "form-general-info-page";
const PAGE_MOVES = "form-move-info-page";
const PAGE_STATS = "form-stat-info-page";

var statChart;

var selectedPage = PAGE_GENERAL;
var lastPokemon;
var selectedPokemon;
var lastForm;
var selectedForm;

function setSelectedPage(key) {
  if (key) {
    selectedPage = key;
    d3.selectAll(".page")
      .classed("hidden", true);
  }

  d3.select("#" + selectedPage)
    .classed("hidden", false);

  // switch (selectedPage) {
  //   case PAGE_GENERAL:
  //     updateGeneralInfo();
  //     break;
  //   case PAGE_MOVES:
  //     updateMoveInfo();
  //     break;
  //   case PAGE_STATS:
  //     updateStatInfo();
  //     break;
  //   default:
  // }

  d3.select("#" + selectedPage)
    .node().scrollTo({
      top: 0,
      behavior: "smooth"
    });
}

function setSelectedPokemon(pokemon, formIdx) {
  lastPokemon = selectedPokemon;
  selectedPokemon = pokemon;

  updateCaptionPokemon();
  setSelectedForm(formIdx ? formIdx : 0);
}

function setSelectedForm(idx) {
  lastForm = selectedForm;
  selectedForm = selectedPokemon.forms[idx];

  updateCaptionForm();
  updateFormSelectionBar();

  setSelectedPage();

  // Temporary hack
  d3.selectAll(".page.hidden")
    .classed("hidden", false)
    .classed("unhidden", true);

  updateGeneralInfo();
  updateMoveInfo();
  updateStatInfo();

  d3.selectAll(".page.unhidden")
    .classed("hidden", true)
    .classed("unhidden", false);
}

// Caption (Pokémon Name, category, id)
function updateCaptionPokemon() {
  d3.select("#pokemon-caption-name")
    .text(selectedPokemon.name);

  d3.select("#pokemon-caption-category")
    .text(selectedPokemon.category);

  d3.select("#pokemon-caption-id")
    .text(selectedPokemon.id);

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
  d3.select("#pokemon-caption-type1-color")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("background", mixColors("#000", selectedForm.types[0].color, 0.75));

  d3.select("#pokemon-caption-type2-color")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("background", mixColors("#000", selectedForm.types[selectedForm.types.length > 1 ? 1 : 0].color, 0.75));

  d3.select("#pokemon-caption-image-background")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("background", mixColors("#000", selectedForm.types[0].color, 0.2));

  let imgPath = POKEMON_IMG_PATH + selectedForm.image + IMG_EXTENSION;
  let imgPathShiny = POKEMON_IMG_PATH + selectedForm.image + "_shiny" + IMG_EXTENSION;
  if (imgPath !== d3.select("#pokemon-caption-image").attr("src")) {
    fadeIn(d3.select("#pokemon-caption-image")
    .interrupt()
    .attr("src", imgPath));
  }
  d3.select("#pokemon-caption-image-shiny")
    .attr("src", imgPathShiny);
}

// Form Selection Bar
function updateFormSelectionBar() {
  d3.select("#form-selection-bar")
    .classed("collapsed", selectedPokemon.forms.length == 1)
    .selectAll("button")
    .remove();

  if (selectedPokemon.forms.length == 1)
    return;

  let b = d3.select("#form-selection-bar")
    .selectAll("button")
    .data(selectedPokemon.forms)
    .enter()
    .append("button")
    .attr("type", "button")
    .attr("disabled", d => d.key === selectedForm.key ? true : null)
    .classed("tab form-selection-button", true)
    .classed("selected", d => d.key === selectedForm.key)
    .classed("pad-top", true)
    .classed("pad-left-half", (d, i) => i > 0)
    .classed("pad-right-half", (d, i) => i < selectedPokemon.forms.length - 1)
    .attr("title", d => selectedPokemon.forms.length < 10 ? "" : d.name)
    .style("width", 1/selectedPokemon.forms.length * 100 + "%")
    .style("background", d => getTypeSplitColor(d.types, 0.72, 0.8))
    .on("click", (function(d,i) {
      if (d.key !== selectedForm.key)
        setSelectedForm(i);
    }))
    .append("div")
    .classed("no-letter-spacing", d => selectedPokemon.forms.length >= 10)
    .text(d => selectedPokemon.forms.length < 10 ? d.name : d.name.substr(0,2));
}

d3.selectAll(".pokemon-navbar-tab")
  .on("click", (function() {
    d3.selectAll(".pokemon-navbar-tab")
      .attr("disabled", null)
      .classed("selected", false);

    d3.select(this)
      .attr("disabled", true)
      .classed("selected", true);

  setSelectedPage(d3.select(this).attr("value"));
}));

// statChart = new SpiderChart(d3.select("#form-stats-body"),
//                             "form-stats-shape",
//                             280, 200,
//                             500, 100,
//                             ["Stamina", "Attack", "Defense"]);
