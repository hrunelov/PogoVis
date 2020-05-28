/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var heights = {};

// Convenience function for listing data with transitions
function listData({
  container    = d3.select("body"),
  tag          = "div",
  classed      = null,
  data         = [],
  key          = d => d,
  horizontal   = false,
  hideContent  = true,
  fade         = true,
  waitForExit  = false,
  duration     = TRANSITION_DURATION_MEDIUM,
  delay        = 0,
  onexit       = () => {},
  onupdate     = () => {},
  onenter      = () => {}
} = {}) {
  const notExiting = ":not(.exiting)";
  let selector = (classed ? "." + classed : tag);

  let xs, us, es;

  // For smooth reordering
  let reorder = function(selections) {
    let nodes = [];
    for (let s of selections)
      for (let n of s.nodes())
        nodes.push(n);

    let offsets = nodes.reduce((function(result, n) {
      result[key(d3.select(n).data()[0])] = [horizontal ? n.offsetLeft : n.offsetTop, null];
      return result;
    }), {});

    for (let s of selections)
      s.order();

    for (let n of nodes)
      offsets[key(d3.select(n).data()[0])][1] = (horizontal ? n.offsetLeft : n.offsetTop);

    for (let n of nodes) {
      let o = offsets[key(d3.select(n).data()[0])];
      let delta = o[0] - o[1];
      if (delta != 0) {
        d3.select(n)
          .interrupt("reorder")
          .style("transform", "translate" + (horizontal ? "X" : "Y") + "(" + delta + "px)")
          .transition("reorder")
          .duration(duration)
          //.delay(delay + (waitForExit && !xs.empty() ? duration : 0))
          .style("transform", "translate" + (horizontal ? "X" : "Y") + "(0px)");
      }
    }
  };

  // Update selection
  us = container.selectAll(selector + notExiting)
    .data(data, key);

  // Exit selection
  xs = us.exit()
    .classed("exiting", true);

  reorder([us, xs]);

  // Enter selection
  es = us.enter()
    .append(tag)
    .classed("list-item-wrapper", true)
    .classed("hide-content", hideContent)
    .classed(classed, classed);

  // Delays
  let xDelayFunc = d => delay;
  let uDelayFunc = d => delay + (waitForExit && !xs.empty() && !es.empty() ? duration : 0);
  let eDelayFunc = d => delay + (waitForExit && !xs.empty() ? duration : 0);
  let attr = (horizontal ? "width" : "height");

  // Exit
  if (!xs.empty()) {
    onexit.bind(xs.node())(xs, xDelayFunc);

    xs.interrupt("tween")
      .transition("tween")
      .duration(duration)
      .delay(xDelayFunc)
      .style(attr, "0px")
      .style("opacity", fade ? 0 : 1)
      .remove();
  }

  // Update
  if (!us.empty())
    onupdate.bind(us.node())(us, uDelayFunc);

  // Enter
  if (!es.empty()) {
    onenter.bind(es.node())(es, eDelayFunc);
    let size = (horizontal ? es.node().offsetWidth : es.node().offsetHeight) + "px";

    es.style(attr, "0px")
      .style("opacity", fade ? 0 : 1)
      .transition("tween")
      .duration(duration)
      .delay(eDelayFunc)
      .style(attr, size)
      .style("opacity", 1);
  }
}

// Delay without transition (why isn't this included by default?)
d3.selection.prototype.delay = function(ms) {
  return this.transition().delay(ms);
};

// Zoom In
d3.selection.prototype.zoomIn = function({
  duration = TRANSITION_DURATION_MEDIUM,
  delay    = 0,
  ease     = d3.easeQuad,
  fade     = false
} = {}) {
  let s = this.style("transform", "scale(0,0)");
  if (fade)
    s = s.style("opacity", 0);

  s = s.transition()
    .duration(duration)
    .delay(delay)
    .ease(ease)
    .style("transform", "scale(1,1)");

  return fade ? s.style("opacity", 1) : s;
};

