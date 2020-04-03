function makePokemonImage(s, width, form, onclick, selected, fadeDelay, fadeFrame, fadeImage) {
  let w = s.append("div")
    .classed("pokemon-image-wrapper", true);

  let f = w.append("div")
    .classed("pokemon-image-frame", true)
    .style("height", width + "px")
    .classed("selected", selected);

  let frameColor = f.style("border-color");
  let backColor = mixColors("#000", form.types[0].color, 0.15);

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
    w.append("div")
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
