var heights = {};
var uid = 0;

// Convenience function for listing data with transitions
d3.selection.prototype.listData = function({
  tag          = "div",
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
  const selector = "list-item-wrapper";
  let xs, us, es;

  // For smooth reordering
  let reorder = function(selections) {
    let nodes = [];
    for (let s of selections)
      for (let n of s.nodes())
        nodes.push(n);

    let offsets = nodes.reduce(function(result, n) {
      result[key(d3.select(n).data()[0])] = [horizontal ? n.offsetLeft : n.offsetTop, null];
      return result;
    }, {});

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
  us = this.selectAll("." + selector + notExiting)
    .data(data, key);

  // Exit selection
  xs = us.exit()
    .classed("exiting", true);

  reorder([us, xs]);

  // Enter selection
  es = us.enter()
    .append(tag)
    .classed(selector, true)
    .classed("hide-content", hideContent);

  // Delays
  let xDelayFunc = d => delay;
  let uDelayFunc = d => delay + (waitForExit && !xs.empty() && !es.empty() ? duration : 0);
  let eDelayFunc = d => delay + (waitForExit && !xs.empty() ? duration : 0);
  let size = (horizontal ? "width" : "height");

  // Exit
  if (!xs.empty()) {
    onexit.bind(xs.node())(xs, xDelayFunc);

    xs.interrupt("tween")
      .transition("tween")
      .duration(duration)
      .delay(xDelayFunc)
      .style(size, "0px")
      .style("opacity", fade ? 0 : 1)
      .remove();
  }

  // Update
  if (!us.empty())
    onupdate.bind(us.node())(us, uDelayFunc);

  // Enter
  if (!es.empty()) {
    onenter.bind(es.node())(es, eDelayFunc);

    es.style(size, "0px")
      .style("opacity", fade ? 0 : 1)
      .transition("tween")
      .duration(duration)
      .delay(eDelayFunc)
      .style(size, null)
      .style("opacity", 1);
  }

  return this.selectAll("." + selector);
};

// Select element by index
d3.selection.prototype.at = function(i) {
  return this.filter((d,j) => j === i);
};

// Append SVG
d3.selection.prototype.appendSvg = function(width, height) {
  let s = this;
  return s.append("svg")
    .style("width", function(d,i) {
      return width ? width + (isNumber(width) ? "px" : "") : null;
    })
    .style("height", function(d,i) {
      return height ? height + (isNumber(height) ? "px" : "") : null;
    });
};

// Select a parent
d3.selection.prototype.selectParentWithTag = function(tag) {
  tag = tag.toLowerCase();
  let s;
  for (s = this.node(); s && s.tagName !== tag; s = s.parentNode);
  if (!s) return null;
  return d3.select(s);
};
d3.selection.prototype.selectParentWithClass = function(cl) {
  let s;
  for (s = this.node(); s && !d3.select(s).classed(cl); s = s.parentNode);
  if (!s) return null;
  return d3.select(s);
};

// Interpolate
d3.transition.prototype.interp = function(a,b,f) {
  return this.tween("interp", function() {
    return function(t) {
      f((1-t)*a + t*b);
    };
  });
};

// Delay without transition
d3.selection.prototype.delay = function(ms) {
  return this.transition("delay").delay(ms);
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

  if (fade)
    s = s.style("opacity", 1);

  return this;
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

  if (fade)
    s = s.style("opacity", 1);

  return this;
};

// Fade In
d3.selection.prototype.fadeIn = function({
  duration = TRANSITION_DURATION_MEDIUM,
  delay    = 0
} = {}) {
  this.style("opacity", 0)
    .transition()
    .duration(duration)
    .delay(delay)
    .style("opacity", 1);

  return this;
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

  if (fade)
    s = s.style("opacity", 0);

  return this;
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

  if (fade)
    s = s.style("opacity", 0);

  return this;
};

// Fade Out
d3.selection.prototype.fadeOut = function({
  duration = TRANSITION_DURATION_MEDIUM,
  delay    = 0
} = {}) {
    this.transition()
      .duration(duration)
      .delay(delay)
      .style("opacity", 0);

  return this;
};

// Bar Container
var barProps = d3.local();
d3.selection.prototype.appendBar = function({
  width            = null,
  height           = null,
  background       = null,
  shadow           = false,
  max              = 100,
  minorTickStep    = 0,
  minMinorTick     = 0,
  maxMinorTick     = 100,
  majorTickStep    = 0,
  minMajorTick     = 0,
  maxMajorTick     = 100,
  minorTickWidth   = 2,
  minorTickOpacity = 0.33,
  majorTickWidth   = 2,
  majorTickOpacity = 1,
  labels           = null,
  labelAnchor      = "middle",
  keepLabelsInside = true,
  classes          = []
} = {}) {
  width = functionize(width);
  height = functionize(height);
  background = functionize(background);
  minorTickStep = functionize(minorTickStep);
  minMinorTick = functionize(minMinorTick);
  maxMinorTick = functionize(maxMinorTick);
  majorTickStep = functionize(majorTickStep);
  minMajorTick = functionize(minMinorTick);
  maxMajorTick = functionize(maxMajorTick);
  labels = functionize(labels);

  let b = this.append("div")
    .classed("bar-container", true)
    .style("width", d => width(d) ? width(d) + "px" : null)
    .style("height", d => height(d) ? height(d) + "px" : null);

  for (let c of classes)
    b.classed(c, true);

  // Extend height in case of labels
  let labelHeight = (d => labels(d) !== null ? 28 : 0);

  b.style("height", function(d) {
    return d3.select(this).node().offsetHeight + labelHeight(d) + "px";
  });

  b.each(function(d) {
      barProps.set(this, {
        max:              max,
        minorTickStep:    minorTickStep(d),
        minMinorTick:     minMinorTick(d),
        maxMinorTick:     maxMinorTick(d),
        majorTickStep:    majorTickStep(d),
        minMajorTick:     minMajorTick(d),
        maxMajorTick:     maxMajorTick(d),
        minorTickWidth:   minorTickWidth,
        minorTickOpacity: minorTickOpacity,
        majorTickWidth:   majorTickWidth,
        majorTickOpacity: majorTickOpacity,
        labels:           labels(d),
        labelAnchor:      labelAnchor,
        keepLabelsInside: keepLabelsInside,
        barWidth:         d3.select(this).node().offsetWidth,
        barHeight:        d3.select(this).node().offsetHeight,
        labelHeight:      labelHeight(d)
      })
    });

  // Create SVG surface
  let svg = b.appendSvg("100%", "100%");

  // Drop Shadow
  let s = svg.append("filter")
    .attr("id", "shadow");
  s.append("feOffset")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("in", "SourceAlpha")
    .attr("result", "offOut");
  s.append("feGaussianBlur")
    .attr("in", "offOut")
    .attr("stdDeviation", 1)
    .attr("result", "blurOut");
  s.append("feBlend")
    .attr("in", "SourceGraphic")
    .attr("in2", "blurOut")
    .attr("mode", "normal");

  let g = svg.append("g");

  // Bar background
  let bg = g.append("rect")
    .classed("bar-background", true)
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", "100%")
    .style("fill", d => background(d) ? background(d) : null);
  bg.attr("height", (d,i) => svg.at(i).node().clientHeight - labelHeight(d));
  if (shadow)
    bg.attr("filter", "url(#shadow)");

  // Ticks and mask
  let ticks = svg.append("mask")
    .attr("id", (d,i) => "ticks" + uid++ + i)
  g.attr("mask", (d,i) => "url(#" + ticks.at(i).attr("id") + ")");
  ticks.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("fill", "#000");
  let mask = ticks.append("rect")
    .classed("bar-mask", true)
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", "100%")
    .style("fill", "#fff");
  mask.attr("height", (d,i) => svg.at(i).node().clientHeight - labelHeight(d));
  b.setBarTickStep({
    minorTickStep:   d => minorTickStep(d),
    majorTickStep:   d => majorTickStep(d),
    labels:          d => labels(d)
  });

  return b;
};

// Set Bar Ticks
d3.selection.prototype.setBarTickStep = function({
  minorTickStep   = null,
  majorTickStep   = null,
  labels          = null,
} = {}) {
  let ticks = this.select("svg").select("mask");

  let xFunc = function(t,i) {
    return (t/barProps.get(this).max) * i * barProps.get(this).barWidth;
  };

  if (minorTickStep !== null) {
    minorTickStep = functionize(minorTickStep);
    this.each(function(d) {
      barProps.get(this).minorTickStep = minorTickStep(d);
    });

    ticks.selectAll(".minor")
      .remove();
    ticks.selectAll(".minor")
      .data(function(d) {
        return (minorTickStep(d)
          ? new Array(Math.floor(Math.min(barProps.get(this).maxMinorTick, barProps.get(this).max - 0.0001)
            / minorTickStep(d))).fill(minorTickStep(d))
          : []);
      })
      .enter()
      .append("line")
      .classed("bar-tick", true)
      .classed("minor", true)
      .attr("x1", function(t,i) {
        return xFunc.bind(this)(t,i+1);
      })
      .attr("y1", 0)
      .attr("x2", function(t,i) {
        return xFunc.bind(this)(t,i+1);
      })
      .attr("y2", "100%")
      .style("stroke-width", function() {
        return barProps.get(this).minorTickWidth;
      })
      .style("opacity", function() {
        return barProps.get(this).minorTickOpacity;
      });
  }
  if (majorTickStep !== null) {
    majorTickStep = functionize(majorTickStep);
    this.each(function(d) {
      barProps.get(this).majorTickStep = majorTickStep(d);
    });

    ticks.selectAll(".major")
      .remove();
    ticks.selectAll(".bar-label")
      .remove();

    let data = function(d) {
      let step = barProps.get(this).majorTickStep;
      return (step ? new Array(Math.floor(Math.min(barProps.get(this).maxMajorTick, barProps.get(this).max - 0.0001) / step)).fill(step) : []);
    };
    ticks.selectAll(".major")
      .data(data)
      .enter()
      .append("line")
      .classed("bar-tick", true)
      .classed("major", true)
      .attr("x1", function(t,i) {
        return xFunc.bind(this)(t,i+1);
      })
      .attr("y1", 0)
      .attr("x2", function(t,i) {
        return xFunc.bind(this)(t,i+1);
      })
      .attr("y2", "100%")
      .style("stroke-width", function() {
        return barProps.get(this).majorTickWidth;
      })
      .style("opacity", function() {
        return barProps.get(this).majorTickOpacity;
      });
  }
  if (labels) {
    labels = functionize(labels);
    this.each(function(d) {
      barProps.get(this).labels = labels(d);
    });

    let svg = this.select("svg");
    svg.selectAll(".bar-label")
      .remove();

    let data = function(d) {
      if (!labels(d))
        return [];
      let step = barProps.get(this).majorTickStep;
      return (step ? new Array(Math.floor(Math.min(barProps.get(this).maxMajorTick, barProps.get(this).max) / step) + 1).fill(step) : []);
    };
    svg.selectAll(".bar-label")
      .data(data)
      .enter()
      .append("text")
      .classed("bar-label", true)
      .classed("numeric-label", true)
      .attr("text-anchor", function() {
        return barProps.get(this).labelAnchor;
      })
      .text(function(t,i) {
        let labels = barProps.get(this).labels;
        return (labels[i] ? labels[i] : t*i).toString().replace(Infinity, "∞");
      })
      .attr("x", function(t,i) {
        let x = xFunc.bind(this)(t,i);
        if (!barProps.get(this).keepLabelsInside)
          return x;
        let w = d3.select(this).node().getBBox().width;
        let lw, rw;
        switch (barProps.get(this).labelAnchor) {
          case "start":
            lw = 0;
            rw = w;
            break;
          case "middle":
            lw = w*0.5;
            rw = lw;
            break;
          case "end":
            lw = w;
            rw = 0;
            break;
        }
        return Math.min(x - Math.min(0, x-lw), barProps.get(this).barWidth - rw);
      })
      .attr("y", function() {
        return barProps.get(this).barHeight - barProps.get(this).labelHeight + 20;
      });
  }

  return this;
}

// Bar Value
d3.selection.prototype.appendBarValue = function({
  color             = null,
  shadow            = false,
  value             = 0.5,
  startValue        = 0,
  label             = false,
  fadeFromZero      = false,
  duration          = TRANSITION_DURATION_MEDIUM,
  delay             = 0
} = {}) {
  let svg = this.select("svg");

  let v = svg.select("g")
    .append("rect")
    .classed("bar-value", true)
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", "100%");

  if (color)
    v.style("fill", color);

  if (label)
    svg.append("text")
      .classed("bar-value-label", true)
      .classed("numeric-label", true)
      .attr("text-anchor", "middle")
      .attr("y", function() {
        return barProps.get(this).barHeight - barProps.get(this).labelHeight + 20;
      });

  v.setBarValue({
    value:      fadeFromZero ? 0 : value,
    startValue: fadeFromZero ? 0 : startValue,
    immediate:  true
  });

  if (fadeFromZero) {
    v.setBarValue({
      value:      value,
      startValue: startValue,
      immediate:  false,
      duration:   duration,
      delay:      delay
    });
  }

  if (shadow)
    v.attr("filter", "url(#shadow)");

  return v;
};

// Set Bar Value
d3.selection.prototype.setBarValue = function({
  value      = 0.5,
  startValue = 0,
  immediate  = false,
  duration   = TRANSITION_DURATION_MEDIUM,
  delay      = 0,
  ease       = d3.easeQuad
} = {}) {
  value = functionize(value);
  startValue = functionize(startValue);

  let l = this.selectParentWithTag("svg")
    .select(".bar-value-label");

  l.text(value);

  function setBar() {
    this.attr("x", function(d) {
        return(startValue(d)/barProps.get(this).max) * 100 + "%";
      })
      .attr("width", function(d) {
        let w = ((value(d) - startValue(d))/barProps.get(this).max) * 100;
        return (w !== Infinity && !isNaN(w) ? w : 0) + "%";
      });
  }

  function setLabel() {
    this.attr("x", function(d,i) {
      let x = ((value(d) - startValue(d))/barProps.get(this).max) * barProps.get(this).barWidth;
      let w = l.at(i).node().getBBox().width;
      let lw, rw;
      switch ("middle") {
        case "start":
          lw = 0;
          rw = w;
          break;
        case "middle":
          lw = w*0.5;
          rw = lw;
          break;
        case "end":
          lw = w;
          rw = 0;
          break;
      }
      return Math.min(x - Math.min(0, x-lw), barProps.get(this).barWidth - rw);
    });
  }

  if (immediate) {
    this.interrupt("fade1")
        .interrupt("fade2");
    setBar.bind(this)();
    setLabel.bind(l)();
  }
  else {
    setBar.bind(this.transition("fade1")
      .duration(duration)
      .delay(delay)
      .ease(ease))();
    setLabel.bind(l.transition("fade2")
      .duration(duration)
      .delay(delay)
      .ease(ease))();
  }

  return this;
};

// Spider Chart
var spiderProps = d3.local();
d3.selection.prototype.appendSpiderChart = function({
  width           = null,
  height          = null,
  max             = 1,
  tick            = 0.25,
  labels          = ["X","Y","Z"],
  anchors         = null,
  anchorOffsets   = null
} = {}) {

  let flipped = false;

  let n = labels.length;
  let c = this.append("div")
    .classed("spider-container", true);

  // Create SVG surface
  let svg = c.appendSvg(width, height);
  width = svg.node().clientWidth;
  height = svg.node().clientHeight;

  spiderProps.set(c, {
    width:      width,
    height:     height,
    max:        max,
    tick:       tick,
    n:          n,

    atoc:       function(angle, value) {
                  let scale = d3.scaleLinear()
                    .domain([0, max])
                    .range([0, height*0.4]);

                  let x = Math.cos(angle) * scale(value);
                  let y = Math.sin(angle) * scale(value) * (flipped ? -1 : 1);
                  return {"x": width*0.5 + x, "y": height*0.5 - y};
                },

     makeLine:  function() {
                  let n = labels.length;
                  return d3.line()
                    .x((d, i) => p.atoc((Math.PI/2) + (2 * Math.PI * i/n), d).x)
                    .y((d, i) => p.atoc((Math.PI/2) + (2 * Math.PI * i/n), d).y)
                    .curve(d3.curveLinearClosed);
                }
  });
  let p = spiderProps.get(c);

  // Scale
  let scale = d3.scaleLinear()
    .domain([0, max])
    .range([0, height*0.4]);

  // Ticks
  let ticks = [];
  for (let i = tick; i <= max; i += tick) {
    ticks.push(i);
  }

  // Draw ticks
  for (let t of ticks) {
    svg.append("path")
      .datum(new Array(n).fill(t))
      .attr("class", t < max ? "spider-tick" : "spider-tick-outer")
      .attr("d", p.makeLine());
  }

  // Label anchors
  if (!anchors) {
    anchors = ["middle"];
    for (let i = 1; i < n; ++i) {
      if (i < n/2) anchors.push("end");
      else if (i == n/2) anchors.push("middle");
      else anchors.push("start");
    }
  }
  if (!anchorOffsets)
    anchorOffsets = new Array(n).fill({x:0,y:0});

  // Draw axes and labels
  for (let i = 0; i < n; ++i) {
    let label = labels[i];
    let angle = (Math.PI/2) + (2 * Math.PI * i/n);
    let lineCoord = p.atoc(angle, max);
    let labelCoord = p.atoc(angle, max + max*0.08);

    // Axes
    svg.append("line")
      .classed("spider-axis", true)
      .attr("x1", width*0.5)
      .attr("y1", height*0.5)
      .attr("x2", lineCoord.x)
      .attr("y2", lineCoord.y);

    // Labels
    svg.append("text")
      .classed("spider-label", true)
      .attr("text-anchor", anchors[i])
      .attr("x", labelCoord.x + anchorOffsets[i].x)
      .attr("y", labelCoord.y + anchorOffsets[i].y)
      .text(label);
  }

  return c;
};

// Spider Chart Data
d3.selection.prototype.appendSpiderChartData = function({
  strokeWidth       = null,
  strokeColor       = null,
  fillColor         = null,
  data              = [],
  fadeFromZero      = false,
  duration          = TRANSITION_DURATION_MEDIUM,
  delay             = 0
} = {}) {
  let p = spiderProps.get(this);

  let svg = this.select("svg");

  let d = svg.append("path")
    .datum(data)
    .classed("spider-shape", true)
    .attr("d", p.makeLine());

  if (strokeWidth !== null)
    d.style("stroke-width", strokeWidth + "px");
  if (strokeColor !== null)
    d.style("stroke", strokeColor);
  if (fillColor !== null)
    d.style("fill", fillColor);

  spiderProps.set(d,p);

  return d;
};

// Set Spider Chart Data
d3.selection.prototype.setSpiderChartData = function({
  data       = [],
  immediate  = false,
  duration   = TRANSITION_DURATION_MEDIUM,
  delay      = 0
} = {}) {
  let p = spiderProps.get(this);

  this.datum(data)
    .transition()
    .duration(delay + duration)
    .ease(d3.easeQuadOut)
    .attr("d", p.makeLine());
}

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
    .style("opacity", fadeFrame ? 0 : 1);

  if (form.ancestor) {
    let type = form.ancestor.evolutions.filter(e => e.descendant.key === form.key)[0].evolutionType;
    if (type) {
      type = type.split("_");
      n.classed("two-lines", true)
        .html(capitalize(type[0]) + "<br/>" + form.pokemon.name + (type[1] ? " " + capitalize(type[1]) : ""));
    }
  }

  if (!selected) {
    w.append("button")
      .attr("type", "button")
      .classed("pokemon-image-hot-area", true)
      .style("width", (width + 4) + "px")
      .style("height", (width + 32) + "px")
      .on("mouseover", function() {
        f.classed("selected", true);
        n.classed("selected", true);
      })
      .on("mouseout", function() {
        f.classed("selected", false);
        n.classed("selected", false);
      })
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
      .style("opacity", 1);
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
    //.style("transform", "scaleY(0)")
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .style("opacity", 1)
    //.style("transform", "scaleY(1)");
}

function fadeOutText(s, delay) {
  delay = (!delay ? 0 : delay);
  s.interrupt()
    .transition()
    .duration(TRANSITION_DURATION_MEDIUM)
    .delay(delay)
    .style("opacity", 0)
    //.style("transform", "scaleY(0)");
}

function animateHeight(selector, duration, expandOnly) {
  let s = d3.select(selector);

  if (!heights[selector])
    heights[selector] = s.node().clientHeight;
  else {
    s.style("height", "auto");
    const oldHeight = heights[selector];
    const newHeight = s.node().clientHeight;
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
