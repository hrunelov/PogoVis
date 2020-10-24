/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
const cpCaps = [
  1500,
  2500,
  0
];

var cpCap = cpCaps[0];

var baseStatChart;
var baseStatMax;
var baseStatData;
var statChart;
var statMax;
var statData;
var ivValues = {
  attack: 0,
  defense: 0,
  hp: 0
};
var ivSliderValues = {
  attack: 0.0,
  defense: 0.0,
  hp: 0.0
};

var optimalStatsList;

function updateStatInfo(optimize, recalculateList) {
  d3.selectAll(".form-iv-min")
    .setBarValue({ value: selectedPokemon.untradeable ? 10 : 0 });

  if (optimize && selectedPokemon.untradeable)
    setIv({
      attack:  Math.max(ivValues.attack,  10),
      defense: Math.max(ivValues.defense, 10),
      hp:      Math.max(ivValues.hp,      10)
    });

  if (recalculateList)
    optimalStatsList = listOptimalStatsForCPCap(selectedForm, cpCap);

  updateBaseStats();
  updateStats(optimize);

  let color;
  switch(cpCap) {
    case 1500: color = GREAT_COLOR; break;
    case 2500: color = ULTRA_COLOR; break;
    case 0:    color = MASTER_COLOR; break;
  }
  let darkColor = color + "4";
  let lightColor = mixColors(color, "#fff", 0.5);

  d3.selectAll(".form-iv-value")
    .transition("color")
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("fill", color);

  d3.selectAll(".form-iv-bar")
    .select("svg")
    .select("g")
    .select(".bar-background")
    .transition("color")
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("fill", darkColor);

  d3.select("#form-stats-chart")
    .select(".spider-container")
    .select("svg")
    .select(".spider-shape")
    .transition("color")
    .duration(TRANSITION_DURATION_MEDIUM)
    .style("stroke", lightColor)
    .style("fill", darkColor);
}

function updateBaseStats() {
  if (!baseStatChart) {
    baseStatChart = d3.select("#form-basestats-chart")
      .appendSpiderChart({
        height:         "100%",
        max:            500,
        tick:           125,
        labels:         [
                          "Stamina",
                          "Attack",
                          "Defense"
                        ],
        anchors:        [
                          "middle",
                          "middle",
                          "middle"
                        ],
        anchorOffsets:  [{x:0,y:0}, {x:8,y:16}, {x:-8,y:16}]
      });

    // baseStatMax = baseStatChart.appendSpiderChartData({
    //   strokeWidth: 0.25,
    //   fillColor:   "none",
    //   data:        [0,0,0]
    // });
    baseStatData = baseStatChart.appendSpiderChartData({
      data: [0,0,0]
    });
  }

  // baseStatMax.setSpiderChartData({
  //   data: [
  //           pokedex.max.baseStats.stamina,
  //           pokedex.max.baseStats.attack,
  //           pokedex.max.baseStats.defense
  //         ]
  // });
  baseStatData.setSpiderChartData({
    data: [
            selectedForm.baseStats.stamina,
            selectedForm.baseStats.attack,
            selectedForm.baseStats.defense
          ]
  });
  d3.select("#form-basestats-stamina")
    .text(selectedForm.baseStats.stamina);
  d3.select("#form-basestats-attack")
    .text(selectedForm.baseStats.attack);
  d3.select("#form-basestats-defense")
    .text(selectedForm.baseStats.defense);
}

function updateStats(optimize, recalculate) {
  if (!statChart) {
    statChart = d3.select("#form-stats-chart")
      .appendSpiderChart({
        height:         "100%",
        max:            1,
        tick:           0.25,
        labels:         [
                          "HP",
                          "Attack",
                          "Defense"
                        ],
        anchors:        [
                          "middle",
                          "middle",
                          "middle"
                        ],
        anchorOffsets:  [{x:0,y:0}, {x:8,y:16}, {x:-8,y:16}]
      });

    // statMax = statChart.appendSpiderChartData({
    //   strokeWidth: 0.25,
    //   fillColor:   "none",
    //   data:        [0,0,0]
    // });
    statData = statChart.appendSpiderChartData({
      data: [0,0,0]
    });
  }

  let relative = false;

  let optimal;
  if (optimize) {
    optimal = sortByStatProduct(optimalStatsList.list)[0];
    setIv(optimal.iv);
  }
  else
    optimal = calculateOptimalStats(selectedForm, ivValues.attack, ivValues.defense, ivValues.hp, cpCap);

  // let minStats = statList.minStats;
  // let maxStats = statList.maxStats;

  // statMax.setSpiderChartData({
  //   data: [
  //           pokedex.max.greatStats.hp,
  //           pokedex.max.greatStats.attack,
  //           pokedex.max.greatStats.defense
  //         ]
  // });
  statData.setSpiderChartData({
    data: [
      optimal.stats.hp/(relative ? optimalStatsList.maxStats.hp : 500),
      optimal.stats.attack/(relative ? optimalStatsList.maxStats.attack : 500),
      optimal.stats.defense/(relative ? optimalStatsList.maxStats.defense : 500)
    ]
  });
  d3.select("#form-stats-hp")
    .text(relative ? oneDecimal(optimal.stats.hp/optimalStatsList.maxStats.hp * 100) + "%" : optimal.stats.hp);
  d3.select("#form-stats-attack")
    .text(relative ? oneDecimal(optimal.stats.attack/optimalStatsList.maxStats.attack * 100) + "%" : oneDecimal(optimal.stats.attack));
  d3.select("#form-stats-defense")
    .text(relative ? oneDecimal(optimal.stats.defense/optimalStatsList.maxStats.defense * 100) + "%" : oneDecimal(optimal.stats.defense));

  d3.select("#form-stats-caption")
    .text("At ʟ" + optimal.level);

  // minStatData.setSpiderChartData({
  //   data: [
  //           minStats.hp / maxStats.hp,
  //           minStats.attack / maxStats.attack,
  //           minStats.defense / maxStats.defense
  //         ]
  // });
}

