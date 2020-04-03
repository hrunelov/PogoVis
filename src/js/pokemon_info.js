var statChart;
var lastPokemon;
var selectedPokemon;
var lastForm;
var selectedForm;
var typeChar;
var evoFadeDelays = 0;

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
  updateDescription();
  updateTopBar();
  updateTypeInfo();
  statChart.update(Object.values(selectedForm.baseStats));
  updateEvolution();
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
  .style("background", getTypeSplitColor(selectedForm.types, 0.8, 0.6));

  d3.select("#pokemon-caption-image-background")
  .style("background", mixColors("#000", selectedForm.types[0].color, 0.15));

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
    .style("background", d => getTypeSplitColor(d.types, 0.72, d.key === selectedForm.key ? 0.6 : 0.25))
    .on("mouseover", function(d) {
      if (d.key === selectedForm.key)
        return;
      d3.select(this)
        .style("background", getTypeSplitColor(d.types, 0.72, 0.4));
    })
    .on("mouseout", function(d) {
      if (d.key === selectedForm.key)
        return;
      d3.select(this)
        .style("background", getTypeSplitColor(d.types, 0.72, 0.25));
    })
    .on("mousedown", function(d,i) {
      if (d.key !== selectedForm.key)
        setSelectedForm(i);
    })
    .append("div")
    .classed("no-letter-spacing", d => selectedPokemon.forms.length >= 10)
    .text(d => selectedPokemon.forms.length < 10 ? d.name : d.name.substr(0,2));
}

// Description
function updateDescription() {
  if (!lastForm || lastForm.description !== selectedForm.description) {
    d3.select("#form-description-body")
      .html("<u>" + selectedForm.description + "</u>");
    animateHeight("#form-description-body");
    clearInterval(typeChar);
    var i = 0;
    typeChar = setInterval(function() {
      i += 2;
      if (i > selectedForm.description.length)
        i = selectedForm.description.length;
      d3.select("#form-description-body")
        .html(selectedForm.description.substring(0, i) + "<u>" + selectedForm.description.substring(i) + "</u>");
      if (i === selectedForm.description.length)
        clearInterval(typeChar);
    }, 0);
  }
}

// Top Bar (Gender ratio, etc)
function updateTopBar() {
  d3.select("#form-female-percent")
    .text(selectedForm.genderRatio !== null ? oneDecimal(selectedForm.genderRatio * 100) + "%" : "");

  let barRatio = selectedForm.genderRatio === 1 ? 1.01 : selectedForm.genderRatio;
  let b = d3.select("#form-female-bar")
    .style("z-index", barRatio >= 1 ? 1 : 0);

  let w = (barRatio * 100) + "%";
  if (!lastForm || lastForm.genderRatio === null)
    b.style("width", w);
  else {
    b.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .style("width", w);
  }

  b = d3.select("#form-male-bar")
    .style("z-index", barRatio === 0 ? 1 : 0);

  w = (100 - Math.min(barRatio, 1) * 100) + "%";
  if (!lastForm || lastForm.genderRatio === null)
    b.style("width", w);
  else {
    b.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .style("width", w);
  }

  d3.selectAll(".form-gender-element")
    .classed("hidden", selectedForm.genderRatio === null);

  d3.select("#form-genderless-label")
    .classed("hidden", selectedForm.genderRatio !== null);

  d3.select("#form-male-percent")
    .text(selectedForm.genderRatio !== null ? 100 - oneDecimal(selectedForm.genderRatio * 100) + "%" : "");
}

// Type
function updateTypeInfo() {
  if (lastForm && lastForm.sameTyping(selectedForm, true))
    return;

  d3.select("#form-types")
    .selectAll("div")
    .remove();

  makeTypeLabels(
    d3.select("#form-types")
      .selectAll("div")
      .data(selectedForm.types)
      .enter(),
    [selectedForm.types.length > 1, false], 2
  );

  if (lastForm && lastForm.sameTyping(selectedForm, false))
    return;

  var resistances = selectedForm.counterEffectiveness
    .filter(e => e.damageMultiplier < 1)
    .sort((e1, e2) => e1.damageMultiplier - e2.damageMultiplier);
  var weaknesses = selectedForm.counterEffectiveness
    .filter(e => e.damageMultiplier > 1)
    .sort((e1, e2) => e2.damageMultiplier - e1.damageMultiplier);

  d3.select("#form-resistances")
    .selectAll("div")
    .remove();

  d3.select("#form-weaknesses")
    .selectAll("div")
    .remove();

  listTypeEffectiveness(
    d3.select("#form-resistances")
      .selectAll("div")
      .data(resistances)
      .enter(), 3
  );

  listTypeEffectiveness(
    d3.select("#form-weaknesses")
      .selectAll("div")
      .data(weaknesses)
      .enter(), 4
  );

  animateHeight("#form-type-body");
}

