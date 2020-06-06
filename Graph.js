// Program for making sprite: Texutre Packer
// https://www.codeandweb.com/texturepacker

var width = 800;
var height = 600;
var color = d3.scaleOrdinal(d3.schemeCategory10);

function itemStackToString(item, meta) {
  return `${item.replace(":", "__")}__${meta | 0}`;
}

function itemToString(obj) {
  switch (obj.type) {
    case "itemStack":
      return itemStackToString(obj.content.item, obj.content.meta);
    // return `${obj.content.item.replace(":", "__")}__${obj.content.meta | 0}`;
    case "fluidStack":
      return `fluid__${obj.content.fluid}`;
    case "placeholder":
      return `placeholder__${obj.content.name}`;
    case "oreDict":
      return `ore__${obj.content.name}`;
    case "empty":
      return;
    default:
      console.log("Unable to find item type", obj.type);
  }

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
    if (id) {
      var pos = graph.nodes.map(e => e.id).indexOf(id);
      if (pos === -1) {
        var node = {
          id: id,
          raw: o,
          complicity: 1,
          outputs: [],
          inputs: []
        };
        graph.nodes.push(node);
        return node;
      } else {
        return graph.nodes[pos]
      }
    }
  }

  // function deepComplicity(obj){
  //   obj.complicity = (obj.complicity | 0) + 1;
  //   console.log("updated complicity for ", obj, obj.outputs);
  //   if(obj.outputs) obj.outputs.forEach(out => deepComplicity(out));
  // }

  // Create nodes and links
  unparsedGraph.Default.forEach(function (d, i) {
    d.output.forEach(output => {
      var outNode = pushNodeFnc(output);
      // var reducer = (a, v) => {
      //   console.log("reduce a,v = ", a,v);
      //   return a + (v?.inputs ? v.inputs.reduce(reducer, a) : 1);
      // };
      // // outNode.complicity = (outNode.complicity | 0) + d.input.length;
      // outNode.complicity = (outNode.complicity | 0) + reducer(0, output);

      d.input.forEach(input => {
        var idTarget = itemToString(output);
        var idSource = itemToString(input);

        if (idTarget && idSource) {
          graph.links.push({
            target: idTarget,
            source: idSource
          });

          // Increment complicity because we have link
          // deepComplicity(output);
        }
        var inNode = pushNodeFnc(input);
        if (inNode) {
          outNode.inputs.push(inNode);
        }
      });
    });
  });

  function deepComplicity(node, antiLoop = []) {
    // console.log(node.id);

    var a = 0;
    antiLoop.push(node);
    node.inputs.forEach(inp => {
      var check = false;
      antiLoop.forEach(o => check |= (o.id == inp.id));
      return a += check ? 1 : deepComplicity(inp, antiLoop);
    });
    // console.log("new a=",a);
    return a;
  }

  graph.nodes.forEach(node => {
    node.complicity = deepComplicity(node);
  });

  // Create all links and nodes
  // iterateAllLinks((input, output) => {
  //   var idTarget = itemToString(output);
  //   var idSource = itemToString(input);

  //   if (idTarget && idSource) {
  //     graph.links.push({
  //       target: idTarget,
  //       source: idSource
  //     });
  //   }

  //   pushNodeFnc(output);
  //   pushNodeFnc(input);
  // });


  // ====================================================
  // 
  // ====================================================


  function sizeFnc(d) {
    return d.complicity / 1.5 + 32;
    return Math.PI * Math.pow(d.complicity / 30, 2) + 32;
  }

  var labelLayout = d3.forceSimulation(label.nodes)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("link", d3.forceLink(label.links).distance(0).strength(2));

  var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-3000))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(1))
    .force("y", d3.forceY(height / 2).strength(1))
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


  // Promise.all([
  //   d3.json("sheet/Spritesheet.json"),
  //   fetch("crafttweaker.log")
  // ]).then(files => {
  // console.log("Files loaded", files[0], files[1].text());

  // var spritesheetJson = files[0];
  // var ctlog = parseCTlog(files[1].text());

  d3.json("sheet/Spritesheet.json").then(spritesheetJson => {

    graph.nodes.forEach(node => {
      var reg = new RegExp(node.id + ".*");
      var o = null;
      for (let k of Object.keys(spritesheetJson.frames)) {
      // Object.keys(spritesheetJson.frames).forEach(k => {
        if (k.match(reg)) {
          o = spritesheetJson.frames[k];
          break;
        }
      }//);
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
      .attr("height", d => sizeFnc(d) * 2)
      .attr("width", d => sizeFnc(d) * 2)
      .attr("x", d => - sizeFnc(d))
      .attr("y", d => - sizeFnc(d));

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
    link
      .style("opacity", o => o.source.index == index || o.target.index == index ? 1 : 0.1)
      .style("stroke-width", o => o.source.index == index ? 4 : 1.5);
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

function preparseGroups(unparsedGraph, oreAliases) {
  // Try to remove placeholders that created only to extend ingredient count
  var remIndexes = [];
  unparsedGraph.Default.forEach((dd, ii) => {
    var wasRemoved = false;
    dd.output.forEach((obj_output, dd_out_i) => {
      // Special case for placeholder in output:
      // Add its all inputs to recipe where it represent input
      if (obj_output.type === "placeholder") {
        unparsedGraph.Default.forEach(function (d, i) {
          d.output.forEach(output => {
            var pos = d.input.map(e => e.content?.name).indexOf(obj_output.content.name);
            if (pos != -1 && d.input[pos].type === "placeholder") {
              d.input.splice(pos, 1);
              d.input = d.input.concat(dd.input);
              wasRemoved = true;
            }
          });
        });
      }
      // obj_output.inputs = (obj_output.inputs | []).concat(dd.input);
      // console.log("obj_output.inputs:", JSON.stringify(obj_output.inputs));
      // obj_output.inputs = [].concat(dd.input, obj_output.inputs);
      // console.log("obj_output.inputs:", JSON.stringify(obj_output.inputs));
    });
    if (wasRemoved) {
      remIndexes.push(ii);
    } else {
      dd.input.forEach((obj_input, jj) => {
        // Replace oredict to itemstacks if needed
        if (obj_input.type === "oreDict") {
          var oreAlias = oreAliases[obj_input.content.name];
          if (!oreAlias) console.log(oreAliases, obj_input, obj_input.content.name);

          dd.input[jj] = {
            type: "itemStack",
            content: {
              amount: obj_input.content.amount,
              item: oreAlias.item,
              meta: oreAlias.meta
            }
          };
        }
        // obj_input.outputs = ([]).concat(obj_input.outputs, dd.output);
        // dd.input[jj].outputs = (dd.input[jj].outputs | []).concat(dd.output);
      });
    }
  });

  // Create references on parents and chinlds
  // unparsedGraph.Default.forEach(dd => {
  //   dd.output.forEach(obj => obj.inputs = [].concat(dd.input, obj.inputs));
  //   dd.input.forEach(obj => obj.outputs = [].concat(dd.output, obj.outputs));
  // });




  for (var i = remIndexes.length - 1; i >= 0; i--)
    unparsedGraph.Default.splice(remIndexes[i], 1);
}

function parseCTlog(txt) {
  // var oreNameCapture = `^Ore entries for <ore:([\w]+)> :\n`;
  // var firstItemCapture = `-<([^:>]+:[^:>]+)`;
  // var optionalMetaCapture = `:?([^:>]+)?`;
  // var rgx = new RegExp(oreNameCapture + firstItemCapture + optionalMetaCapture, 'gm');
  var rgx = /^Ore entries for <ore:([\w]+)> :\n-<([^:>]+:[^:>]+):?([^:>]+)?/gm;
  var matches = txt.matchAll(rgx);
  var aliasesObj = {};
  for (const match of matches) {
    // console.log("--", match[1], match[2], match[3]);
    var id = itemStackToString(match[2], match[3]);
    aliasesObj[match[1]] = { id: id, item: match[2], meta: match[3] };
  }
  return aliasesObj;
}

$(document).ready(function () {
  $.ajax({
    url: "__groups.json",
    dataType: "text",
    success: function (data) {
      $.get("crafttweaker.log", ctlogData => {
        var ctlog = parseCTlog(ctlogData);
        var oreAliases = ctlog;

        var text = data
          .replace(/(\W\d+)[LBbs](\W)/gi, "$1$2")
          .replace(/("SideCache".*)\[.*\]/gi, '$1"DataRemoved"');

        var graphObject = JSON.parse(text)
        // makeGraph(graphObject);
        preparseGroups(graphObject, oreAliases);
        makeGraphForceBasedLabelPlacement(graphObject);

      });
    }
  });
});