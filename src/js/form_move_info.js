function updateMoveInfo() {
  updateFastMoves();
  updateChargedMoves();
}

function updateFastMoves() {
  listData({
    data:        selectedForm.movePool.fast.sort((m1,m2) => m2.move.stats.gymsAndRaids.power - m1.move.stats.gymsAndRaids.power),
    key:         d => d.move.key,
    container:   d3.select("#form-fast-moves"),
    classed:     "form-fast-move-wrapper",
    fade:        true,
    waitForExit: true,
    duration:    TRANSITION_DURATION_MEDIUM,
    onenter: function(s, delay) {
      let color = (d => mixColors("#222", d.move.type.color, 0.25));

      s = s.append("div")
        .classed("form-move-body", true)
        .classed("exclusive", (d => d.exclusive))
        .style("background", color);

      s.append("div")
        .classed("form-move-exclusive-label", true)
        .text("Exclusive");

      let l = s.append("div")
        .classed("form-move-caption", true);

      l.appendTypeIcon(d => d.move.type)
        .attr("title", d => d.move.type.name + "-type move")
        .zoomIn({
          delay: delay
        });

      l.append("div")
        .classed("caption", true)
        .text(d => d.move.name)
        .zoomInY({
          delay: delay
        });

      // let db = s.appendBar({
      //   height: 16,
      //   segments: 3,
      //   separatorColor: color
      // });
      //
      // db.appendBarValue({
      //   initialValue: d => d.move.stats.gymsAndRaids.duration / 3000,
      //   fadeFromZero: true,
      //   delay: delay
      // });
      //
      // db.appendBarValue({
      //   initialValue: d => d.move.stats.gymsAndRaids.damageWindow.end / 3000,
      //   initialStartValue: d => d.move.stats.gymsAndRaids.damageWindow.start / 3000,
      //   color: "#c80",
      //   fadeFromZero: true,
      //   delay: delay
      // });
    },
    onexit: function(s, delay) {
      s = s.select(".form-move-body");

      let l = s.select(".form-move-caption");

      l.select(".type-icon").zoomOut({
          delay: delay
        });

      l.select(".caption")
        .zoomOutY({
          delay: delay
        });
    }
  });
}

function updateChargedMoves() {
  listData({
    data:        selectedForm.movePool.charged.sort((m1,m2) => m2.move.stats.gymsAndRaids.power - m1.move.stats.gymsAndRaids.power),
    key:         d => d.move.key,
    container:   d3.select("#form-charged-moves"),
    classed:     "form-charged-move-wrapper",
    fade:        true,
    waitForExit: true,
    duration:    TRANSITION_DURATION_MEDIUM,
    onenter: function(s, delay) {
      s = s.append("div")
        .classed("form-move-body", true)
        .classed("exclusive", (d => d.exclusive))
        .style("background", d => mixColors("#222", d.move.type.color, 0.25));

      s.append("div")
        .classed("form-move-exclusive-label", true)
        .text("Exclusive");

      let l = s.append("div")
        .classed("form-move-caption", true);

      l.appendTypeIcon(d => d.move.type)
        .attr("title", d => d.move.type.name + "-type move")
        .zoomIn({
          delay: delay
        });

      l.append("div")
        .classed("caption", true)
        .text(d => d.move.name)
        .zoomInY({
          delay: delay
        });
    },
    onupdate: function(s, delay) {
      s.select(".form-move-body")
        .classed("exclusive", (d => d.exclusive));
    },
    onexit: function(s, delay) {
      s = s.select(".form-move-body");

      let l = s.select(".form-move-caption");

      l.select(".type-icon").zoomOut({
          delay: delay
        });

      l.select(".caption")
        .zoomOutY({
          delay: delay
        });
    }
  });
}
