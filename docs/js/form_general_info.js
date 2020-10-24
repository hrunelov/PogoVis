/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var typeChar;
var evoFadeDelays = 0;

function updateGeneralInfo() {
  // updateDescription();
  updateTopBar();
  updateTypeInfo();
  updateEvolution();
}

// Description
function updateDescription() {
  // if (!lastForm || lastForm.description !== selectedForm.description) {
  //   d3.select("#form-description-body")
  //     .html("<u>" + selectedForm.description + "</u>");
  //   animateHeight("#form-description-body");
  //   clearInterval(typeChar);
  //   var i = 0;
  //   typeChar = setInterval(function() {
  //     i += 2;
  //     if (i > selectedForm.description.length)
  //       i = selectedForm.description.length;
  //     d3.select("#form-description-body")
  //       .html(selectedForm.description.substring(0, i) + "<u>" + selectedForm.description.substring(i) + "</u>");
  //     if (i === selectedForm.description.length)
  //       clearInterval(typeChar);
  //   }, 0);
  // }

  // speechSynthesis.speak(new SpeechSynthesisUtterance(selectedPokemon.name + ". " +
  //                                                    selectedPokemon.category + ". " +
  //                                                    selectedPokemon.description));
}

// Top Bar (Height, gender ratio, etc)
var lastW = 0;
var lastH = 0;
function updateTopBar() {

  // Height
  d3.select("#form-height-icon")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("height", Math.min(PERSON_HEIGHT / selectedForm.height, 1) * 100 + "%");
  d3.select("#form-height-bar")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("height", Math.min(selectedForm.height / PERSON_HEIGHT, 1) * 100 + "%");
  d3.select("#form-height-label")
    .text(selectedForm.height + " m")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("height", Math.min(selectedForm.height / PERSON_HEIGHT, 1) * 100 + "%");

  // Weight
  function balance(a,b) {
    if (!b)
      return 1;
    return (2*Math.atan(b/a)-Math.PI*0.5)/(Math.PI*0.5);
  }
  let personOffset = balance(PERSON_WEIGHT, selectedForm.weight) * 22 + 22;
  let pokemonOffset = balance(selectedForm.weight, PERSON_WEIGHT) * 22 + 22;
  d3.select("#form-weight-person")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("margin-bottom", personOffset + "px");
  d3.select("#form-weight-pokemon")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("margin-bottom", pokemonOffset + "px");
  d3.select("#form-weight-label")
    .text(selectedForm.weight + " kg");

  // Gender ratio
  let ratio = getRatio(selectedForm.femaleToMaleRatio);

  d3.select("#form-female-ratio")
    .text(selectedForm.femaleToMaleRatio !== undefined ? ratio[0] : "");

  let barRatio = selectedForm.femaleToMaleRatio === 1 ? 1.01 : selectedForm.femaleToMaleRatio;
  let b = d3.select("#form-female-bar")
    .style("z-index", barRatio >= 1 ? 1 : 0);

  let w = (barRatio * 100) + "%";
  if (!lastForm || lastForm.femaleToMaleRatio === undefined)
    b.style("width", w);
  else {
    b.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .style("width", w);
  }

  b = d3.select("#form-male-bar")
    .style("z-index", barRatio === 0 ? 1 : 0);

  w = (100 - Math.min(barRatio, 1) * 100) + "%";
  if (!lastForm || lastForm.femaleToMaleRatio === undefined)
    b.style("width", w);
  else {
    b.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .style("width", w);
  }

  d3.selectAll(".form-gender-element")
    .classed("hidden", selectedForm.femaleToMaleRatio === undefined);

  d3.select("#form-genderless-label")
    .classed("hidden", selectedForm.femaleToMaleRatio !== undefined);

  d3.select("#form-male-ratio")
    .text(selectedForm.femaleToMaleRatio !== undefined ? ratio[1] : "");
}

