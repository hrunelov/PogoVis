/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var heights = {};

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