function makeTypeLabels(s, reverse, delayOffset) {
  let label = s.append("div")
    .classed("type-label", true)
    .classed("centered", true);

  fadeInIcon(label.append("img")
    .classed("type-icon", true)
    .attr("src", d => "img/types/" + d.key + ".svg"),
    (d,i) => (i + delayOffset) * TRANSITION_DELAY);

  fadeInText(label.append("div")
    .classed("type-name", true)
    .classed("right-aligned", (d, i) => reverse[i])
    .text(d => d.name),
    (d,i) => (i + delayOffset) * TRANSITION_DELAY);
}

function listTypeEffectiveness(s, delayOffset) {
  let label = s.append("div")
    .classed("type-label", true)
    .classed("left", d => d.damageMultiplier < 1)
    .classed("right", d => d.damageMultiplier > 1)
    .attr("title", d => oneDecimal(d.damageMultiplier * 100) + "% damage from " + d.attackingType.name + "-type attacks")
    .style("background", "#222");

  fadeInIcon(label.append("img")
    .classed("type-icon", true)
    .attr("src", d => "img/types/" + d.attackingType.key + ".svg"),
    (d,i) => (i + delayOffset) * TRANSITION_DELAY);

  fadeInText(label.append("div")
    .classed("type-name", true)
    .classed("type-effectiveness-text", true)
    .classed("right-aligned", d => d < 1)
    .text(d => oneDecimal(d.damageMultiplier * 100) + "%"),
    (d,i) => (i + delayOffset) * TRANSITION_DELAY);

  label.transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay((d,i) => (i + delayOffset) * TRANSITION_DELAY)
    .style("background", d => (d.damageMultiplier > 1 ? mixColors("#222", "#800", (d.damageMultiplier-1)/1.56) :
                                                        mixColors("#222", "#060", (1-d.damageMultiplier-0.2)/0.56)));
}

