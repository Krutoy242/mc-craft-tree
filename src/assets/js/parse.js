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

function clearEmpties(o) {
  if (!o) return;
  
  for (var k in o) {
    if (!o[k] || typeof o[k] !== "object") {
      continue // If null or not an object, skip to the next iteration
    }

    // The property is an object
    clearEmpties(o[k]); // <-- Make a recursive call on the nested object
    if (Object.keys(o[k]).length === 0) {
      delete o[k]; // The object had no properties, so delete that property
    }
  }
}


export function parseRawRecipes(groups, parsedData) {

  // ====================================================
  // Organize raw Just Enough Calculation json input
  // ====================================================

  function prepareEntry(raw, isMutate) {
    clearEmpties(raw.content.nbt);

    if (isMutate) {
      const nbt = raw.content?.nbt;

      // Replace bucket with liquid to actual liquid
      if (raw.content?.item === "forge:bucketfilled") {
        raw.type = "fluidStack";
        raw.content = {
            amount: 1000,
            fluid: nbt?.FluidName || "<<Undefined Fluid>>"
          };
      }
    }
  }

  // Try to remove placeholders that created only to extend ingredient count
  var remIndexes = [];
  groups.Default.forEach((dd, ii) => {
    dd.input.forEach((raw, jj) => {

      prepareEntry(raw, true);

    });


    var wasRemoved = false;
    function replaceInList(craft, listName, phRaw) {
      var pos = craft[listName].map(e => e.content?.name).indexOf(phRaw.content.name);
      if (pos != -1 && craft[listName][pos].type === "placeholder") {
        craft[listName].splice(pos, 1);
        craft[listName] = craft[listName].concat(dd.input);
        wasRemoved = true;
      }
    }

    // Special case for placeholder in output:
    // Add its all inputs to recipe where it represent input
    dd.output.forEach(raw => {

      prepareEntry(raw);

      if (raw.type === "placeholder") {
        groups.Default.forEach(craft => {
          replaceInList(craft, 'input',    raw);
          // replaceInList(craft, 'catalyst', raw);
        });
      } else {
        // Replace oredict to itemstacks if needed
        mutateOreToItemstack(raw, parsedData);
      }
    });

    dd.catalyst.forEach(raw => {
      prepareEntry(raw, true);
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
  function pushNodeFnc(raw, isForced) {
    const node = new TreeNode(raw, parsedData);
    const found = graph.nodes.find(n => isForced ? node.match(n) : n.match(node));

    if (found){
      return found;
    } else {
      graph.nodes.push(node);

      // // Add automatic crafts for reserviours with liquids
      // const nbt = raw.content?.nbt;
      // const fluidName = nbt?.Fluid?.FluidName;
      // const fluidAmount = nbt?.Fluid?.Amount;
      // if (raw.type = "itemStack" && fluidName && fluidAmount) {
      //   groups.Default.find(o => o.output.find());
      // }

      return node;
    }
  }

  // ====================================================
  // Create nodes
  // ====================================================
  var DEBUG_NODES_LIMIT = 999999999;
  groups.Default.forEach(function (d, recipeIndex) {
    if (DEBUG_NODES_LIMIT <= 0) return; DEBUG_NODES_LIMIT -= 1;

    d.output.forEach(output => {
      if(output.type === "empty") return;

      const outNode = pushNodeFnc(output, true);

      // If we already have recipe for this item, remove previous
      if (outNode.inputs.length !== 0 && d.input.length > 0) {
        outNode.inputs = [];
      }

      // Add inputs
      d.input.forEach(input => {
        if(input.type === "empty") return;
        
        const inNode = pushNodeFnc(input);
        const weight = amount(input) / amount(output);

        outNode.inputs.push({ it: inNode,  weight: weight, recipeIndex: recipeIndex});
        inNode.outputs.push({ it: outNode, weight: weight, recipeIndex: recipeIndex});
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