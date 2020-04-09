/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
function makeHorizontalBar(s, {
  width = 100,
  large = false,
  roundLeft = false,
  roundRight = false,
  transparent = false,
  segments = 0,
  roundValueLeft = false,
  roundValueRight = false,
  reverse = false
} = {}, style) {

  let b = s.append("div")
    .classed("horizontal-bar", true)
    .classed("large", large)
    .classed("round-left", roundLeft)
    .classed("round-right", roundRight)
    .classed("transparent", transparent || !segments)
    .style("width", width + "px");

  if (style)
    for (let st of Object.keys(style))
      b.style(st, style[st]);

  for (let i = 0; i < segments; ++i) {
    b.append("div")
      .classed("horizontal-bar-segment", true)
      .classed("start", i === 0)
      .classed("end", i === segments-1);
  }

  let v = b.append("div")
    .classed("horizontal-bar-value", true)
    .classed("reverse", reverse)
    .classed("round-left", roundValueLeft)
    .classed("round-right", roundValueRight);

  return v;
}
