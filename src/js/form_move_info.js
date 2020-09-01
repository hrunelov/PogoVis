const CHARGES = 6;
const PVE = "gymsAndRaids";
const PVP = "trainerBattles";

var selectedMove;
var collapsedHeights = d3.local();

// Terribly ugly hack to keep the content from stretching the container beyond the bottom,
// because the obnoxious CSS just won't. Don't try this at home.
new ResizeObserver(function() {
  console.log("resize");
  d3.selectAll(".form-move-column")
    .style("max-height", d3.select("#form-move-info-page").node().offsetHeight
                       - d3.select(".form-move-column").node().offsetTop * 0.5
                       + d3.select("#form-selection-bar").node().offsetHeight * 0.5
                       - 12 + "px");
}).observe(d3.select("#form-move-info-page").node());

function updateMoveInfo() {
  updateChargedMoves(PVP);
  updateFastMoves(PVP);
}

function updateFastMoves(battleType) {
  const duration = (battleType === PVE ? "duration" : "turns");
  const energySpeed = (battleType === PVE ? "energyPerSecond" : "energyPerTurn");

  listData({
    data:        selectedForm.movePool.fast.sort((m1,m2) =>
                   m2.move.stats[battleType].damagePerSecond
                 * m2.move.stats[battleType].energyPerSecond
                 * (selectedForm.types.includes(m2.move.type) ? 1.2 : 1)
                 - m1.move.stats[battleType].damagePerSecond
                 * m1.move.stats[battleType].energyPerSecond
                 * (selectedForm.types.includes(m1.move.type) ? 1.2 : 1)),
    key:         d => d.move.key,
    container:   d3.select("#form-fast-moves"),
    classed:     "form-move-wrapper",
    fade:        true,
    waitForExit: true,
    duration:    TRANSITION_DURATION_MEDIUM,
    onenter: function(s, delay) {
      let color1 = (d => mixColors("#222", d.move.type.color, 0.25));
      let color2 = (d => mixColors("#222", d.move.type.color, 0.5));

      s = appendMoveCaption(s, delay);

      // Append duration
      let db = s.appendBar({
        //height:         d => 2 + (d.move.stats[battleType].power/20) * 48,
        max:              battleType === PVE ? 5 : 4,
        minorTickStep:    1,
        majorTickStep:    d => d.move.stats[battleType][duration],
        maxMajorTick:     d => d.move.stats[battleType][duration],
        majorTickOpacity: 0,
        labels:           d => [" ", d.move.stats[battleType][duration] + (battleType === PVE ? " s" : (d.move.stats[battleType][duration] > 1 ? " turns" : " turn"))],
        labelAnchor:      "end"
      }).classed("duration-bar", true);
      db.appendBarValue({
        value:  d => d.move.stats[battleType][duration],
        color:  d => d.move.type.color
      });
      db.appendBarValue({
        startValue: d => d.move.stats[battleType].damageWindow.start * (battleType === PVE ? 1 : 2),
        value:      d => d.move.stats[battleType].damageWindow.end * (battleType === PVE ? 1 : 2),
        color:      d => mixColors(d.move.type.color, "#fff", 0.5),
        shadow:     true
      });
      let dv = db.appendBarValue({
        value:  0,
        shadow: true
      }).classed("sim-value", true);

      // Append energy bar
      let eb = s.appendBar({
        height:           d => 2 + (d.move.stats[battleType].power/20) * 48,
        max:              25 * (battleType === PVE ? 1 : 2),
        minorTickStep:    5,
        minorTickOpacity: 0,
        majorTickStep:    d => (d.move.stats[battleType].energyGain * 0.01) * (100/d.move.stats[battleType][energySpeed]),
        maxMajorTick:     d => 100/d.move.stats[battleType][energySpeed]
      }).classed("energy-bar", true);
      eb.appendBarValue({
        value:  d => 100/d.move.stats[battleType][energySpeed],
        color:  d => d.move.type.color,
        shadow: true
      });
      let ev = eb.appendBarValue({
        value:  0,
        shadow: true
      }).classed("sim-value", true);

      // Select Charge moves
      let c = d3.select("#form-charged-moves")
        .selectAll(".form-move-body");
      let ceb = c.select(".energy-bar");
      let cev = ceb.select("svg")
        .select("g")
        .select(".sim-value");
      let ccv = ceb.select("svg")
        .select("g")
        .select(".charged-value");

      s.on("mouseenter", function(d,i) {

        // Dim other Fast moves
        d3.select("#form-fast-moves")
          .selectAll(".form-move-body")
          .filter(e => e.move.key !== d.move.key)
          .transition("dim")
          .duration(TRANSITION_DURATION_FAST)
          .style("opacity", 0.5);

        // Add fast move ticks to charges
        ceb.setBarTickStep({
          minorTickStep:   d.move.stats[battleType].energyGain,
          labels:          e => ["FASTS",
                                 Math.ceil(e.move.stats[battleType].energyCost/d.move.stats[battleType].energyGain),
                                 Math.ceil((e.move.stats[battleType].energyCost*2)/d.move.stats[battleType].energyGain),
                                 Math.ceil((e.move.stats[battleType].energyCost*3)/d.move.stats[battleType].energyGain)]
        });

        // Highlight Energy labels
        ceb.select("svg")
          .selectAll("text")
          .transition()
          .duration(TRANSITION_DURATION_FAST)
          .style("fill", "#fff");
      })
      .on("click", function(d,i) {
        let fev = ev.at(i);
        let fdv = dv.at(i);

        // Dim Charge moves
        c.selectAll(".form-move-body > div:not(.energy-bar)")
          .transition()
          .duration(TRANSITION_DURATION_FAST)
          .style("opacity", 0.5);

        // Simulate Fast attacks and energy gain
        let nrg = 0;
        function attack() {
          nrg += d.move.stats[battleType].energyGain;
          nrgCapped = Math.min(nrg, 100);

          let millis = d.move.stats[battleType].duration * 1000;
          let dwStart = d.move.stats[battleType].damageWindow.start * 1000;
          let dwEnd = d.move.stats[battleType].damageWindow.end * 1000;
          let gain = d.move.stats[battleType].energyGain;

          // Build up energy on Fast move
          fev.setBarValue({
              value:    d => (nrgCapped * 0.01) * (100/d.move.stats[battleType][energySpeed]),
              duration: 250,
              delay:    dwStart,
              ease:     d3.easeExpOut
            });
          fdv.setBarValue({
              startValue: 0,
              value:      0.05,
              immediate:  true
            })
            .setBarValue({
              startValue: d.move.stats[battleType][duration] - 0.05,
              value:      d.move.stats[battleType][duration],
              duration:   millis,
              ease:       d3.easeLinear
            });

          // Undim and pulse Charge move if energy cost reached
          c.transition()
            .duration(0)
            .delay(dwStart)
            .style("background", e => nrg > gain && nrg % e.move.stats[battleType].energyCost < gain
                                          ? e.move.type.color
                                          : (nrg >= e.move.stats[battleType].energyCost
                                             ? mixColors("#222", e.move.type.color, 0.5)
                                             : mixColors("#222", e.move.type.color, 0.25)))
            .transition()
            .duration(500)
            .ease(d3.easeQuadOut)
            .style("background", e => nrg >= e.move.stats[battleType].energyCost
                                          ? mixColors("#222", e.move.type.color, 0.5)
                                          : mixColors("#222", e.move.type.color, 0.25));

          c.selectAll(".form-move-body > div:not(.energy-bar)")
            .transition()
            .duration(TRANSITION_DURATION_FAST)
            .delay(dwStart)
            .style("opacity", e => nrg >= e.move.stats[battleType].energyCost ? 1 : 0.5);

          // Build up energy on Charge move
          cev.setBarValue({
            value:    nrgCapped,
            duration: 250,
            delay:    dwStart,
            ease:     d3.easeExpOut
          });
          ccv.setBarValue({
            value:    e => e.move.stats[battleType].energyCost * Math.floor(nrgCapped / e.move.stats[battleType].energyCost),
            duration: 500,
            delay:    dwStart,
            ease:     d3.easeExpOut
          });

          // Pulse Fast move
          d3.select(this)
            .transition()
            .duration(0)
            .delay(dwStart)
            .style("background", d.move.type.color);
          d3.select(this)
            .transition()
            .duration(dwEnd - dwStart)
            .delay(dwStart + 1)
            .ease(d3.easeQuadOut)
            .style("background", e => mixColors("#222", e.move.type.color, 0.25));

          d3.select("body")
            .transition()
            .duration(millis)
            .on("end", function() {
              if (nrg < 100)
                attack.bind(this)();
              else
                fdv.setBarValue({
                  value: 0,
                  immediate: true
                });
            }.bind(this));
        }
        attack.bind(this)();
      })
      .on("mouseleave", function() {
        d3.select("body")
          .interrupt();

        // Undim Fast moves
        d3.select("#form-fast-moves")
          .selectAll(".form-move-body")
          .transition("dim")
          .duration(TRANSITION_DURATION_FAST)
          .style("opacity", 1);

        // Reset Fast energy
        d3.select(this)
          .select(".energy-bar")
          .select("svg")
          .select("g")
          .select(".sim-value")
          .setBarValue({
            value:    0,
            duration: TRANSITION_DURATION_FAST
          });

        // Reset Fast color
        d3.select(this)
          .transition()
          .duration(TRANSITION_DURATION_FAST)
          .style("background", color1);

        // Reset duration
        d3.select(this)
          .select(".duration-bar")
          .select("svg")
          .select("g")
          .select(".sim-value")
          .setBarValue({
            value:     0,
            immediate: true
          });

        // Select Charge moves
        let c = d3.select("#form-charged-moves")
          .selectAll(".form-move-body");
        let ceb = c.select(".energy-bar");

        // Undim Charge moves
        c.selectAll("div:not(.energy-bar)")
          .transition()
          .duration(TRANSITION_DURATION_FAST)
          .style("opacity", 1);

        // Reset Charged energy
        ceb.setBarTickStep({
          minorTickStep: 0,
          labels:        ["ENERGY"]
        });
        ceb.select("svg")
          .selectAll("text")
          .transition()
          .duration(TRANSITION_DURATION_FAST)
          .style("fill", "#fff8");

        ceb.select("svg")
          .select("g")
          .selectAll(".sim-value,.charged-value")
          .setBarValue({
            value:    0,
            duration: TRANSITION_DURATION_FAST
          });

        // Reset Charge move color
        c.transition()
          .duration(TRANSITION_DURATION_FAST)
          .style("background", e => mixColors("#222", e.move.type.color, 0.25));

        });
        // .on("click", function() {
        //   if (selectedMove) {
        //     selectedMove.interrupt()
        //       .transition()
        //       .duration(TRANSITION_DURATION_MEDIUM)
        //       .style("height", function() {
        //         return collapsedHeights.get(this) + "px";
        //       });
        //   }
        //   if (equivalent(selectedMove, d3.select(this)))
        //     selectedMove = null;
        //   else {
        //     selectedMove = d3.select(this);
        //     selectedMove.interrupt()
        //       .transition()
        //       .duration(TRANSITION_DURATION_MEDIUM)
        //       .style("height", null);
        //   }
        // })

      // s.each(function() {
      //   collapsedHeights.set(this, d3.select(this).node().offsetHeight-20);
      // });
      // appendMoveEffectiveness(s, delay);
      // s.style("height", function() {
      //   return collapsedHeights.get(this) + "px";
      // });

      // db.appendBarValue({
      //   initialValue: d => d.move.stats.gymsAndRaids.damageWindow.end / 3000,
      //   initialStartValue: d => d.move.stats.gymsAndRaids.damageWindow.start / 3000,
      //   color: "#c80",
      //   fadeFromZero: true,
      //   delay: delay() * 2
      // });
    },
    onupdate: function(s, delay) {
      updateMoveCaption(s);
    },
    onexit: function(s, delay) {
      tearDownMoveCaption(s, delay);
    }
  });
}