// Evolutions
function updateEvolution() {
  d3.select("#form-evolution-root")
    .selectAll("div")
    .remove();

  // No lineage, don't display any evolutions
  if (selectedForm.firstAncestor.evolutions.length === 0) {
    d3.select("#form-evolution-root")
      .html("<br/>No known lineage");

    animateHeight("#form-evolution-body");
    return;
  }
  else {
    d3.select("#form-evolution-root")
      .text("");
  }

  let doTransitions = !lastForm || !equivalent(lastForm.firstAncestor.evolutions, selectedForm.firstAncestor.evolutions, "descendant");

  // Stretch out evolution tree
  if (doTransitions) {
    let t = d3.select("#form-evolution-root")
      .interrupt()
      .style("transform", "scaleX(0)");

    t.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .ease(d3.easeBack)
      .style("transform", "scaleX(1)");
  }

  // Recursively display evolution branches
  var displayEvolution = function(s, ancestor) {
    const evoFadeStartDelay = TRANSITION_DURATION_MEDIUM/2;

    let c = s.append("div")
      .classed("form-evolution-column", true);

    let img = makePokemonImage(c,
                               75,
                               ancestor,
                               function() {
                                 setSelectedPokemon(ancestor.pokemon, ancestor.pokemon.forms.indexOf(ancestor));
                               },
                               ancestor.key === selectedForm.key,
                               evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++),
                               doTransitions,
                               doTransitions)
      .classed("form-evolution-descendant-image-wrapper", true);

    img.append("div")
      .classed("form-evolution-descendant-line", true);

    // No descendants, we're done
    if (ancestor.evolutions.length == 0)
      return;

    // Group evolutions by same requirements
    let evoGroups = [];
    for (let e1 of ancestor.evolutions) {
      if (evoGroups.find(g => g.includes(e1))) continue;
      let group = [e1];
      for (let e2 of ancestor.evolutions) {
        if (group.includes(e2)) continue;
        if (equivalent(e1, e2, ["descendant"])) group.push(e2);
      }
      evoGroups.push(group);
    }

    // If multiple groups, draw short line from image to separate split from image
    if (evoGroups.length > 1) {
      c = s.append("div")
        .classed("form-evolution-column", true);

      c.append("div")
        .classed("form-evolution-path", true)
        .classed("short", true)
        .classed("upper", true);
      c.append("div")
        .classed("form-evolution-path", true)
        .classed("short", true)
        .classed("lower", true);
    }

    c = s.append("div")
      .classed("form-evolution-column", true);

    for (let i = 0; i < evoGroups.length; ++i) {
      const g = evoGroups[i];
      const e = g[0];
      const split = evoGroups.length > 1;
      const top = split && i == 0;
      const bottom = split && i == evoGroups.length - 1;

      let r = c.append("div")
        .classed("form-evolution-row", true);

      // Draw split
      let cc = r.append("div")
        .classed("form-evolution-column", true);

      cc.append("div")
        .classed("form-evolution-path", true)
        .classed("short", true)
        .classed("upper", true)
        .classed("split", split)
        .classed("top", top)
        .classed("bottom", bottom);
      cc.append("div")
        .classed("form-evolution-path", true)
        .classed("short", true)
        .classed("lower", true)
        .classed("split", split)
        .classed("top", top)
        .classed("bottom", bottom);

      cc = r.append("div")
          .classed("form-evolution-column", true);

      cc.append("div")
        .classed("form-evolution-path", true)
        .classed("full", true)
        .classed("upper", true)
        .classed("top", top)
        .classed("bottom", bottom);
      cc.append("div")
        .classed("form-evolution-path", true)
        .classed("full", true)
        .classed("lower", true)
        .classed("top", top)
        .classed("bottom", bottom);

      // List requirements
      let er = cc.append("div")
        .classed("form-evolution-reqs-wrapper", true)
        .append("div")
        .classed("form-evolution-reqs-body", true);

      if (e.requirements.item || e.requirements.timeOfDay || e.requirements.gender) {
        let br = er.append("div")
          .classed("form-evolution-req-icons-wrapper", true);

        if (e.requirements.item) {
          let img = br.append("img")
            .classed("form-evolution-req-icon", true)
            .attr("src", "img/items/" + e.requirements.item.key + ".svg");
            if (doTransitions)
              fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        }

        if (e.requirements.timeOfDay) {
          let img = br.append("img")
            .classed("form-evolution-req-icon", true)
            .attr("src", "img/" + e.requirements.timeOfDay + ".svg");
            if (doTransitions)
            fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        }

        if (e.requirements.gender) {
          let img = br.append("img")
            .classed("form-evolution-req-icon", true)
            .attr("src", "img/" + e.requirements.gender + ".svg");
            if (doTransitions)
              fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        }
      }

      if (e.requirements.buddyDistance) {
        let l = er.append("div")
          .classed("form-evolution-req-label", true);
        let img = l.append("img")
          .attr("src", "img/distance.svg");
          if (doTransitions)
            fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        let t = l.append("div")
          .classed("form-evolution-req-number", true)
          .text(e.requirements.buddyDistance + " km");
          if (doTransitions)
            fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));
      }

      if (e.requirements.other) {
        let t = er.append("div")
          .classed("form-evolution-req-text", true)
          .text(e.requirements.other);
          if (doTransitions)
            fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));
      }

      let l = er.append("div")
        .classed("form-evolution-req-label", true);
      let img = l.append("img")
        .attr("src", "img/candy.svg");
        if (doTransitions)
          fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
      let t = l.append("div")
        .classed("form-evolution-req-number", true)
        .text(e.requirements.candy);
        if (doTransitions)
          fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));

      cc = r.append("div")
          .classed("form-evolution-column", true);

      // Draw line to separate req list from image or split
      cc.append("div")
        .classed("form-evolution-path", true)
        .classed("short", true)
        .classed("upper", true)
        .classed("top", top)
        .classed("bottom", bottom);
      cc.append("div")
        .classed("form-evolution-path", true)
        .classed("short", true)
        .classed("lower", true)
        .classed("top", top)
        .classed("bottom", bottom);

      // If multiple evolutions in group, draw split
      if (g.length > 1) {
        cc = r.append("div")
          .classed("form-evolution-column", true);

        let cc2 = r.append("div")
          .classed("form-evolution-column", true);

        for (let j = 0; j < g.length; ++j) {
          const e = g[j];
          const subTop = j == 0;
          const subBottom = j == g.length - 1;

          cc.append("div")
            .classed("form-evolution-path", true)
            .classed("short", true)
            .classed("upper", true)
            .classed("split", true)
            .classed("top", subTop)
            .classed("bottom", subBottom);
          cc.append("div")
            .classed("form-evolution-path", true)
            .classed("short", true)
            .classed("lower", true)
            .classed("split", true)
            .classed("top", subTop)
            .classed("bottom", subBottom);

          displayEvolution(cc2.append("div").classed("form-evolution-row", true), e.descendant);
        }
      }
      else
        displayEvolution(r, e.descendant);
    }
  };
  evoFadeDelays = 0;
  displayEvolution(d3.select("#form-evolution-root"), selectedForm.firstAncestor);

  animateHeight("#form-evolution-body");
}

statChart = new SpiderChart(d3.select("#form-stats-body"),
                            "form-stats-shape",
                            280, 200,
                            500, 100,
                            ["Stamina", "Attack", "Defense"]);
