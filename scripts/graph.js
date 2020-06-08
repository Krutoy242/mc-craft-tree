// Program for making sprite: Texutre Packer
// https://www.codeandweb.com/texturepacker

var width = 800;
var height = 600;

export function makeGraph(graph) {
  // Force-based label placement (d3.v5.js)
  // https://bl.ocks.org/mapio/53fed7d84cd1812d6a6639ed7aa83868#index.html

  function nonLinear(v) {return Math.sqrt(v)}

  function importancy(v, min, max) { return (v - min) / (max + 1) }
  function compFnc(d) { return nonLinear(importancy(d.complicity, graph.minC, graph.maxC)) }
  function usabFnc(d) { return nonLinear(importancy(d.usability,  graph.minU, graph.maxU)) }
  function strokeWfnc(d) { return nonLinear(nonLinear(d.weight)); }
  // function sinFnc(v, min, max) {return Math.max(0.0, Math.sin((v - min) / max * (Math.PI / 2))) }
  // function sinFnc(v, min, max) {return Math.pow((v - min) / max, 3) }

  // function compFnc(d) { return sinFnc(d.complicity, graph.minC, graph.maxC) * 10 }
  // function usabFnc(d) { return sinFnc(d.usability, graph.minU, graph.maxU) * 10 }
  
  var minSize = 20;
  var maxSize = 90;
  var diffSize = maxSize - minSize;

  function sizeFnc(d) {
    var size = (compFnc(d) + usabFnc(d))/2 * maxSize + minSize;
    if( size > maxSize) console.log("Too big size!:", size, d);
    return Math.min(maxSize, size);
  }

  var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-2000))
    // .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(d => height/2 - usabFnc(d)*diffSize*3 + compFnc(d)*diffSize*3).strength(1))
    .force("y", d3.forceY(width / 2).strength(d => usabFnc(d) + 1))
    .force("link", d3.forceLink(graph.links).id(d => d.id).distance(diffSize/2).strength(1))
    .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.75))
    .on("tick", ticked);

  var adjlist = [];
  

  graph.links.forEach(function (d) {
    adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
  });


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
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("stroke-width", d => strokeWfnc)
    .attr("stroke", "#bbb")
    // .attr("marker-end", d => `url(${new URL(`#arrow-licensing`, location)})`);


  var node = container.append("g").attr("class", "nodes")
    // .attr("stroke-linecap", "round")
    // .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g")

  node.append("circle").attr("class", "itemCircle")
    .attr("r", sizeFnc)
    .attr("stroke-width", d => usabFnc(d)*10 + 1)
    .attr("stroke", "#fff")
    .attr("fill", d => {
      return d.inputs.length === 0 ? "rgba(67, 113, 165, 0.3)" :
      (d.outputs.length === 0 ? "rgba(0, 145, 7, 0.4)" :
      "none")
    });


  // var cube = node.append("g").attr("class", "cube").attr("transform", 'scale(0.25) translate(-40, -40)');
  // cube.append("path").attr("fill", "#aaa").attr("d", "M40,46.2 0,23.1 40,0 80,23.1 z");
  // cube.append("path").attr("fill", "#888").attr("d", "M0,23.1 40,46.2 40,92.4 0,69.3 z");
  // cube.append("path").attr("fill", "#444").attr("d", "M40,46.2 80,23.1 80,69.3 40,92.4 z");


  node.each(function(node_d, i) {
    var iconContainer;
    var sizeMetod;
    
    if(true) {
    // if(node_d.usability <= 10) {
      iconContainer = d3.select(this);
      sizeMetod = sizeFnc;
    } else {
      var du = Math.round(node_d.usability);
      var pileData = [];

      while (du > 0) {
        pileData.push({
          v: (du % 10) + 1,
          super: node_d
        });
        du = Math.round(du / 10);
      }

      sizeMetod = (d,i) => Math.pow(sizeFnc(d.super), 2) / 1200 + i*3 + minSize*.75;
      
      iconContainer = d3.select(this).append("g").attr("class", "pile")
        .selectAll("g")
        .data(pileData)
        .enter()
        .append("g")

      // iconContainer.append("circle")
      //   .attr("r", sizeMetod)
      //   .attr("fill", "#aaa");
      

      var pileLayout = d3.forceSimulation(pileData)
        .force("center", d3.forceCenter())
        .force('collision', d3.forceCollide().radius((d,i) => sizeMetod(d,i) * 0.5).strength(0.1))
        .on("tick", () => {
          iconContainer.attr("transform", d => `translate(${d.x},${d.y})`);
        });
    }

    // Image container (with size and centering)
    var nodeSvg = iconContainer.append("svg").attr("class", "icon")
    .attr("height", (d,i) => sizeMetod(d,i) * 2 * 0.9)
    .attr("width", (d,i) => sizeMetod(d,i) * 2 * 0.9)
    .attr("x", (d,i) => - sizeMetod(d,i) * 0.9)
    .attr("y", (d,i) => - sizeMetod(d,i) * 0.9)
    .attr("viewBox", d => d.viewBox || d.super.viewBox)
    .append("image") // Actual item icon
      .attr("xlink:href", "./resources/Spritesheet.png")
      .attr("image-rendering", "pixelated")
      // .attr("viewBox", "0 0 32 32"); // Temporary view box on load
  });

  node.append("g").append("text").attr("class", "itemName")
  .style("display", "none")
  .attr("y", "2em")
  .style("text-anchor", "middle")
  .text(d => d.name)
  .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke", "#d1cec9")
    .attr("stroke-width", 3);


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

  function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
  }

  function focus(d) {
    var datum = d3.select(d3.event.target).datum();
    var index = datum.super?.index || datum.index;
    node.style("opacity", function (o) {
      return neigh(index, o.index) ? 1 : 0.1;
    });
    link
      .style("opacity", o => o.source.index == index || o.target.index == index ? 1 : 0.1)
      .style("stroke-width", o => strokeWfnc(o)*2 + 3)
      .attr("stroke", d => d.source.index == index ? "#aaf" : (d.target.index == index ? "#7f7" : "#bbb"));
  }

  function unfocus() {
    node.style("opacity", 1);
    link
      .style("opacity", 1)
      .style("stroke-width", strokeWfnc)
      .attr("stroke", "#bbb");
  }

  function dragstarted(d) {
    console.log(d);
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

  return node;
}