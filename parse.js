
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

export function parseRawRecipes(unparsedGraph, oreAliases) {

  // ====================================================
  // Organize raw Just Enough Calculation json input
  // ====================================================

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
      });
    }
  });

  // Make indexes unique and remove
  var uniqRemIndexes = [...new Set(remIndexes)];
  for (var i = uniqRemIndexes.length - 1; i >= 0; i--)
    unparsedGraph.Default.splice(uniqRemIndexes[i], 1);

  // ====================================================
  // Create graph and calculate more data
  // ====================================================

  var graph = {
    nodes: [],
    links: []
  };

  // Add node that represents item
  // Return new node or old one if item already present
  function pushNodeFnc(o) {
    var id = itemToString(o);
    if (id) {
      var pos = graph.nodes.map(e => e.id).indexOf(id);
      if (pos === -1) {
        // Create new item in nodes
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
        // Already have item, return it
        return graph.nodes[pos]
      }
    } else {
      // Item have weird .type, "empty" for example
    }
  }

  // Create nodes and links
  unparsedGraph.Default.forEach(function (d, i) {
    d.output.forEach(output => {
      var outNode = pushNodeFnc(output);

      d.input.forEach(input => {
        var idTarget = itemToString(output);
        var idSource = itemToString(input);

        if (idTarget && idSource) {
          graph.links.push({
            target: idTarget,
            source: idSource
          });
        }
        var inNode = pushNodeFnc(input);
        if (inNode) outNode.inputs.push(inNode);
      });
    });
  });

  // ----------------------------
  // calculate complicity
  // ----------------------------
  function deepComplicity(node, antiLoop = []) {
    var a = 0;
    antiLoop.push(node);
    node.inputs.forEach(inp => {
      var check = false;
      antiLoop.forEach(o => check |= (o.id == inp.id));
      return a += check ? 1 : deepComplicity(inp, antiLoop);
    });
    return a;
  }

  graph.nodes.forEach(node => {
    node.complicity = deepComplicity(node);
  });


  // ----------------------------
  // return
  // ----------------------------
  return graph;
}

export function parseCTlog(txt) {
  var rgx = /^Ore entries for <ore:([\w]+)> :\n-<([^:>]+:[^:>]+):?([^:>]+)?/gm;
  var aliasesObj = {};
  for (const match of txt.matchAll(rgx)) {
    // console.log("--", match[1], match[2], match[3]);
    var id = itemStackToString(match[2], match[3]);
    aliasesObj[match[1]] = { id: id, item: match[2], meta: match[3] };
  }
  return aliasesObj;
}