// Type
function updateTypeInfo() {
  if (lastForm && lastForm.sameTyping(selectedForm, true))
    return;

  // Typing
  d3.select("#form-types")
    .listData({
      duration:    selectedPageIndex === PAGE_GENERAL ? undefined : 0,
      data:        selectedForm.types,
      key:         d => d.key,
      horizontal:  true,
      hideContent: false,
      fade:        false,
      waitForExit: true,
      onenter:     function(s, delay) {
        s.classed("type-label", true);
        s.appendTypeIcon()
          .zoomIn({
            delay:    delay,
            ease:     d3.easeBackOut
          });
        s.append("div")
          .classed("uppercase-label", true)
          .classed("type-name", true)
          .text(d => d.name)
          .fadeIn({
            delay:    delay
          });

        if (selectedForm.types.length > 1)
          s.style("width", "17.5%");
      },
      onexit:     function(s, delay) {
        s.select(".type-icon")
          .interrupt()
          .zoomOut({
            delay:    delay,
            ease:     d3.easeBackIn
          });

        s.select(".type-name")
          .interrupt()
          .fadeOut({
            delay:    delay
          });
      }
    }).classed("type-label", true);

  // Effectiveness
  var resistances = selectedForm.counterEffectiveness
    .filter(e => e.damageMultiplier < 1)
    .sort((e1, e2) => e1.damageMultiplier - e2.damageMultiplier);
  var weaknesses = selectedForm.counterEffectiveness
    .filter(e => e.damageMultiplier > 1)
    .sort((e1, e2) => e2.damageMultiplier - e1.damageMultiplier);

  listTypeEffectivenesses(resistances, "#form-resistances", true);
  listTypeEffectivenesses(weaknesses, "#form-weaknesses", false);
}

function listTypeEffectivenesses(data, container, reverse) {
  const w = 220;
  const m = 48;

  d3.select(container)
    .listData({
      duration:    selectedPageIndex === PAGE_GENERAL ? undefined : 0,
      data:        data,
      key:         d => d.attackingType.key,
      hideContent: false,
      fade:        false,
      waitForExit: true,
      onenter:     function(s, delay) {
        s = s.append("div")
          .classed("form-type-effectiveness-label", true)
          .classed("reverse", reverse)
          .attr("title", d => oneDecimal(d.damageMultiplier * 100) + "% damage from " + d.attackingType.name + "-type attacks")
          .style("width", m + "px")
          .style("background", "#222");

        s.appendTypeIcon(d => d.attackingType)
          .zoomIn({
            delay:    delay
          });

        s.append("div")
          .classed("numeric-label", true)
          .classed("form-type-effectiveness-percent", true)
          .text(d => oneDecimal(d.damageMultiplier * 100) + "%")
          .fadeIn({
            delay:    delay
          });

        s.transition()
          .duration(TRANSITION_DURATION_MEDIUM)
          .delay((d,i) => delay(d,i) + TRANSITION_DURATION_MEDIUM/3)
          .style("background", d => mixColors("#000", d.attackingType.color, 0.66))
          .style("width", d => (d.damageMultiplier > 1 ? d.damageMultiplier/pokedex.boundary.combinedTypeDamageMultiplier.max :
                                                         (1 - d.damageMultiplier)/(1 - 1/pokedex.boundary.combinedTypeDamageMultiplier.max)) *
                               (w-m) + m + "px");

      },
      onupdate: function(s, delay) {
        let delayFunc = (d,i) => delay(d,i) + TRANSITION_DURATION_MEDIUM/3;
        s = s.select(".form-type-effectiveness-label")
          .attr("title", d => oneDecimal(d.damageMultiplier * 100) + "% damage from " + d.attackingType.name + "-type attacks");

        s.select(".form-type-effectiveness-percent")
          .delay(delayFunc)
          .text(d => oneDecimal(d.damageMultiplier * 100) + "%");

        s.transition()
          .duration(TRANSITION_DURATION_MEDIUM)
          .delay(delayFunc)
          .style("width", d => (d.damageMultiplier > 1 ? d.damageMultiplier/pokedex.boundary.combinedTypeDamageMultiplier.max :
                                                         (1 - d.damageMultiplier)/(1 - 1/pokedex.boundary.combinedTypeDamageMultiplier.max)) *
                               (w-m) + m + "px");
      },
      onexit: function(s, delay) {
        s = s.select(".form-type-effectiveness-label");

        s.select(".type-icon")
          .interrupt()
          .zoomOut({
            delay:    delay
          });

        s.select(".form-type-effectiveness-percent")
          .interrupt()
          .fadeOut({
            delay:    delay
          });

        s.transition()
          .duration(TRANSITION_DURATION_MEDIUM)
          .delay(delay)
          .style("background", "#222")
          .style("width", m + "px");
      }
    }).classed("form-type-effectiveness-label-wrapper", true);
}

