
var vizWidth = window.innerWidth;
var vizHeight = window.innerHeight;


export function makeGraph(graph) {

  // ====================================================
  // Prepare nodes
  // ====================================================

  // Filter all graphNodes
  // Remove elements that dont have inputs or outputs
  const graphLinks = [];
  const graphNodes = graph.nodes.filter(n => {
    if (n.inputs.length > 0 || n.outputs.length > 0) {

      for (let i = 0; i < n.inputs.length; i++)
        graphLinks.push({source: n.inputs[i].it.id, target: n.id});

      return true;
    }
    return false;
  });

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

  function xFnc(d) { return vizWidth/2 + compFnc(d)*diffSize*20 - usabFnc(d)*diffSize*20 };


  // Adjust starting positions
  graphNodes.forEach(function (node) {
    node.x = xFnc(node);
    node.y = vizHeight / 4 + node.popularity*10;
  });


  // ====================================================
  // Layout
  // ====================================================
  var simulation = d3.forceSimulation(graphNodes)
    // .force("charge", d3.forceManyBodyReuse().update(forceUpdate).strength(-2000))
    .force("charge", d3.forceManyBody().strength(-2000))
    .force("x", d3.forceX(xFnc).strength(1))
    .force("y", d3.forceY(vizWidth / 2).strength(d => usabFnc(d) + 1))
    .force("link", d3.forceLink(graphLinks).id(d => d.id).distance(diffSize/2).strength(1))
    .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.75))
    .on("tick", ticked);

  // ====================================================
  // KONVA
  // ====================================================

  var stage = new Konva.Stage({
    container: 'konva-container',   // id of container <div>
    width: vizWidth,
    height: vizHeight,
    draggable: true,
  });

  var linkLayer = new Konva.Layer(); stage.add(linkLayer);
  var nodeLayer = new Konva.Layer(); stage.add(nodeLayer);

  graphNodes.forEach(createKNode); nodeLayer.draw();
  graphLinks.forEach(createKLink); linkLayer.draw();

  function ticked() {
    graphLinks.forEach((n,i) => {
      var line = linkLayer.children[i];
      line.points([n.source.x, n.source.y, n.target.x, n.target.y]);
    });
    
    linkLayer.draw();

    graphNodes.forEach((n,i) => {
      var circle = nodeLayer.children[i];
      circle.position({
        x: n.x,
        y: n.y,
      });
    });
    
    nodeLayer.draw();
  }

  function createKNode(d) {
    var circle = new Konva.Circle({
      id: d.id,
      x: d.x,
      y: d.y,
      radius: 10,
      draggable: true,
      d: d,
      fill: d.inputs.length === 0 ? "rgba(67, 113, 165, 0.3)" :
          (d.outputs.length === 0 ? "rgba(0, 145, 7, 0.4)" :
          undefined)
    });
    circle.cache();

    circle.on("dragstart", function(e) {
      this.attrs.d.fx = this.attrs.d.x;
      this.attrs.d.fy = this.attrs.d.y;
    });
    circle.on("dragmove", function(e) {
      this.attrs.d.fx = this.attrs.x;
      this.attrs.d.fy = this.attrs.y;
    });
    circle.on("dragend", function(e) {
      this.attrs.d.fx = null;
      this.attrs.d.fy = null;
      simulation.alphaTarget(0.3).restart();
    });

    nodeLayer.add(circle);
  }

  function linkIdentity(d) {
    return d.source.id + '_' + d.target.id;
  }

  function createKLink(d) {
    var line = new Konva.Line({
      id: linkIdentity(d),
      points: [d.source.x, d.source.y, d.target.x, d.target.y],
      stroke: "#aaa",
      strokeWidth: 2,
      lineCap: "round",
      lineJoin: "round",
    });
    linkLayer.add(line);
  }

  var scaleBy = 0.9;
  stage.on('wheel', (e) => {
    e.evt.preventDefault();
    var oldScale = stage.scaleX();

    var pointer = stage.getPointerPosition();

    var mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    var newScale =
      e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    var newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
  });

  return graphNodes;
}

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
