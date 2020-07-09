import { TreeNode } from './treeNode.js';
import { listUU } from './listUU.js';


function amount(raw) {
  const percent = (raw.content.percent || 100.0) / 100.0;
  var mult = 1.0;
  const name = raw.content.name;
  if (raw.type == "placeholder" && (name == "Ticks"))
    mult = 0.01;
  if (raw.type == "placeholder" && (name == "Mana"))
    mult = 0.001;
  if (raw.type == "placeholder" && (name == "RF"))
    mult = 0.001;
  if ((raw.type == "fluidStack") ||
      (raw.content.item == "thermalfoundation:fluid_redstone") ||
      (raw.content.item == "plustic:plustic.molten_osmium"))
    mult = 0.001;

  return (raw.content.amount || 1.0) * mult * percent;
}

// Replace oredict to itemstacks if needed
function mutateOreToItemstack(raw, parsedData){
  if (raw.type === "oreDict") {
    var oreAlias = parsedData.aliases[raw.content.name];
    if (!oreAlias) { 
      console.log("Cant find OreDict name for:", raw.content.name);
    } else {
      raw.type = "itemStack";
      raw.content.name = undefined;
      raw.content.item = oreAlias.item;
      raw.content.meta = oreAlias.meta;
    }
  }
}


export function parseRawRecipes(groups, parsedData) {

  // ====================================================
  // Organize raw Just Enough Calculation json input
  // ====================================================

  // Try to remove placeholders that created only to extend ingredient count
  var remIndexes = [];
  groups.Default.forEach((dd, ii) => {
    dd.input.forEach((obj_input, jj) => {
      // Replace bucket with liquid to actual liquid
      if (obj_input.content?.item === "forge:bucketfilled") {
        dd.input[jj] = {
          type: "fluidStack",
          content: {
            amount: 1000,
            fluid: obj_input.content?.nbt?.FluidName || "<<Undefined Fluid>>"
          }
        }
      }
    });


    var wasRemoved = false;
    dd.output.forEach((obj_output, dd_out_i) => {
      // Special case for placeholder in output:
      // Add its all inputs to recipe where it represent input
      if (obj_output.type === "placeholder") {
        groups.Default.forEach(function (d, i) {
          d.output.forEach(output => {
            var pos = d.input.map(e => e.content?.name).indexOf(obj_output.content.name);
            if (pos != -1 && d.input[pos].type === "placeholder") {
              d.input.splice(pos, 1);
              d.input = d.input.concat(dd.input);
              wasRemoved = true;
            }
          });
        });
      } else {
        // Replace oredict to itemstacks if needed
        mutateOreToItemstack(obj_output, parsedData);
      }
    });

    if (wasRemoved) {
      remIndexes.push(ii);
    } else {
      dd.input.forEach((obj_input, jj) => {
        // Replace oredict to itemstacks if needed
        mutateOreToItemstack(obj_input, parsedData);
      });
    }
  });

  // Make indexes unique and remove
  var uniqRemIndexes = [...new Set(remIndexes)];
  for (var i = uniqRemIndexes.length - 1; i >= 0; i--)
    groups.Default.splice(uniqRemIndexes[i], 1);

  // ====================================================
  // Create graph and calculate more data
  // ====================================================

  var graph = {
    nodes: [],
    // links: []
  };

  // Add node that represents item
  // Return new node or old one if item already present
  function pushNodeFnc(raw) {
    var id = TreeNode.serializeIEntry(raw);
    if (id) {
      var pos = graph.nodes.map(e => e.id).indexOf(id);
      if (pos === -1) {
        // Create new item in nodes
        const node = new TreeNode(id, raw, parsedData);

        graph.nodes.push(node);
        return node;
      } else {
        // Already have item, return it
        return graph.nodes[pos]
      }
    } else {
      // Item have weird .type, "empty" for example
    }
  }

  // ====================================================
  // Create nodes
  // ====================================================
  var DEBUG_NODES_LIMIT = 999999999;
  groups.Default.forEach(function (d, index) {
    if (DEBUG_NODES_LIMIT <= 0) return; DEBUG_NODES_LIMIT -= 1;

    d.output.forEach(output => {
      if(output.type === "empty") return;

      const outNode = pushNodeFnc(output);

      // If we already have recipe for this item, remove previous
      if (outNode.inputs.length !== 0 && d.input.length > 0) {
        outNode.inputs = [];
      }

      // Add inputs
      d.input.forEach(input => {
        if(input.type === "empty") return;

        const idTarget = TreeNode.serializeIEntry(output);
        const idSource = TreeNode.serializeIEntry(input);
        
        const inNode = pushNodeFnc(input);
        const weight = amount(input) / amount(output);
        // if(outNode.name === "thermalfoundation:material:16"){
        //   console.log('inNode :>> ', inNode);}

        outNode.inputs.push({ it: inNode,  weight: weight, index: index});
        inNode.outputs.push({ it: outNode, weight: weight, index: index});

        
        // const link = {
        //   target: idTarget,
        //   source: idSource,
        //   weight: weight
        // };
        // graph.links.push(link);

      });

      // Add catalysts
      d.catalyst.forEach(catl => {
        const node = pushNodeFnc(catl);
        node.popularity += 1;

        outNode.catalysts.push({ it: node, weight: amount(catl) });
      });
    });
  });

  // ----------------------------
  // Write manual complexity
  // ----------------------------
  graph.nodes.forEach(node => {
    // Mark node a source if it isnt craftable
    if (node.inputs.length === 0) {
      node.steps = 0;

      // lookup for hand-written value
      // Objects with NBT cant have values temporary
      if (!node.nbt) {
        const uuObj = listUU.find(x => (x.name === node.name));
        if (uuObj) node.cost = uuObj.uu;
      }
    } else {
      node.steps = 1;
    }
  });

  // ----------------------------
  // calculate complexity and usability
  // ----------------------------
  graph.listLoops = [];

  // function diveIn(node, memberName, field, defl, antiLoop = []) {
  //   var a = (node[memberName].length === 0) ? node[field] : 0;
  //   node[memberName].forEach(mem => {
  //     var check = false;
  //     antiLoop.forEach(o => check |= (o.id === mem.it.id));
  //     if (check || mem.it.id === node.id) {
  //       if (graph.listLoops.indexOf(node) === -1)
  //         graph.listLoops.push(node);
  //     } else {
  //       antiLoop.push(node);
  //       a += (diveIn(mem.it, memberName, field, defl, antiLoop) + defl) * mem.weight;
  //       antiLoop.pop();
  //     }
  //   });
  //   return a;
  // }

  graph.minU = 999999999999;
  graph.maxU = 0;
  graph.minC = 999999999999;
  graph.maxC = 0;

  graph.nodes.sort(function (a, b) {   
    return a.inputs.length - b.inputs.length
        || b.outputs.length - a.outputs.length;
  });

  graph.nodes.forEach(node => {
    node.calculate((loopNode, listName, link) => {
      if (graph.listLoops.indexOf(loopNode) === -1)
        graph.listLoops.push(loopNode);
    });

    graph.minC = Math.min(graph.minC, node.complexity);
    graph.maxC = Math.max(graph.maxC, node.complexity);
    graph.minU = Math.min(graph.minU, node.usability);
    graph.maxU = Math.max(graph.maxU, node.usability);

  });

  // console.log('graph.minC :>> ', graph.minC);
  // console.log('graph.maxC :>> ', graph.maxC);
  // console.log('graph.minU :>> ', graph.minU);
  // console.log('graph.maxU :>> ', graph.maxU);

  // List of items without icons
  graph.noIcon = [];
  graph.nodes.forEach(node => {
    if (node.isNoIcon) graph.noIcon.push(node);
  });

  // ----------------------------
  // Sort to most unique items on top
  // Also keep it pretty
  // ----------------------------
  const importancyOfKeys = {};
  function sort_n(o) { 
    var diff = 0;
    for (const [key, value] of Object.entries(o))
      if (value !== (TreeNode[key] || 0)) diff += importancyOfKeys[key] || 1;
    return diff - (o.isNoIcon?100:0);
  };
  graph.nodes.sort(function (a, b) {   
    return sort_n(b) - sort_n(a);
  });


  // ----------------------------
  // return
  // ----------------------------
  return graph;
}