// Evolutions and relatives
function updateEvolution() {
  d3.select("#form-evolution-body")
    .selectAll("div")
    .remove();

  // No lineage or relatives, don't display any evolutions
  if (!selectedForm.firstAncestor.evolutions && !selectedForm.pokemon.relatives) {
    d3.select("#form-evolution-body")
      .append("div")
      .classed("form-evolution-root", true)
      .html("<br/>No known lineage");

    animateHeight("#form-evolution-body");
    return;
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
  let relatives = [];
  relatives.push(selectedForm.firstAncestor);
  if (selectedPokemon.relatives) {
    for (let r of selectedPokemon.relatives) {
      let f = r.forms.find(x => x.name === selectedForm.name);
      if (!f)
        f = r.forms[0];
      f = f.firstAncestor;
      if (!relatives.find(x => x.key === f.key))
        relatives.push(f);
    }
  }
  relatives.sort((a,b) => a.pokemon.id - b.pokemon.id);

  let depth;
  function displayEvolution(s, ancestor, curDepth) {
    const evoFadeStartDelay = TRANSITION_DURATION_MEDIUM/2;

    function appendLine(s, length, split, top, bottom, dashed) {
      let svg = s.appendSvg()
        .classed("form-evolution-path", true)
        .classed(length, true)
        .append("g");
      if (split) {
        let line = svg.append("rect")
          .classed("form-evolution-path-line", true)
          .classed("dashed", dashed)
          .attr("y", top ? "50%" : "-50%")
          .attr("width", "200%")
          .attr("height", bottom ? "100%" : "200%");
      }
      if (!split || (!top && !bottom)) {
        svg.append("line")
          .classed("form-evolution-path-line", true)
          .classed("dashed", dashed)
          .attr("x1", 0)
          .attr("x2", "100%")
          .attr("y1", "50%")
          .attr("y2", "50%");
      }
    }

    if (!curDepth) {
      depth = 0;
      curDepth = 1;
    }

    if (curDepth > depth)
      depth = curDepth;

    let c = s.append("div")
      .classed("form-evolution-column", true);

    let img = c.appendPokemonImage({
      form:      ancestor,
      selected:  ancestor.key === selectedForm.key,
      fadeDelay: evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++),
      fadeFrame: doTransitions,
      fadeImage: doTransitions,
      onclick:   function() {
        setSelectedPokemon(ancestor.pokemon, ancestor.pokemon.forms.indexOf(ancestor));
      }
    })
      .classed("form-evolution-descendant-image-wrapper", true);

    img.append("div")
      .classed("form-evolution-descendant-line", true);

    // No descendants, we're done
    if (!ancestor.evolutions)
      return;

    // Group evolutions by same requirements
    let evoGroups = [];
    for (let e1 of ancestor.evolutions) {
      if (evoGroups.find(g => g.includes(e1))) continue;
      let group = [e1];
      for (let e2 of ancestor.evolutions) {
        if (group.includes(e2)) continue;
        if (equivalent(e1, e2, ["descendant", "evolutionType"])) group.push(e2);
      }
      evoGroups.push(group);
    }

    // If multiple groups, draw short line from image to separate split from image
    if (evoGroups.length > 1) {
      c = s.append("div")
        .classed("form-evolution-column", true);
      appendLine(c, "medium");
    }

    c = s.append("div")
      .classed("form-evolution-column", true);

    for (let i = 0; i < evoGroups.length; ++i) {
      const g = evoGroups[i];
      const e = g[0];
      const split = evoGroups.length > 1;
      const top = split && i == 0;
      const bottom = split && i == evoGroups.length - 1;
      const dashed = !!e.evolutionType;

      let r = c.append("div")
        .classed("form-evolution-row", true);

      let cc = r.append("div")
        .classed("form-evolution-column", true);

      appendLine(cc, "short", split, top, bottom, dashed);

      cc = r.append("div")
        .classed("form-evolution-column", true);

      appendLine(cc, "full", false, false, false, dashed);

      // List requirements
      let er = cc.append("div")
        .classed("form-evolution-reqs-wrapper", true)
        .append("div")
        .classed("form-evolution-reqs-body", true);

      // Item, time and gender are grouped together
      if (e.requirements.item || e.requirements.timeOfDay || e.requirements.gender) {
        let br = er.append("div")
          .classed("form-evolution-req-icons-wrapper", true);

        if (e.requirements.gender) {
          let img = br.append("img")
            .classed("form-evolution-req-icon", true)
            .attr("src", "img/" + e.requirements.gender + ".svg")
            .attr("title", capitalize(e.requirements.gender) + " only");
          if (doTransitions)
            fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        }

        if (e.requirements.item) {
          let img = br.append("img")
            .classed("form-evolution-req-icon", true)
            .attr("src", "img/items/" + e.requirements.item.key + ".png")
            .attr("title", "Requires " + e.requirements.item.name);
          if (doTransitions)
            fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        }

        if (e.requirements.timeOfDay) {
          let img = br.append("img")
            .classed("form-evolution-req-icon", true)
            .attr("src", "img/" + e.requirements.timeOfDay + ".svg")
            .attr("title", "Only during the " + e.requirements.timeOfDay);
          if (doTransitions)
            fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        }
      }

      // Buddy distance
      if (e.requirements.buddyDistance) {
        let l = er.append("div")
          .classed("form-evolution-req-label", true)
          .attr("title", "Must be buddy and walked " + e.requirements.buddyDistance + " km first");
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

      // Stats
      if (e.requirements.highestStat) {
        let l = er.append("div")
          .classed("form-evolution-req-label", true)
          .attr("title", "Highest stat is " + e.requirements.highestStat);
        let t = l.append("div")
          .classed("form-evolution-req-text", true)
          .text(e.requirements.highestStat)
        if (doTransitions)
          fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));
      }

      // Mega energy
      if (e.requirements.megaEnergy) {
        let l = er.append("div")
          .classed("form-evolution-req-label", true)
          .attr("title", "Requires " + e.requirements.megaEnergy.first + " Mega Energy first, " + e.requirements.megaEnergy.subsequent +
          " afterwards");
        let img = l.append("img")
          .attr("src", "img/mega.svg");
        if (doTransitions)
          fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        let t = l.append("div")
          .classed("form-evolution-req-number", true)
          .html(e.requirements.megaEnergy.first + "<br/>>" + e.requirements.megaEnergy.subsequent);
        if (doTransitions)
          fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));
      }

      // Candy
      if (e.requirements.candy) {
        let l = er.append("div")
          .classed("form-evolution-req-label", true)
          .attr("title", "Requires " + e.requirements.candy + " candy");
        let img = l.append("img")
          .attr("src", "img/candy.svg");
        if (doTransitions)
          fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
        let t = l.append("div")
          .classed("form-evolution-req-number", true)
          .text(e.requirements.candy);
        if (doTransitions)
          fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));
      }

      // Trade discount
      if (e.tradeDiscount) {
        l = er.append("div")
          .classed("form-evolution-req-label", true)
          .attr("title", "No candy requirement if traded");
        t = l.append("div")
          .classed("form-evolution-req-number", true)
          .html("or&nbsp;&nbsp;");
        if (doTransitions)
          fadeInText(t, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays));
        img = l.append("img")
          .attr("src", "img/trade.svg");
        if (doTransitions)
          fadeInIcon(img, evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++));
      }

      cc = r.append("div")
        .classed("form-evolution-column", true);

      // Draw line to separate req list from image or split
      appendLine(cc, "short", false, false, false, dashed);

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

          appendLine(cc, "medium", true, subTop, subBottom, dashed);

          displayEvolution(cc2.append("div").classed("form-evolution-row", true), e.descendant, curDepth+1);
        }
      }
      else
        displayEvolution(r, e.descendant, curDepth+1);
    }
  }
  evoFadeDelays = 0;

  let overflow = false;
  let hasEvolutions = false;
  for (let r of relatives) {
    let s = d3.select("#form-evolution-body")
      .append("div")
      .classed("form-evolution-root", true)
      .classed("form-evolution-row", true);
    depth = 0;
    displayEvolution(s,r);
    if (depth > 1)
      hasEvolutions = true;
    if (depth > 3) {
      overflow = true;
      s.classed("overflow", true);
    }
  }

  d3.select("#form-evolution-body")
    .classed("with-evolutions", hasEvolutions)
    .classed("overflow", overflow);

  animateHeight("#form-evolution-body");
}
