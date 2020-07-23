
import forceManyBodyReuse from "./d3ForcManyBodyReuse.js"


var vizWidth = window.innerWidth;
var vizHeight = window.innerHeight;

var svg = null;
var container = null;
var linkContainer = null;
var nodeContainer = null;
var simulation = null;
var axisContainer = null;


export function init() {
  
  svg = d3.select("#viz");
  container = svg.append("g");

  axisContainer = container.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0,-20)");

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


export function makeGraph(graph, vue, query, isScatter) {

  if (!container) init();

  // ====================================================
  // Dispose previous
  // ====================================================
  if (simulation) {
    simulation.on("tick", null);
    simulation.stop();
    simulation = undefined;
  }

  // ====================================================
  // Prepare nodes
  // ====================================================

  // Filter all graphNodes
  // Remove elements that dont have inputs or outputs
  var graphNodes = null;

  
  // Find selected node to show only it
  if (query.q) {
    const lookupNode = graph.nodes.find(n => n.id === query.q);

    if (lookupNode) {
      graphNodes = [lookupNode];
      lookupNode.safeDive(query.outputs ? 'outputs' : 'inputs', 
      (link) => {
        if (!graphNodes.find(n => n.id === link.it.id)) {
          graphNodes.push(link.it);
        }
      });
    }
  } 
  
  // If no selection provided, select everything, except items without inputs and outputs
  // If scattered, select only nodes without crafts
  if (!graphNodes) {
    if (!isScatter) {
      graphNodes = graph.nodes.filter(n => n.inputs.length > 0 || n.outputs.length > 0);
    } else {
      const whitelist = [
        "actuallyadditions:block_display_stand",
        "actuallyadditions:block_empowerer",
        "actuallyadditions:item_crystal_empowered:5",
        "actuallyadditions:item_crystal:5",
        "appliedenergistics2:material:38",
        "appliedenergistics2:material:46",
        "astralsorcery:itemcraftingcomponent:2",
        "astralsorcery:itemcraftingcomponent:4",
        "avaritia:resource:5",
        "avaritia:resource:6",
        "bloodmagic:altar",
        "botania:livingrock",
        "botania:manaresource:7",
        "draconicevolution:draconic_ingot",
        "environmentaltech:aethium_crystal",
        "environmentaltech:aethium",
        "environmentaltech:erodium_crystal",
        "environmentaltech:erodium",
        "environmentaltech:ionite_crystal",
        "environmentaltech:ionite",
        "environmentaltech:kyronite_crystal",
        "environmentaltech:kyronite",
        "environmentaltech:laser_lens",
        "environmentaltech:litherite_crystal",
        "environmentaltech:litherite",
        "environmentaltech:pladium_crystal",
        "environmentaltech:pladium",
        "environmentaltech:solar_cont_6",
        "environmentaltech:void_ore_miner_cont_1",
        "environmentaltech:void_ore_miner_cont_2",
        "environmentaltech:void_ore_miner_cont_3",
        "environmentaltech:void_ore_miner_cont_4",
        "environmentaltech:void_ore_miner_cont_5",
        "environmentaltech:void_ore_miner_cont_6",
        "extendedcrafting:crafting_core",
        "extendedcrafting:material:2",
        "extendedcrafting:material:7",
        "extendedcrafting:material:12",
        "extendedcrafting:material:13",
        "extendedcrafting:pedestal",
        "extendedcrafting:singularity_ultimate",
        "extendedcrafting:storage",
        "extendedcrafting:table_advanced",
        "extendedcrafting:table_basic",
        "extendedcrafting:table_elite",
        "extrautils2:decorativesolid:3",
        "forestry:carpenter",
        "forestry:centrifuge",
        "ic2:te:43",
        "ic2:te:86",
        "immersiveengineering:metal_decoration0:5",
        "integrateddynamics:drying_basin",
        "integrateddynamics:squeezer",
        "matc:inferiumcrystal",
        "matc:intermediumcrystal",
        "matc:prudentiumcrystal",
        "matc:superiumcrystal",
        "mekanism:compresseddiamond",
        "mekanism:compressedredstone",
        "mekanism:machineblock",
        "mekanism:machineblock2:11",
        "minecraft:beacon",
        "minecraft:blaze_powder",
        "minecraft:brick",
        "minecraft:coal_block",
        "minecraft:coal:1",
        "minecraft:crafting_table",
        "minecraft:diamond_block",
        "minecraft:ender_eye",
        "minecraft:furnace",
        "minecraft:glass_pane",
        "minecraft:glass",
        "minecraft:gold_block",
        "minecraft:gold_nugget",
        "minecraft:gunpowder",
        "minecraft:iron_bars",
        "minecraft:iron_block",
        "minecraft:iron_nugget",
        "minecraft:lapis_block",
        "minecraft:nether_brick",
        "minecraft:netherbrick",
        "minecraft:planks",
        "minecraft:quartz_block",
        "minecraft:redstone_block",
        "minecraft:stick",
        "minecraft:sugar",
        "minecraft:tnt",
        "mysticalagriculture:crafting:1",
        "mysticalagriculture:crafting:2",
        "mysticalagriculture:crafting:3",
        "mysticalagriculture:crafting:4",
        "nuclearcraft:chemical_reactor_idle",
        "nuclearcraft:fusion_core",
        "nuclearcraft:ingot:8",
        "opencomputers:material:4",
        "psi:material:1",
        "rftools:powercell_creative",
        "rftoolsdim:dimension_builder",
        "storagedrawers:upgrade_creative:1",
        "tconstruct:casting",
        "tconstruct:materials",
        "tconstruct:smeltery_controller",
        "thermalexpansion:machine:7",
        "thermalfoundation:material:32",
        "thermalfoundation:material:165",
        "thermalfoundation:material:256",
        "thermalfoundation:material:320",
        "thermalfoundation:material:352",
        "thermalfoundation:material:768",
        "thermalfoundation:material:770",
      ];
      graphNodes = graph.nodes.filter(n => {
        if (n.inputs.length === 0) return true;
        if (whitelist.includes(n.name)) {
          n.isGhost = true;
          return true;
        }
        return false;
      });
    }
  }

  const options = {
    showLinks:       graphNodes.length < 500 && !isScatter,
    showCurvedLinks: graphNodes.length < 100 && !isScatter,
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

  // Scatter functions
  const scaleLog = d3.scaleLog()
    .domain([0.1, 1e12])
    .range([0, 10000])
    .base(10)
    .nice();

  // function getSX(v) { return Math.log(v + 1) * 200; }
  // function setSX(v) { return Math.pow(Math.E, v / 200) - 1; }

  function getSX(v) { return scaleLog(v); }
  function setSX(v) { return scaleLog.invert((v)); }
  
  // 3. Call the x axis in a group tag
  axisContainer.call(d3.axisTop(scaleLog).ticks(20, ".2s")); // Create an axis component with d3.axisBottom

  function updateNodeX(node) {
    node.x = getSX(node.complexity);
  }

  // Adjust starting positions
  if (isScatter) {
    const xObjs = {};
    graphNodes.forEach((node, i) => {
      updateNodeX(node);
      xObjs[node.x] = (xObjs[node.x] || 0) + 1;
      node.y = xObjs[node.x] * 20;
    });
  }

  // ====================================================
  // Layout
  // ====================================================
  if (!isScatter) {
    simulation = d3.forceSimulation(graphNodes)
      .force("charge", (options.useReuse ? forceManyBodyReuse : d3.forceManyBody()).strength(-2000))
      .force("x", d3.forceX(xFnc).strength(1))
      .force("y", d3.forceY(vizHeight / 2).strength(d => usabFnc(d) + 1))
      .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.75))
      .on("tick", ticked);

    // ====================================================
    // Links
    // ====================================================
    var handleHover;
    var linkSelection;

    // Connect graph nodes
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

    simulation
      .force("link", d3.forceLink(graphLinks).distance(diffSize/2).strength(1));

    linkContainer.selectAll("*").remove();
    

    if (options.showLinks) {

      if (options.showCurvedLinks) {
        linkSelection = 
          linkContainer
            .attr("fill", "none")
            .selectAll("path")
            .data(graphLinks)
            .join("path")
            .attr("stroke-width", 1)
            .attr("stroke", "#555")
      } else {
        linkSelection = 
          linkContainer
            .attr("stroke", "#555")
            .attr("stroke-width", 1)
            .selectAll("line")
            .data(graphLinks)
            .join("line")
      }

      linkSelection.each(function(link, i) {
        const d3node = d3.select(this) // Current ONE node

        link.source.outputs.find(l => {
          return l.it.id === link.target.id
        }).d3node = d3node;
        link.target.inputs.find(l => l.it.id === link.source.id).d3node = d3node;
      });
    }

    handleHover = overNode => {
      const filteredGraph = graphLinks.filter(l => l.target === overNode || l.source === overNode);

      linkSelection = linkContainer
        .attr("stroke-width", 3)
        .selectAll("line")
        .data(filteredGraph)
        .join("line")
        .attr("stroke", d => d.target === overNode ? "#7f7" : "#38f")
    }
  }

  // ====================================================
  // Nodes
  // ====================================================
  var nodeSelection = nodeContainer
    .selectAll("g")
    .data(graphNodes)
    .join(appendNode, updateNode);

  function appendNode(enter) {
    const ec = enter.append("g")
      .style('cursor', d => d.isGhost ? undefined : 'pointer')
      .attr("opacity", d => d.isGhost ? 0.1 : 1);

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

  nodeSelection.each(function(d, i) {
    d.d3node = d3.select(this) // Current ONE node
  });

  // ====================================================
  // Events
  // ====================================================

  var globalScale = 1;
  function nodeT(d) {
    if (isScatter)
      return `translate(${d.x},${d.y})scale(${globalScale})`;
    else
      return `translate(${d.x},${d.y})`;
  }

  function ticked() {
    if (linkSelection) {
      if (options.showCurvedLinks) {
        linkSelection.attr("d", linkArc);
      } else {
        linkSelection
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      }
    }
    
    nodeSelection.attr("transform", nodeT);
  }
  ticked();

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([.01, 10])
    .on("zoom", function () {
      container.attr("transform", d3.event.transform);

      if (isScatter) {
        const newScale = 1 / d3.event.transform.k;
        if (globalScale !== newScale) {
          globalScale = newScale
          ticked();
        }
      }
    });
  svg.call(zoom)

  
  // ====================================================
  // Node and links highliting
  // ====================================================

  function diveToList(targetNode, targetDeph, listName, style) {   
    targetDeph = targetDeph || 999999999;
    const isInput = listName === 'inputs';
    var maxDeph = 0;
    
    targetNode.safeDive(listName, (link, source, deph) => {
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
    }, null, targetDeph);
    
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
      // If we have too many nodes, show only links over hovered node
      if (handleHover) handleHover(node);
    }
  }

  function unhighlite(d) {
    if (options.showLinks) {
      resetLines(vue.selectedNode);

      vue.selectedDeph = 0;
      clearInterval(currIntervalID);
    }
  }

  nodeSelection.on("mouseover", highlite);
  nodeSelection.on("mouseout", unhighlite);

  // ====================================================
  // Node dragging
  // ====================================================
  {
    nodeSelection.call(
      d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
    
    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active && simulation) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      if (d.isGhost) return;

      d.fx = d3.event.x;
      d.fy = d3.event.y;
      if (isScatter) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        d.complexity = d.cost = setSX(d.x);
        d3.select(this).attr("transform", nodeT);
      }
    }

    function dragended(d) {
      if (!d3.event.active && simulation) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;

      if (isScatter) {
        d.safeDive('outputs', link => {
          const node = link.it;
          node.recalculateField('cost');
          updateNodeX(node);
        });
        
        ticked();
      }
    }
  }

  return nodeSelection;
}