function updateChargedMoves(battleType) {
  listData({
    data:        selectedForm.movePool.charged.sort((m1,m2) =>
                    ((m2.move.stats[battleType].damagePerEnergy * (selectedForm.types.includes(m2.move.type) ? 1.2 : 1))
                   * (battleType === PVE ? m2.move.stats[battleType].damagePerSecond * (selectedForm.types.includes(m2.move.type) ? 1.2 : 1) : 1))
                  - ((m1.move.stats[battleType].damagePerEnergy * (selectedForm.types.includes(m1.move.type) ? 1.2 : 1))
                   * (battleType === PVE ? m1.move.stats[battleType].damagePerSecond * (selectedForm.types.includes(m1.move.type) ? 1.2 : 1) : 1)) ),
    key:         d => d.move.key,
    container:   d3.select("#form-charged-moves"),
    classed:     "form-move-wrapper",
    fade:        true,
    waitForExit: true,
    duration:    TRANSITION_DURATION_MEDIUM,
    onenter: function(s, delay) {
      let color = (d => mixColors("#222", d.move.type.color, 0.25));

      s = appendMoveCaption(s, delay);

      // Append duration
      if (battleType === PVE) {
        let db = s.appendBar({
          //height:           d => 2 + (d.move.stats[battleType].power/200) * 48,
          max:              5,
          minorTickStep:    1,
          majorTickStep:    d => d.move.stats[battleType].duration,
          maxMajorTick:     d => d.move.stats[battleType].duration,
          majorTickOpacity: 0,
          labels:           d => [" ", d.move.stats[battleType].duration + " s"],
          labelAnchor:      "end"
        }).classed("duration-bar", true);
        db.appendBarValue({
          value: d => d.move.stats[battleType].duration,
          color: d => d.move.type.color
        });
        db.appendBarValue({
          startValue: d => d.move.stats[battleType].damageWindow.start,
          value:      d => d.move.stats[battleType].damageWindow.end,
          color:      d => mixColors(d.move.type.color, "#fff", 0.5),
          shadow:     true
        });
      }

      // Append energy bar
      let eb = s.appendBar({
        height:           d => 2 + (d.move.stats[battleType].power/200) * 48,
        background:       d => d.move.type.color,
        max:              100,
        majorTickStep:    d => d.move.stats[battleType].energyCost,
        labels:           ["ENERGY"]
      }).classed("energy-bar", true);
      eb.appendBarValue({
        value:  0,
        color:  d => mixColors(d.move.type.color, "#fff", 0.5),
        shadow: true
      }).classed("sim-value", true);
      let cv = eb.appendBarValue({
        value:  0,
        color:  "#fff"
      }).classed("charged-value", true);

      // function loop() {
      //   cv.transition()
      //     .duration(TRANSITION_DURATION_MEDIUM)
      //     .attr("opacity", 0)
      //     .transition()
      //     .duration(TRANSITION_DURATION_MEDIUM)
      //     .attr("opacity", 1)
      //     .on("end", loop);
      // };
      // loop();

      //appendMoveEffectiveness(s, delay);
    },
    onupdate: function(s, delay) {
      updateMoveCaption(s);
    },
    onexit: function(s, delay) {
      tearDownMoveCaption(s, delay);
    }
  });
}

