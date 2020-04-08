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

function makePokemonImage(s, {
  form = selectedForm,
  width = 75,
  selected = false,
  fadeDelay = 0,
  fadeFrame = true,
  fadeImage = true,
  onclick = function() {}
} = {}) {
  let w = s.append("div")
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
      .style("transform", "scaleY(1)");
  }

  return w;
}
