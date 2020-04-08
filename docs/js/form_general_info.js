/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var typeChar;
var evoFadeDelays = 0;

function updateGeneralInfo() {
  updateDescription();
  updateTopBar();
  updateTypeInfo();
  updateEvolution();
}

// Description
function updateDescription() {
  if (!lastForm || lastForm.description !== selectedForm.description) {
    d3.select("#form-description-body")
      .html("<u>" + selectedForm.description + "</u>");
    animateHeight("#form-description-body");
    clearInterval(typeChar);
    var i = 0;
    typeChar = setInterval((function() {
      i += 2;
      if (i > selectedForm.description.length)
        i = selectedForm.description.length;
      d3.select("#form-description-body")
        .html(selectedForm.description.substring(0, i) + "<u>" + selectedForm.description.substring(i) + "</u>");
      if (i === selectedForm.description.length)
        clearInterval(typeChar);
    }), 0);
  }

  // speechSynthesis.speak(new SpeechSynthesisUtterance(selectedPokemon.name + ". " +
  //                                                    selectedPokemon.category + ". " +
  //                                                    selectedPokemon.description));
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

  // Typing

  listData({
    data:        selectedForm.types,
    key:         d => d.key,
    container:   d3.select("#form-types"),
    classed:     "type-label",
    horizontal:  true,
    fade:        false,
    waitForExit: true,
    duration:    TRANSITION_DURATION_MEDIUM,
    onenter:     function(s, delay) {
      s.classed("type-label", true);
      s.appendTypeIcon()
        .zoomIn({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          ease:     d3.easeBackOut
        });
      s.append("div")
        .classed("type-name", true)
        .text(d => d.name)
        .zoomInY({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          fade:     true
        });

      if (selectedForm.types.length > 1)
        s.style("width", "17.5%");
    },
    onexit:     function(s, delay) {
      s.select(".type-icon")
        .interrupt()
        .zoomOut({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          ease:     d3.easeBackIn
        });

      s.select(".type-name")
        .interrupt()
        .zoomOutY({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          fade:     true
        });
    }
  });

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

  listData({
    data:        data,
    key:         d => d.attackingType.key,
    container:   d3.select(container),
    classed:     "form-type-effectiveness-label-wrapper",
    fade:        false,
    waitForExit: true,
    duration:    TRANSITION_DURATION_MEDIUM,
    onenter:     function(s, delay) {
      s = s.append("div")
        .classed("form-type-effectiveness-label", true)
        .classed("reverse", reverse)
        .attr("title", d => oneDecimal(d.damageMultiplier * 100) + "% damage from " + d.attackingType.name + "-type attacks")
        .style("width", m + "px")
        .style("background", "#222");

      s.appendTypeIcon(d => d.attackingType)
        .zoomIn({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          ease:     d3.easeBackOut
        });

      s.append("div")
        .classed("form-type-effectiveness-percent", true)
        .text(d => oneDecimal(d.damageMultiplier * 100) + "%")
        .zoomInY({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          fade:     true
        });

      s.transition()
        .duration(TRANSITION_DURATION_MEDIUM)
        .delay((d,i) => delay(d,i) + TRANSITION_DURATION_MEDIUM/3)
        .style("background", d => mixColors("#000", d.attackingType.color, 0.66))
        .style("width", d => (d.damageMultiplier > 1 ? d.damageMultiplier/pokedex.maxDamageMultiplier :
                                                       (1 - d.damageMultiplier)/(1 - 1/pokedex.maxDamageMultiplier)) *
                             (w-m) + m + "px");

    },
    onupdate: function(s, delay) {
      let delayFunc = (d,i) => delay(d,i) + TRANSITION_DURATION_MEDIUM/3;
      s = s.select(".form-type-effectiveness-label")
        .attr("title", d => oneDecimal(d.damageMultiplier * 100) + "% damage from " + d.attackingType.name + "-type attacks");

      s.select(".form-type-effectiveness-percent")
        .delay(delayFunc)
        .text(d => oneDecimal(d.damageMultiplier * 100) + "%");

      s.interrupt()
        .transition()
        .duration(TRANSITION_DURATION_MEDIUM)
        .delay(delayFunc)
        .style("width", d => (d.damageMultiplier > 1 ? d.damageMultiplier/pokedex.maxDamageMultiplier :
                                                       (1 - d.damageMultiplier)/(1 - 1/pokedex.maxDamageMultiplier)) *
                             (w-m) + m + "px");
    },
    onexit: function(s, delay) {
      s = s.select(".form-type-effectiveness-label")

      s.select(".type-icon")
        .interrupt()
        .zoomOut({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          ease:     d3.easeBackIn
        });

      s.select(".form-type-effectiveness-percent")
        .interrupt()
        .zoomOutY({
          duration: TRANSITION_DURATION_MEDIUM,
          delay:    delay,
          fade:     true
        });

      s.transition()
        .duration(TRANSITION_DURATION_MEDIUM)
        .delay(delay)
        .style("background", "#222")
        .style("width", m + "px");
    }
  });
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

    let img = makePokemonImage(c, {
      form: ancestor,
      selected: ancestor.key === selectedForm.key,
      fadeDelay: evoFadeStartDelay + TRANSITION_DELAY/2 * (evoFadeDelays++),
      fadeFrame: doTransitions,
      fadeImage: doTransitions,
      onclick: function() {
        setSelectedPokemon(ancestor.pokemon, ancestor.pokemon.forms.indexOf(ancestor));
      }
    })
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
