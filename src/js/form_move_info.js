function updateMoveInfo() {
  updateFastMoves();
  updateChargedMoves();

  animateHeight("#form-moves-wrapper");
}

function updateFastMoves() {
  d3.select("#form-fast-moves")
    .selectAll("div")
    .remove();

  let m = d3.select("#form-fast-moves")
    .selectAll("div")
    .data(selectedForm.movePool.fast)
    .enter()
    .append("div")
    .classed("form-fast-move-wrapper", true);

  let l = m.append("div")
    .classed("type-label", true)
    .classed("right", true);

  fadeInIcon(l.append("img")
    .classed("type-icon", true)
    .attr("src", d => "img/types/" + d.move.type.key + ".svg"),
    (d,i) => i * TRANSITION_DELAY);

  fadeInText(l.append("div")
    .classed("type-name", true)
    .classed("move-name", true)
    .text(d => d.move.name),
    (d,i) => i * TRANSITION_DELAY);
}

function updateChargedMoves() {
  d3.select("#form-charged-moves")
    .selectAll("div")
    .remove();

  d3.select("#form-charged-moves")
    .selectAll("div")
    .data(selectedForm.movePool.charged)
    .enter()
    .append("div")
    .text(d => d.move.name);
}