// Zoom In Y
d3.selection.prototype.zoomInY = function({
  duration = TRANSITION_DURATION_MEDIUM,
  delay    = 0,
  ease     = d3.easeQuad,
  fade     = false
} = {}) {
  let s = this.style("transform", "scaleY(0)");
  if (fade)
    s = s.style("opacity", 0);

  s = s.transition()
    .duration(duration)
    .delay(delay)
    .ease(ease)
    .style("transform", "scaleY(1)");

  return fade ? s.style("opacity", 1) : s;
};

// Zoom Out
d3.selection.prototype.zoomOut = function({
  duration = TRANSITION_DURATION_MEDIUM,
  delay    = 0,
  ease     = d3.easeQuad,
  fade     = false
} = {}) {
  let s = this.transition()
    .duration(duration)
    .delay(delay)
    .ease(ease)
    .style("transform", "scale(0,0)");

  return fade ? s.style("opacity", 0) : s;
};

// Zoom Out Y
d3.selection.prototype.zoomOutY = function({
  duration = TRANSITION_DURATION_MEDIUM,
  delay    = 0,
  ease     = d3.easeQuad,
  fade     = false
} = {}) {
  let s = this.transition()
    .duration(duration)
    .delay(delay)
    .ease(ease)
    .style("transform", "scaleY(0)");

  return fade ? s.style("opacity", 0) : s;
};

// Bar Container
d3.selection.prototype.appendBar = function({
  vertical        = false,
  width           = null,
  height          = null,
  roundStart      = false,
  roundEnd        = false,
  transparent     = false,
  segments        = 1,
  separatorColor  = null
} = {}) {
  if (vertical && !width)
    width = 24;
  if (!vertical && !height)
    height = 24;

  let b = this.append("div")
    .classed("bar-" + (vertical ? "vertical" : "horizontal"), true)
    .classed("round-start", roundStart)
    .classed("round-end", roundEnd);

  if (width)
    b.style("width", width + "px");
  if (height)
    b.style("height", height + "px");

  if (!transparent && segments > 0)
    b.append("div")
      .classed("bar-background", true);

  let sw = b.append("div")
    .classed("bar-content-wrapper", true);
  for (let i = 0; i < segments; ++i) {
    let s = sw.append("div")
      .classed("bar-segment", true);

    if (separatorColor)
      s.style("border-color", separatorColor);
  }
  return b;
};

// Set Bar Value
d3.selection.prototype.setBarValue = function({
  value      = 0.5,
  startValue = 0,
  immediate  = false,
  duration   = TRANSITION_DURATION_MEDIUM,
  delay      = 0
} = {}) {
  value = functionize(value);
  startValue = functionize(startValue);

  let valueAttr = "";
  let startValueAttr = "";
  if (d3.select(this.node().parentNode).classed("bar-horizontal")) {
    valueAttr = "width";
    startValueAttr = (this.classed("reverse") ? "right" : "left");
  }
  if (d3.select(this.node().parentNode).classed("bar-vertical")) {
    valueAttr = "height";
    startValueAttr = (this.classed("reverse") ? "bottom" : "top");
  }

  if (immediate) {
    this.style(startValueAttr, d => startValue(d) * 100 + "%");
    this.style(valueAttr, d => (value(d) - startValue(d)) * 100 + "%");
  }
  else {
    this.transition()
      .duration(duration)
      .delay(delay)
      .style(startValueAttr, d => startValue(d) * 100 + "%")
      .style(valueAttr, d => (value(d) - startValue(d)) * 100 + "%");
  }
};

// Bar Value
d3.selection.prototype.appendBarValue = function({
  roundStart        = false,
  roundEnd          = false,
  reverse           = false,
  color             = null,
  initialValue      = 0.5,
  initialStartValue = 0,
  fadeFromZero      = false,
  duration          = TRANSITION_DURATION_MEDIUM,
  delay             = 0
} = {}) {
  let v = this.append("div")
    .classed("bar-value", true)
    .classed("round-start", roundStart)
    .classed("round-end", roundEnd)
    .classed("reverse", reverse);

  if (color)
    v.style("background", color);

  v.setBarValue({
    value: fadeFromZero ? 0 : initialValue,
    startValue: fadeFromZero ? 0 : initialStartValue,
    immediate: true,
  });

  if (fadeFromZero) {
    v.setBarValue({
      value: initialValue,
      startValue: initialStartValue,
      immediate: false,
      duration: duration,
      delay: delay
    });
  }

  return v;
};

