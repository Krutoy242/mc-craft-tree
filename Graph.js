// Program for making sprite: Texutre Packer
// https://www.codeandweb.com/texturepacker

var width = 800;
var height = 600;

export function makeGraph(graph) {
  // Force-based label placement (d3.v5.js)
  // https://bl.ocks.org/mapio/53fed7d84cd1812d6a6639ed7aa83868#index.html


  function sizeFnc(d) {
    return d.complicity / 1.5 + 32;
    // return Math.PI * Math.pow(d.complicity / 30, 2) + 32;
  }

  var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-3000))
    // .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(1))
    // .force("y", d3.forceY(height / 2).strength(1))
    .force("y", d3.forceY(d => height / 2 - Math.sqrt(d.complicity)*60).strength(1))
    .force("link", d3.forceLink(graph.links).id(d => d.id).distance(60).strength(1))
    .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.5))
    .on("tick", ticked);

  var adjlist = [];

  graph.links.forEach(function (d) {
    adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
  });

  function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
  }


  var svg = d3.select("#viz")
    // .attr("width", width)
    // .attr("height", height);
    .attr("width", "100%")
    .attr("height", 800);
  var container = svg.append("g");

  svg.call(
    d3.zoom()
      .scaleExtent([.1, 4])
      .on("zoom", function () { container.attr("transform", d3.event.transform); })
  );

  var types = [
    "licensing",
    "suit"
  ]

  container.append("defs").selectAll("marker")
    .data(types)
    .join("marker")
    .attr("id", d => `arrow-${d}`)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -0.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", "#abf")
    .attr("d", "M0,-5L10,0L0,5");

  const link = container.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("stroke", "rgba(0.2, 0.8, 0.4, 0.2)")
    .attr("marker-end", d => `url(${new URL(`#arrow-licensing`, location)})`);


  var node = container.append("g").attr("class", "nodes")
    // .attr("stroke-linecap", "round")
    // .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g")

  node.append("circle").lower()
    .attr("r", sizeFnc)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)


  // var cube = node.append("g").attr("class", "cube").attr("transform", 'scale(0.25) translate(-40, -40)');
  // cube.append("path").attr("fill", "#aaa").attr("d", "M40,46.2 0,23.1 40,0 80,23.1 z");
  // cube.append("path").attr("fill", "#888").attr("d", "M0,23.1 40,46.2 40,92.4 0,69.3 z");
  // cube.append("path").attr("fill", "#444").attr("d", "M40,46.2 80,23.1 80,69.3 40,92.4 z");

  // node.append("text")
  // .attr("x", -40)
  // .attr("y", "0.31em")
  // .text(d => d.id)
  // .clone(true).lower()
  //   .attr("fill", "none")
  //   .attr("stroke", "white")
  //   .attr("stroke-width", 3);

  d3.json("sheet/Spritesheet.json").then(spritesheetJson => {

    graph.nodes.forEach(node => {
      var reg = new RegExp(node.id + ".*");
      var o = null;
      for (let k of Object.keys(spritesheetJson.frames)) {
        if (k.match(reg)) {
          o = spritesheetJson.frames[k];
          break;
        }
      }
      if (!o) {
        switch (node.raw.type) {
          case "placeholder":
            node.viewBox = "672 1344 32 32";
          default:
            console.log("🖼💢:", node.id);
            node.viewBox = "576 3136 32 32";
        }
      } else {
        node.viewBox = o.frame.x + " " + o.frame.y + " 32 32";
      }
    });

    var nodeSvg = node.append("svg").lower()
      .attr("height", d => sizeFnc(d) * 2 * 0.9)
      .attr("width", d => sizeFnc(d) * 2 * 0.9)
      .attr("x", d => - sizeFnc(d) * 0.9)
      .attr("y", d => - sizeFnc(d) * 0.9);

    nodeSvg.append("image")
      .attr("xlink:href", "sheet/Spritesheet.png")
      .attr("image-rendering", "pixelated");

    nodeSvg.attr("viewBox", d => d.viewBox);
  });

  node.on("mouseover", focus).on("mouseout", unfocus);

  node.call(
    d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );

  function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
      `;
  }

  function ticked() {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  function focus(d) {
    var index = d3.select(d3.event.target).datum().index;
    node.style("opacity", function (o) {
      return neigh(index, o.index) ? 1 : 0.1;
    });
    link
      .style("opacity", o => o.source.index == index || o.target.index == index ? 1 : 0.1)
      .style("stroke-width", o => o.source.index == index ? 4 : 1.5);
  }

  function unfocus() {
    node.style("opacity", 1);
    link.style("opacity", 1);
  }

  function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) graphLayout.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}