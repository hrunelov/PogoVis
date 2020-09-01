/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
var baseStatChart;
var baseStatMax;
var baseStatData;
var statChart;
var statMax;
var statData;

function updateStatInfo() {
  updateBaseStats();
  updateStats();
}

function updateBaseStats() {
  if (!baseStatChart) {
    baseStatChart = d3.select("#form-basestats-chart")
      .appendSpiderChart({
        width:          100,
        height:         100,
        max:            500,
        tick:           100,
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
        anchorOffsets:  [{x:0,y:0}, {x:2,y:6}, {x:-2,y:6}]
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
}

function updateStats() {
  if (!statChart) {
    statChart = d3.select("#form-stats-chart")
      .appendSpiderChart({
        width:          100,
        height:         100,
        max:            500,
        tick:           100,
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
        anchorOffsets:  [{x:0,y:0}, {x:2,y:6}, {x:-2,y:6}]
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

  let statList = listOptimalStatsForCPCap(selectedForm, 1500);
  let list = sortByStatProduct(statList.list);
  let stats = list[0].stats;
  let minStats = statList.minStats;
  let maxStats = statList.maxStats;

  // statMax.setSpiderChartData({
  //   data: [
  //           pokedex.max.greatStats.hp,
  //           pokedex.max.greatStats.attack,
  //           pokedex.max.greatStats.defense
  //         ]
  // });
  statData.setSpiderChartData({
    data: [
            stats.hp,
            stats.attack,
            stats.defense
          ]
  });

  d3.select("#form-stats-caption")
    .text("At ʟ" + list[0].level);

  // minStatData.setSpiderChartData({
  //   data: [
  //           minStats.hp / maxStats.hp,
  //           minStats.attack / maxStats.attack,
  //           minStats.defense / maxStats.defense
  //         ]
  // });
}