function appendMoveCaption(s, delay) {
  s = s.append("div")
    .classed("form-move-body", true)
    .classed("special", d => d.availability)
    .style("background", d => mixColors("#222", d.move.type.color, 0.25));

  s.append("div")
    .attr("class", d => "form-move-availability-label " + (d.availability ? d.availability : ""))
    .text(d => d.availability);

  let l = s.append("div")
    .classed("form-move-caption", true);

  l.appendTypeIcon(d => d.move.type)
    .attr("title", d => d.move.type.name + " type move");

  l.append("div")
    .classed("caption", true)
    .text(d => d.move.name);

  return s;
}

function appendMoveEffectiveness(s, delay) {
  s.append("div")
    .classed("move-details", true)
    .classed("sub-caption", true)
    .classed("left-aligned", true)
    .classed("remove", d => !d.move.type.effectiveness.find(e => e.damageMultiplier > 1))
    .text("Super Effective against");
  s.append("div")
    .classed("move-details", true)
    .classed("form-move-array", true)
    .classed("form-move-array-types", true)
    .classed("remove", d => !d.move.type.effectiveness.find(e => e.damageMultiplier > 1))
    .selectAll("div")
    .data(d => d.move.type.effectiveness.filter(e => e.damageMultiplier > 1))
    .enter()
    .append("div")
    .classed("form-move-array-type-icon", true)
    .appendTypeIcon(d => d.defendingType);

  s.append("div")
    .classed("move-details", true)
    .classed("sub-caption", true)
    .classed("left-aligned", true)
    .classed("remove", d => !d.move.type.effectiveness.find(e => e.damageMultiplier < 1 && e.damageMultiplier > 0.6))
    .text("Not Very Effective against");
  s.append("div")
    .classed("move-details", true)
    .classed("form-move-array", true)
    .classed("form-move-array-types", true)
    .classed("remove", d => !d.move.type.effectiveness.find(e => e.damageMultiplier < 1 && e.damageMultiplier > 0.6))
    .selectAll("div")
    .data(d => d.move.type.effectiveness.filter(e => e.damageMultiplier < 1 && e.damageMultiplier > 0.6))
    .enter()
    .append("div")
    .classed("form-move-array-type-icon", true)
    .appendTypeIcon(d => d.defendingType);

  s.append("div")
    .classed("move-details", true)
    .classed("sub-caption", true)
    .classed("left-aligned", true)
    .classed("remove", d => !d.move.type.effectiveness.find(e => e.damageMultiplier < 0.6))
    .text("Ineffective against");
  s.append("div")
    .classed("move-details", true)
    .classed("form-move-array", true)
    .classed("form-move-array-types", true)
    .classed("remove", d => !d.move.type.effectiveness.find(e => e.damageMultiplier < 0.6))
    .selectAll("div")
    .data(d => d.move.type.effectiveness.filter(e => e.damageMultiplier < 0.6))
    .enter()
    .append("div")
    .classed("form-move-array-type-icon", true)
    .appendTypeIcon(d => d.defendingType);

  s.selectAll(".remove")
    .remove();
}

function updateMoveCaption(s) {
  s.select(".form-move-body")
    .classed("special", d => d.availability)
    .select(".form-move-availability-label")
    .attr("class", d => "form-move-availability-label " + (d.availability ? d.availability : ""))
    .text(d => d.availability);
}

function tearDownMoveCaption(s, delay) {
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

function tearDownMoveEffectiveness(s) {
  s.selectAll(".move-details")
    .remove();
}
