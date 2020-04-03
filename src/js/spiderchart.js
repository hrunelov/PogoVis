class SpiderChart {
  constructor(s, id, width, height, max, tick, labels) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.max = max;
    this.labels = labels;
    this.flipped = false;

    let n = labels.length;

    s.selectAll("svg")
      .remove();

    // Create SVG surface
    let svg = s.append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + width + " " + height);

    // Scale
    let scale = d3.scaleLinear()
      .domain([0, max])
      .range([0, height*0.4]);

    // Ticks
    let ticks = [];
    for (let i = tick; i <= max; i += tick) {
      ticks.push(i);
    }

    // Draw ticks
    for (let t of ticks) {
      svg.append("path")
        .datum([t,t,t])
        .attr("class", t < max ? "spider-tick" : "spider-tick-outer")
        .attr("d", this.makeLine());
    }

    // Label anchors
    let anchors = ["middle"];
    for (let i = 1; i < n; ++i) {
      if (i < n/2) anchors.push("end");
      else if (i == n/2) anchors.push("middle");
      else anchors.push("start");
    }

    // Draw axes and labels
    for (let i = 0; i < n; ++i) {
      let label = labels[i];
      let angle = (Math.PI/2) + (2 * Math.PI * i/n);
      let lineCoord = this.atoc(angle, max);
      let labelCoord = this.atoc(angle, max + 40);

      // Axes
      svg.append("line")
        .classed("spider-axis", true)
        .attr("x1", width*0.5)
        .attr("y1", height*0.5)
        .attr("x2", lineCoord.x)
        .attr("y2", lineCoord.y);

      // Labels
      svg.append("text")
        .classed("spider-label", true)
        .attr("text-anchor", anchors[i])
        .attr("x", labelCoord.x)
        .attr("y", labelCoord.y)
        .text(label);
    }

    svg.append("path")
      .datum([0,0,0])
      .classed("spider-shape", true)
      .attr("id", id)
      .attr("d", this.makeLine());
  }

  // Angle to coordinates
  atoc(angle, value) {
    let scale = d3.scaleLinear()
      .domain([0, this.max])
      .range([0, this.height*0.4]);

    let x = Math.cos(angle) * scale(value);
    let y = Math.sin(angle) * scale(value) * (this.flipped ? -1 : 1);
    return {"x": this.width*0.5 + x, "y": this.height*0.5 - y};
  }

  makeLine() {
    let n = this.labels.length;
    return d3.line()
      .x((d, i) => this.atoc((Math.PI/2) + (2 * Math.PI * i/n), d).x)
      .y((d, i) => this.atoc((Math.PI/2) + (2 * Math.PI * i/n), d).y)
      .curve(d3.curveLinearClosed);
  }

  update(data) {
    d3.select("#" + this.id)
      .datum(data)
      .transition()
      .duration(TRANSITION_DURATION_MEDIUM)
      .attr("d", this.makeLine());
  }
}
