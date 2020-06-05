var width = 800;
var height = 600;
var color = d3.scaleOrdinal(d3.schemeCategory10);


function itemToString(obj){
  return `${obj.item.replace(":", "__")}__${obj.meta | 0}`;
}

function makeGraphForceBasedLabelPlacement(unparsedGraph) {
  // Force-based label placement (d3.v5.js)
  // https://bl.ocks.org/mapio/53fed7d84cd1812d6a6639ed7aa83868#index.html

  var graph = {
    nodes: [],
    links: []
  };

  var label = {
    nodes: [],
    links: []
  };

  // ====================================================
  // Parse graph
  // ====================================================
  function pushNodeFnc(o) {
    var id = itemToString(o);
    if (!graph.nodes.some(e => e.id === id)) {
      var node = {
        id: id,
        obj: o
      };
      graph.nodes.push(node);
    }
  }

  unparsedGraph.Default.forEach(function (d, i) {
    if (d.output && d.input) {
      d.output.forEach(output => {
        d.input.forEach(inpt => {
          var input = inpt.content;
          if (input?.item && output?.content?.item) {
            var idTarget = itemToString(output.content);
            var idSource = itemToString(input);
            var link = {
              target: idTarget,
              source: idSource
            }
            graph.links.push(link)

            pushNodeFnc(output.content);
            pushNodeFnc(input);
          }
        });
      });
    }
  });

  // ====================================================
  // 
  // ====================================================
  // graph.nodes.forEach(function (d, i) {
  //   label.nodes.push({ node: d });
  //   label.nodes.push({ node: d });
  //   label.links.push({
  //     source: i * 2,
  //     target: i * 2 + 1
  //   });
  // });


  var labelLayout = d3.forceSimulation(label.nodes)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("link", d3.forceLink(label.links).distance(0).strength(2));

  var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-3000))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(1))
    .force("y", d3.forceY(height / 2).strength(1))
    .force("link", d3.forceLink(graph.links).id(d => d.id).distance(50).strength(1))
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
    "suit",
    "resolved"
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
      .attr("fill", color)
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
    // .append("circle")
    // .attr("r", 5)
    // .attr("fill", function (d) { return color(d.group); })
    // .attr("stroke", "white")
    // .attr("stroke-width", 1.5)
    .append("g")
  

  // var cube = node.append("g").attr("class", "cube").attr("transform", 'scale(0.25) translate(-40, -40)');
  // cube.append("path").attr("fill", "#aaa").attr("d", "M40,46.2 0,23.1 40,0 80,23.1 z");
  // cube.append("path").attr("fill", "#888").attr("d", "M0,23.1 40,46.2 40,92.4 0,69.3 z");
  // cube.append("path").attr("fill", "#444").attr("d", "M40,46.2 80,23.1 80,69.3 40,92.4 z");

  
  var nodeSvg = node.append("svg")
  .attr("height", 64)
  .attr("width", 64)
  .attr("x", -32)
  .attr("y", -32);

  nodeSvg.append("image")
  .attr("xlink:href", "sheet/Spritesheet.png")
  .attr("image-rendering", "pixelated");

  d3.json("sheet/Spritesheet.json").then(data => {
    nodeSvg.attr("viewBox", d => {
      // var o_id = d.id.replace(":", "__") + "__" + d.meta;
      var reg = new RegExp(d.id + ".*");
      var o = null;
      Object.keys(data.frames).forEach(k => {
        if (k.match(reg)) { o = data.frames[k] }
      });
      if (!o){
        console.log("cant find:", d.id);
        return "0 0 32 32";
      } else {
        return o.frame.x + " " + o.frame.y + " 32 32";
      }
    });
  });
  // .attr("height", 30)
  // .attr("width", 30)
    // .attr("xlink:href", "sheet/Spritesheet.png")

  node.on("mouseover", focus).on("mouseout", unfocus);

  node.call(
    d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );

  var labelNode = container.append("g").attr("class", "labelNodes")
    .selectAll("text")
    .data(label.nodes)
    .enter()
    .append("text")
    .text(function (d, i) { return i % 2 == 0 ? "" : d.node.id; })
    .style("fill", "#555")
    .style("font-family", "Arial")
    .style("font-size", 12)
    .style("pointer-events", "none") // to prevent mouseover/drag capture
    // .attr("-webkit-text-stroke", "1px black");

  node.on("mouseover", focus).on("mouseout", unfocus);

  function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
      `;
  }

  function ticked() {

    // node.call(updateNode);
    // link.call(updateLink);
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);

    labelLayout.alphaTarget(0.3).restart();
    labelNode.each(function (d, i) {
      if (i % 2 == 0) {
        d.x = d.node.x;
        d.y = d.node.y;
      } else {
        var b = this.getBBox();

        var diffX = d.x - d.node.x;
        var diffY = d.y - d.node.y;

        var dist = Math.sqrt(diffX * diffX + diffY * diffY);

        var shiftX = b.width * (diffX - dist) / (dist * 2);
        shiftX = Math.max(-b.width, Math.min(0, shiftX));
        var shiftY = 16;
        this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
      }
    });
    labelNode.call(updateNode);

  }

  function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
  }

  function focus(d) {
    var index = d3.select(d3.event.target).datum().index;
    node.style("opacity", function (o) {
      return neigh(index, o.index) ? 1 : 0.1;
    });
    labelNode.attr("display", function (o) {
      return neigh(index, o.node.index) ? "block" : "none";
    });
    link.style("opacity", function (o) {
      return o.source.index == index || o.target.index == index ? 1 : 0.1;
    });
  }

  function unfocus() {
    labelNode.attr("display", "block");
    node.style("opacity", 1);
    link.style("opacity", 1);
  }

  function updateLink(link) {
    link
      .attr("x1", d => fixna(d.source.x))
      .attr("y1", d => fixna(d.source.y))
      .attr("x2", d => fixna(d.target.x))
      .attr("y2", d => fixna(d.target.y));
  }

  function updateNode(node) {
    node.attr("transform", function (d) {
      return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
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

function makeGraph(graph) {
  // https://observablehq.com/@d3/disjoint-force-directed-graph?collection=@d3/d3-force

  var nodes = [];
  var links = [];

  parseGraph(graph,
    link => links.push(link),
    node => nodes.push(node)
  );


  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  var vis = d3.select("body").append("svg:svg")
    .attr("class", "stage")
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

  const link = vis.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

  drag = simulation => {

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  const node = vis.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5)
    .attr("fill", color)
    .call(drag(simulation));

  node.append("title")
    .text(d => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  // invalidation.then(() => simulation.stop());


}


$(document).ready(function () {
  $.ajax({
    url: "__groups.json",
    dataType: "text",
    success: function (data) {
      var text = data
        .replace(/(\W\d+)[LBbs](\W)/gi, "$1$2")
        .replace(/("SideCache".*)\[.*\]/gi, '$1"DataRemoved"');

      var graphObject = JSON.parse(text)
      // makeGraph(graphObject);
      makeGraphForceBasedLabelPlacement(graphObject);
    }
  });
});