// Type Icon
d3.selection.prototype.appendTypeIcon = function(typeFunc) {
  return this.append("img")
    .classed("type-icon", true)
    .attr("src", d => "img/types/" + (typeFunc ? typeFunc(d).key : d.key) + ".svg");
};

// Pokémon Image
d3.selection.prototype.appendPokemonImage = function({
  form      = selectedForm,
  width     = 75,
  selected  = false,
  fadeDelay = 0,
  fadeFrame = true,
  fadeImage = true,
  onclick   = function() {}
} = {}) {
  let w = this.append("div")
    .classed("pokemon-image-wrapper", true);

  let f = w.append("div")
    .classed("pokemon-image-frame", true)
    .style("height", width + "px")
    .classed("selected", selected);

  let frameColor = f.style("border-color");
  let backColor = mixColors("#000", form.types[0].color, 0.2);

  f.style("width", width + "px")
    .style("height", width + "px")
    .style("transform", fadeFrame && !!fadeDelay ? "scaleY(0)" : "")
    .style("background", backColor);

  let img = f.append("img")
    .classed("pokemon-image", true)
    .style("opacity", fadeImage && !!fadeDelay ? 0 : 1)
    .attr("src", POKEMON_IMG_PATH + form.image + IMG_EXTENSION);

  if (fadeImage && !!fadeDelay) {
    img.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .delay(fadeDelay)
      .style("opacity", 1);
  }

  let n = w.append("div")
    .classed("pokemon-image-name", true)
    .classed("selected", selected)
    .text(form.pokemon.name)
    .style("transform", fadeFrame ? "scaleY(0)" : "");

  if (!selected) {
    w.append("button")
      .attr("type", "button")
      .classed("pokemon-image-hot-area", true)
      .style("width", (width + 4) + "px")
      .style("height", (width + 32) + "px")
      .on("mouseover", (function() {
        f.classed("selected", true);
        n.classed("selected", true);
      }))
      .on("mouseout", (function() {
        f.classed("selected", false);
        n.classed("selected", false);
      }))
      .on("click", onclick);
  }

  if (fadeFrame && !!fadeDelay) {
    f.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .delay(fadeDelay)
      .ease(d3.easeBackOut)
      .style("transform", "scaleY(1)");

    n.transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .delay(fadeDelay)
      .style("transform", "scaleY(1)");
  }

  return w;
};

function fadeIn(s, delay) {
  delay = (!delay ? 0 : delay);
  s.style("opacity", 0)
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .style("opacity", 1);
}

function fadeInIcon(s, delay) {
  delay = (!delay ? 0 : delay);
  s.style("transform", "scale(0,0)")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .ease(d3.easeBackOut)
    .style("transform", "scale(1,1)");
}

function fadeOutIcon(s, delay) {
  delay = (!delay ? 0 : delay);
  s.interrupt()
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .ease(d3.easeBackIn)
    .style("transform", "scale(0,0)");
}

function fadeInText(s, delay) {
  delay = (!delay ? 0 : delay);
  s.style("opacity", 0)
    .style("transform", "scaleY(0)")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .style("opacity", 1)
    .style("transform", "scaleY(1)");
}

function fadeOutText(s, delay) {
  delay = (!delay ? 0 : delay);
  s.interrupt()
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .style("opacity", 0)
    .style("transform", "scaleY(0)");
}

function animateHeight(selector, duration, expandOnly) {
  let s = d3.select(selector);

  if (!heights[selector])
    heights[selector] = s.node().offsetHeight;
  else {
    s.style("height", "auto");
    const oldHeight = heights[selector];
    const newHeight = s.node().offsetHeight;
    s.style("height", oldHeight + "px");
    heights[selector] = newHeight;

    if (expandOnly && newHeight < oldHeight) {
      s.interrupt()
        .style("height", newHeight + "px");
    }
    else {
      s.transition()
        .duration(!duration ? TRANSITION_DURATION_MEDIUM : duration)
        .style("height", newHeight + "px");
    }
  }
}
