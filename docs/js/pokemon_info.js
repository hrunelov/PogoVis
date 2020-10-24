/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
const PAGE_GENERAL = 0;
const PAGE_MOVES = 1;
const PAGE_STATS = 2;

var selectedPageIndex = 0;
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

  updateCaptionForm();
  updateFormSelectionBar();

  // Temporary hack
  d3.selectAll(".page.hidden")
    .classed("hidden", false)
    .classed("unhidden", true);

  updateGeneralInfo();
  updateMoveInfo();
  updateStatInfo(true, true);

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
    .classed("tab form-selection-button", true)
    .classed("selected", d => d.key === selectedForm.key)
    .classed("pad-top", true)
    .classed("pad-left-half", (d, i) => i > 0)
    .classed("pad-right-half", (d, i) => i < selectedPokemon.forms.length - 1)
    .attr("title", d => selectedPokemon.forms.length < 10 ? "" : d.name)
    .style("background", d => getTypeSplitColor(d.types, 0.72, 0.8))
    .on("click", (function(d,i) {
      if (d.key !== selectedForm.key)
        setSelectedForm(i);
    }))
    .append("div")
    .classed("no-letter-spacing", d => selectedPokemon.forms.length >= 10)
    .text(d => selectedPokemon.forms.length < 10 ? d.name : d.name.substr(0,2));
}

// Select page element by index
function d3SelectPage(i) {
  return d3.select("#pokemon-info-body").select(".page:nth-child(" + (i+1) + ")");
}

var pageWidth = d3SelectPage(1).node().offsetLeft - d3SelectPage(0).node().offsetLeft;
var lastPageTouchX;
//var pageswipeEnabled = true;

// // Page swipe
// d3.select("#pokemon-info-body")
//   .call(d3.drag()
//   .on("start", function() {
//     lastPageTouchX = d3.mouse(this)[0] - pageScrollX;
//   })
//   .on("drag", function() {
//     if (!lastPageTouchX)
//       return;
//
//     console.log(this);
//
//     let touchX = d3.mouse(this)[0] - pageScrollX;
//
//     pageScrollX -= touchX - lastPageTouchX;
//     if (pageScrollX < 0)
//       pageScrollX = 0;
//
//     d3.select(this)
//       .style("margin-left", -pageScrollX + "px");
//
//     lastPageTouchX = touchX;
//   })
//   .on("end", function() {
//     lastPageTouchX = null;
//     pageScrollX = (pageScrollX + pageWidth*0.5) - ((pageScrollX + pageWidth*0.5) % pageWidth);
//     d3.select(this)
//       .transition()
//       .duration(TRANSITION_DURATION_MEDIUM)
//       .ease(d3.easeExpOut)
//       .style("margin-left", -pageScrollX + "px");
//   }));

// Smooth page navigation
d3.selectAll(".pokemon-navbar-tab")
  .on("click", (function(d,i) {
    if (d3.select(this).classed("selected"))
      return;
    //pageswipeEnabled = false;

    let dir = Math.sign(i-selectedPageIndex);
    let vec = i-selectedPageIndex;
    let dist = Math.abs(i-selectedPageIndex);
    let b = d3.select("#pokemon-info-body");

    b.selectAll(".page")
      .style("overflow-y", (e,j) => i === j ? null : "hidden")
      .classed("content-hidden", (e,j) => i !== j);

    if (dist > 1)
      for (let j = selectedPageIndex + dir; j != i; j += dir)
        d3SelectPage(j)
          .style("min-width", 0)
          .style("padding", 0);

    if (dir < 0)
      b.node()
        .scrollTo(pageWidth * (selectedPageIndex - dist + 1), 0);
    else
      dist = 1;

    b.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .ease(d3.easeExpOut)
      .interp(pageWidth * selectedPageIndex, pageWidth * (selectedPageIndex + dir * dist), (function(v) {
        d3.select("#pokemon-info-body")
          .node()
          .scrollTo(v,0);
      }))
      .on("end", (function() {
        b.selectAll(".page")
          .style("min-width", null)
          .style("padding", null);
        b.node()
          .scrollTo(pageWidth * i, 0);
        //pageswipeEnabled = true;
      }));

    d3.selectAll(".pokemon-navbar-tab")
      .classed("selected", false);

    d3.select(this)
      .classed("selected", true);

    selectedPageIndex = i;
  }));
