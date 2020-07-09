<template>
  <div style="position: relative">
    <div style="position: absolute;" class="ma-4 elevation-5">
      <tree-entry v-if="selectedNode" :node="selectedNode"/>
    </div>
    <svg id="viz" >
    </svg>
    <!-- <v-stage :config="configKonva">
      <v-layer>
        <v-circle :config="configCircle"></v-circle>
      </v-layer>
    </v-stage> -->
  </div>
</template>

<script>
// import '../assets/js/d3-force-reuse.min.js';

var width = 800;
var height = 600;

function forceUpdate() {
  var next = 1;
  return function (i, nodes) {
    var curr = Math.floor(20 * Math.log(i));
    if (curr !== next) {
      next = curr;
      return true;
    }
    return false;
  };
}

function makeGraph(graph) {

  if (typeof graph !== "object") return;
  const self = this;

  // ====================================================
  // Prepare nodes
  // ====================================================

  // Filter all graphNodes
  // Remove elements that dont have inputs or outputs
  const graphNodes = graph.nodes.filter(n => n.inputs.length > 0 || n.outputs.length > 0);

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
    // if( size > maxSize) console.log("Too big size!:", size, d);
    return Math.min(maxSize, size);
  }

  function xFnc(d) { return width/2 + compFnc(d)*diffSize*20 - usabFnc(d)*diffSize*20 };
  

  // Adjust starting positions
  graphNodes.forEach(function (node) {
    node.x = xFnc(node);
    node.y = height / 4 + node.popularity*10;
  });


  // ====================================================
  // Layout
  // ====================================================
  var graphLayout = d3.forceSimulation(graphNodes)
    .force("charge", d3.forceManyBodyReuse().update(forceUpdate).strength(-2000))
    // .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(xFnc).strength(1))
    .force("y", d3.forceY(width / 2).strength(d => usabFnc(d) + 1))
    .force("link", d3.forceLink(graphLinks)/* .id(d => d.id) */.distance(diffSize/2).strength(1))
    .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.75))
    .on("tick", ticked);

  var svg = d3.select("#viz")
    // .attr("width", width)
    // .attr("height", height);
    .attr("width", "100%")
    .attr("height", 800);
  var container = svg.append("g")
    // .attr("transform", "translate(500,130) scale(0.28)");

  var zoom = d3.zoom()
    .scaleExtent([.1, 4])
    .on("zoom", function () { container.attr("transform", d3.event.transform);});

  svg.call(zoom)
    .call(zoom.transform, d3.zoomIdentity.translate(500,130).scale(0.28));

  // ====================================================
  // Links
  // ====================================================
  const link = container.append("g")
    // .attr("fill", "none")
    // .selectAll("path")
    // .data(graphLinks)
    // .join("path")
    // .attr("stroke-width", d => strokeWfnc(d)*3 + 3)
    // .attr("stroke", "#999")
    // .attr("marker-end", d => `url(${new URL(`#arrow-licensing`, location)})`)
    // .style("display", "none");
    .attr("stroke", "#999")
    .selectAll("line")
    .data(graphLinks)
    .join("line")
    .attr("stroke-width", 1);

  var adjlist = [];

  graphLinks.forEach(function (d) {
    adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
  });

  function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
      `;
  }

  // ====================================================
  // Nodes
  // ====================================================
  var node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(graphNodes)
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
    })

  node.append("svg").attr("class", "icon")
    .attr("height", (d,i) => sizeFnc(d,i) * 2 * 0.9)
    .attr("width",  (d,i) => sizeFnc(d,i) * 2 * 0.9)
    .attr("x",      (d,i) => - sizeFnc(d,i) * 0.9)
    .attr("y",      (d,i) => - sizeFnc(d,i) * 0.9)
    .attr("viewBox", d => d.viewBox)
    .append("image") // Actual item icon
      .attr("xlink:href", require("@/assets/Spritesheet.png"))
      .attr("image-rendering", "pixelated");


  node.each(function(d, i) {
    d.d3node = d3.select(this) // Current ONE node
  });

  link.each(function(d, i) {
    d.d3node = d3.select(this) // Current ONE node
  });

  // ====================================================
  // Events
  // ====================================================

  

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
      
    // link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  
  function diveToList(targetNode, targetDeph, listName, style) {   
    targetDeph = targetDeph || 999999999;
    const isInput = listName === 'inputs';
    var maxDeph = 0;
    
    targetNode.safeDive((link, source, deph) => {
      const currDeph = 1 + targetDeph - deph;
      maxDeph = Math.max(maxDeph, currDeph);

      if (currDeph === targetDeph || targetDeph === 999999999){
        const d3node = graphLinks.find(l =>
          l[isInput?'source':'target'].id === link.it.id &&
          l[isInput?'target':'source'].id === source.id
        )?.d3node;
        
        if (d3node) {
          if (style)
            style(d3node)
          else
            d3node
              // .style("display", undefined)
              .attr("stroke-width", strokeWfnc(link) * 3 / (deph) + 1)
              .attr("stroke", isInput ? "#7f7" : "#38f");
        }
      }
    }, listName, null, targetDeph);
    
    return maxDeph;
  }

  function unhighliteLine(linkNode) {
    linkNode
      // .style("display", undefined)
      .attr("stroke-width", 1)
      .attr("stroke", "#999");
  }

  function resetLines(node){
    if (self.selectedNode) {
      diveToList(node, null, 'inputs' , unhighliteLine);
      diveToList(node, null, 'outputs', unhighliteLine);
    }
  }

  var currIntervalID = null;

  function drawDive() {

    const inDeph = diveToList(self.selectedNode, self.selectedDeph, 'inputs');

    if (self.selectedDeph > inDeph) {
      const targetDeph = self.selectedDeph - inDeph;
      if (targetDeph > diveToList(self.selectedNode, targetDeph, 'outputs')) {
        clearInterval(currIntervalID);
      }
    }
    
    self.selectedDeph += 1;
  }

  function highlite(d) {
    resetLines(self.selectedNode);

    self.selectedNode = d;
    
    self.selectedDeph = 1;
    clearInterval(currIntervalID);
    currIntervalID = setInterval(drawDive, 100);
  }

  function unhighlite(d) {
    resetLines(self.selectedNode);
    
    self.selectedDeph = 0;
    clearInterval(currIntervalID);
  }

  function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
  }

  node.on("mouseover", d => {
    highlite(d);
  });

  node.on("mouseout", d => {
    unhighlite(d);
    // link
    //   .style("display", "none")
    //   // .style("stroke-width", strokeWfnc)
    //   .attr("stroke", "#bbb");
  });

  // Dragging nodes
  {
    node.call(
      d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
    
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

  return node;
}

export default {
  name: "Graph",
  data() {
    return {
      selectedNode: undefined,
      selectedDeph: 0,

      configKonva: {
        width: 200,
        height: 200
      },

      configCircle: {
        x: 100,
        y: 100,
        radius: 70,
        fill: "red",
        stroke: "black",
        strokeWidth: 4
      }
    }
  },
  props: {
    graph: {
      type: Object,
      required: true
    }
  },

  mounted() {
    this.makeGraph(this.graph);
  },

  methods: {
    makeGraph
  }
};
</script>

<style scoped>


</style>