// Select an IV bar
function ivBar(stat) {
  return d3.select("#form-iv-value-" + stat);
}
function ivLabel(stat) {
  return d3.select("#form-iv-label-" + stat);
}

// Set IV
function setIv(iv) {
  ivValues = iv;
  ivSliderValues = iv;
  for (stat in iv) {
    ivBar(stat).setBarValue({value: iv[stat]});
    ivLabel(stat).text(iv[stat]);
  }
}

// League menu
d3.selectAll(".form-league-tab")
  .on("click", (function(d,i) {
    if (d3.select(this).classed("selected"))
      return;

    d3.selectAll(".form-league-tab")
      .classed("selected", false);

    d3.select(this)
      .classed("selected", true);

    cpCap = cpCaps[i];
    updateStatInfo(false, true);
  }));

// IV Sliders
var hoveredSlider = null;
var draggedSlider = null;
var lastMouseX;
let b = d3.selectAll(".form-iv-slider")
  .on("mouseenter", (function() {
    if (!mobile()) {
      hoveredSlider = this;
      d3.select(this)
        .transition()
        .duration(TRANSITION_DURATION_INSTANT)
        .style("background", "#4448");
    }
  }))
  .on("mouseleave", (function() {
    if (!mobile())
      hoveredSlider = null;
    if (draggedSlider !== this)
      d3.select(this)
        .transition()
        .duration(TRANSITION_DURATION_INSTANT)
        .style("background", "#4440");
  }))
  .call(d3.drag()
    .on("start", (function() {
      draggedSlider = this;
      d3.dispatch("drag");
      lastMouseX = d3.mouse(document.body)[0];
      d3.select(this)
        .transition()
        .duration(TRANSITION_DURATION_INSTANT)
        .style("background", "#4448");
    }))
    .on("drag", (function() {
      let v;
      let stat = d3.select(this).attr("value");
      if (mobile()) {
        let delta = (d3.mouse(document.body)[0] - lastMouseX) * 0.1;
        lastMouseX = d3.mouse(document.body)[0];
        v = Math.min(Math.max(ivSliderValues[stat] + delta, selectedPokemon.untradeable ? 10 : 0), 15);
      }
      else {
        const minX = 4;
        const maxX = 296;
        v = Math.max(Math.round(Math.min(Math.max(0, (mouse(this).x-minX)/(maxX-minX)), 1) * 15), selectedPokemon.untradeable ? 10 : 0);
      }
      ivValues[stat] = Math.round(v);
      ivSliderValues[stat] = v;
      ivBar(stat).setBarValue({
        value: Math.round(v),
        ease: d3.easeQuadOut,
        duration: TRANSITION_DURATION_INSTANT
      });
      ivLabel(stat).text(Math.round(v));
      updateStatInfo(false, true);
    }))
    .on("end", (function() {
      ivSliderValues = ivValues;
      draggedSlider = null;
      if (hoveredSlider !== this)
        d3.select(this)
          .transition()
          .duration(TRANSITION_DURATION_INSTANT)
          .style("background", "#4440");
    })))
  .appendBar({
    max:           15,
    majorTickStep: 5,
    height:        12,
    shadow:        true,
    classes:       ["form-iv-bar"]
  });
b.appendBarValue({
  value: 0
}).classed("form-iv-value", true)
  .attr("id", (function() {
    return "form-iv-value-" + d3.select(this).selectParentWithClass("form-iv-slider").attr("value");
  }));
b.appendBarValue({
  value: 0
}).classed("form-iv-min", true);
