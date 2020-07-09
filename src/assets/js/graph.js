
import forceManyBodyReuse from "./d3ForcManyBodyReuse.js"


var vizWidth = window.innerWidth;
var vizHeight = window.innerHeight;

var svg = null;
var zoom = null;
var container = null;
var linkContainer = null;
var nodeContainer = null;
var simulation = null;


export function init() {
  
  svg = d3.select("#viz");
  container = svg.append("g")

  zoom = d3.zoom()
    .scaleExtent([.1, 4])
    .on("zoom", function () { container.attr("transform", d3.event.transform);});
  
  svg.call(zoom)

  linkContainer = container.append("g").attr("class", "linksLayer");
  nodeContainer = container.append("g");
}


function linkArc(d) {
  const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
  return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
}


export function makeGraph(graph, vue, query) {

  if (!container) init();

  // ====================================================
  // Dispose previous
  // ====================================================
  if (simulation) {
    simulation.on("tick", null);
    simulation.stop();
  }

  // ====================================================
  // Prepare nodes
  // ====================================================

  // Filter all graphNodes
  // Remove elements that dont have inputs or outputs
  var graphNodes = null;

  if (query.q) {
    const lookupNode = graph.nodes.find(n => n.id === query.q);

    if (lookupNode) {
      graphNodes = [lookupNode];
      lookupNode.safeDive((link) => {
        if (!graphNodes.find(n => n.id === link.it.id)) {
          graphNodes.push(link.it);
        }
      }, query.outputs ? 'outputs' : 'inputs');
    }
  } 
  
  if (!graphNodes) 
    graphNodes = graph.nodes.filter(n => n.inputs.length > 0 || n.outputs.length > 0);


  const graphLinks = [];
  for (let j = 0; j < graphNodes.length; j++) {
    const n = graphNodes[j];

    for (let i = 0; i < n.inputs.length; i++) {
      const link = n.inputs[i];
      const source = graphNodes.findIndex(o => o.id === link.it.id);

      if (source > -1) {
        graphLinks.push({
          source: source,
          target: j,
          weight: link.weight,
          index: graphLinks.length,
        });
      }
    }
  }


  const options = {
    showLinks:       graphNodes.length < 500,
    showCurvedLinks: graphNodes.length < 100,
    useReuse:        graphNodes.length > 500,
  };

  // ====================================================
  // Math functions
  // ====================================================
  function nonLinear(v) {return Math.sqrt(v)}

  function importancy(v, min, max) { return (v - min) / (max + 1) }
  function compFnc(d) { return nonLinear(importancy(d.complexity, graph.minC, graph.maxC)) }
  function usabFnc(d) { return nonLinear(importancy(d.usability,  graph.minU, graph.maxU)) }
  function strokeWfnc(d) { return nonLinear(nonLinear(d.weight)); }

  var minSize = 20;
  var maxSize = parseInt(graphNodes.length / 9);
  var diffSize = maxSize - minSize;

  function sizeFnc(d) {
    var size = (compFnc(d) + usabFnc(d))/2 * maxSize + minSize;
    return Math.max(minSize, Math.min(maxSize, size));
  }

  function xFnc(d) { return vizWidth/2 + compFnc(d)*diffSize*20 - usabFnc(d)*diffSize*20 };
  

  // Adjust starting positions
  // graphNodes.forEach(function (node) {
  //   node.x = xFnc(node);
  //   node.y = vizHeight / 4 + node.popularity*10;
  // });


  // ====================================================
  // Layout
  // ====================================================
  simulation = d3.forceSimulation(graphNodes)
    .force("charge", (options.useReuse ? forceManyBodyReuse : d3.forceManyBody()).strength(-2000))
    .force("x", d3.forceX(xFnc).strength(1))
    .force("y", d3.forceY(vizHeight / 2).strength(d => usabFnc(d) + 1))
    .force("link", d3.forceLink(graphLinks)/* .id(d => d.id) */.distance(diffSize/2).strength(1))
    .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.75))
    .on("tick", ticked);

  // .call(zoom.transform, 
  //   d3.zoomIdentity.scale(10 / Math.sqrt(graphNodes.length)));

  // ====================================================
  // Links
  // ====================================================
  var link = undefined;
    linkContainer.selectAll("*").remove();
  

  if (options.showLinks) {

    if (options.showCurvedLinks) {
      link = 
        linkContainer
          .attr("fill", "none")
          .selectAll("path")
          .data(graphLinks)
          .join("path")
          .attr("stroke-width", 1)
          .attr("stroke", "#555")
    } else {
      link = 
        linkContainer
          .attr("stroke", "#555")
          .attr("stroke-width", 1)
          .selectAll("line")
          .data(graphLinks)
          .join("line")
    }

    link.each(function(link, i) {
      const d3node = d3.select(this) // Current ONE node

      link.source.outputs .find(l => {
        return l.it.id === link.target.id
      }).d3node = d3node;
      link.target.inputs.find(l => l.it.id === link.source.id).d3node = d3node;
    });
  }

  // ====================================================
  // Nodes
  // ====================================================
  var node = nodeContainer
    .selectAll("g")
    .data(graphNodes)
    // .enter()
    .join(appendNode, updateNode)

  function appendNode(enter) {
    const ec = enter.append("g")
      .style('cursor', 'pointer');

    ec.append("circle");
    ec.append("svg").append("image");

    return updateNode(ec);
  }

  function navig(d, isRightClick) {
    vue.$router.push({ path: 'graph', query: { q: d.id, outputs: isRightClick } }).catch(err => {})
  }

  function updateNode(update) {
    update
      .on("click", d => navig(d))
      .on("contextmenu", d => {
        d3.event.preventDefault();
        navig(d, true);
      })

      .select("circle")
      .attr("r", sizeFnc)
      .attr("stroke-width", d => usabFnc(d)*10 + 1)
      .attr("stroke", "#fff")
      .attr("fill", d => {
        return d.inputs.length === 0 ? "rgba(67, 113, 165, 0.3)" :
        (d.outputs.length === 0 ? "rgba(0, 145, 7, 0.4)" :
        "#111")
      })

    update.select("svg")
      .attr("height", (d,i) => sizeFnc(d,i) * 2 * 0.9)
      .attr("width",  (d,i) => sizeFnc(d,i) * 2 * 0.9)
      .attr("x",      (d,i) => - sizeFnc(d,i) * 0.9)
      .attr("y",      (d,i) => - sizeFnc(d,i) * 0.9)
      .attr("viewBox", d => d.viewBox)
      .select("image")
        .attr("xlink:href", require("@/assets/Spritesheet.png"))
        .attr("image-rendering", "pixelated")

    return update
  };

  node.each(function(d, i) {
    d.d3node = d3.select(this) // Current ONE node
  });

  // ====================================================
  // Events
  // ====================================================

  function ticked() {
    if (link) {
      if (options.showCurvedLinks) {
        link.attr("d", linkArc);
      } else {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      }
    }
      
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  
  // ====================================================
  // Node and links highliting
  // ====================================================

  function diveToList(targetNode, targetDeph, listName, style) {   
    targetDeph = targetDeph || 999999999;
    const isInput = listName === 'inputs';
    var maxDeph = 0;
    
    targetNode.safeDive((link, source, deph) => {
      const currDeph = 1 + targetDeph - deph;
      maxDeph = Math.max(maxDeph, currDeph);

      if (currDeph === targetDeph || targetDeph === 999999999){
        if (link.d3node) {
          if (style)
            style(link.d3node)
          else
            link.d3node
              .attr("stroke-width", strokeWfnc(link) * 3 / (deph) + 1)
              .attr("stroke", isInput ? "#7f7" : "#38f");
        }
      }
    }, listName, null, targetDeph);
    
    return maxDeph;
  }

  function unhighliteLine(linkNode) {
    linkNode
      .attr("stroke-width", 1)
      .attr("stroke", "#555");
  }

  function resetLines(node){
    if (vue.selectedNode) {
      diveToList(node, null, 'inputs' , unhighliteLine);
      diveToList(node, null, 'outputs', unhighliteLine);
    }
  }

  var currIntervalID = null;

  function drawDive() {

    const inDeph = diveToList(vue.selectedNode, vue.selectedDeph, 'inputs');

    if (vue.selectedDeph > inDeph) {
      const targetDeph = vue.selectedDeph - inDeph;
      if (targetDeph > diveToList(vue.selectedNode, targetDeph, 'outputs')) {
        clearInterval(currIntervalID);
      }
    }
    
    vue.selectedDeph += 1;
  }

  function highlite(node) {

    // Reset previous selected node links
    if (options.showLinks) resetLines(vue.selectedNode);

    vue.selectedNode = node;
    
    // Show new links
    if (options.showLinks) {
      vue.selectedDeph = 1;
      clearInterval(currIntervalID);
      currIntervalID = setInterval(drawDive, 100);
    } else {
      const filteredGraph = graphLinks.filter(l => l.target === node || l.source === node);

      link = linkContainer
        .attr("stroke-width", 3)
        .selectAll("line")
        .data(filteredGraph)
        .join("line")
        .attr("stroke", d => d.target === node ? "#7f7" : "#38f")
      
        // if (!d3.event.active) simulation.alphaTarget(0.3);
    }
  }

  function unhighlite(d) {
    if (options.showLinks) {
      resetLines(vue.selectedNode);

      vue.selectedDeph = 0;
      clearInterval(currIntervalID);
    }
  }

  node.on("mouseover", highlite);
  node.on("mouseout", unhighlite);

  // ====================================================
  // Node dragging
  // ====================================================
  {
    node.call(
      d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
    
    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
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
  }

  return node;
}
