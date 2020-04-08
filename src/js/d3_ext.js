var heights = {};

// Convenience function for listing data with transitions
function listData({
  container   = d3.select("body"),
  tag         = "div",
  classed     = null,
  data        = [],
  key         = d => d,
  onexit      = () => {},
  onupdate    = () => {},
  onenter     = () => {},
  horizontal  = false,
  fade        = true,
  waitForExit = false,
  duration    = TRANSITION_DURATION_FAST,
  delay       = 0,
  lag         = 0
}) {
  // Update selection
  let us = container.selectAll((classed ? "." + classed : tag) + ":not(.exiting)")
    .data(data, key)
    .order();

  // Exit selection
  let xs = us.exit()
    .classed("exiting", true);

  // Enter selection
  let es = us.enter()
    .append(tag);

  let xDelayFunc = (d,i) => delay + lag * i;
  let uDelayFunc = (d,i) => delay + lag * i + (waitForExit && !xs.empty() && !es.empty() ? duration + lag * (xs.nodes().length-1) : 0);
  let eDelayFunc = (d,i) => delay + lag * i + (waitForExit && !xs.empty() ? duration + lag * (xs.nodes().length-1) : 0);
  let attr = (horizontal ? "width" : "height");

  // Exit
  if (!xs.empty()) {
    onexit.bind(xs.node())(xs, xDelayFunc);

    xs.interrupt()
      .transition()
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
  if (classed)
    es.classed(classed, true);

  if (!es.empty()) {
    onenter.bind(es.node())(es, eDelayFunc);
    let size = (horizontal ? es.node().offsetWidth : es.node().offsetHeight) + "px";

    es.style(attr, "0px")
      .style("opacity", fade ? 0 : 1)
      .transition()
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
}) {
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
}) {
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
}) {
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
}) {
  let s = this.transition()
    .duration(duration)
    .delay(delay)
    .ease(ease)
    .style("transform", "scaleY(0)");

  return fade ? s.style("opacity", 0) : s;
};

d3.selection.prototype.appendTypeIcon = function(typeFunc) {
  return this.append("img")
    .classed("type-icon", true)
    .attr("src", d => "img/types/" + (typeFunc ? typeFunc(d).key : d.key) + ".svg");
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
