import { parseRawRecipes, parseCTlog } from "./parse.js";
import { makeGraph } from "./graph.js";

$(document).ready(function () {

  var rawRecipes, oreAliases;

  $.when(

    // File with all recipes information
    $.get("__groups.json", data => {
      var text = data
        .replace(/(\W\d+)[LBbs](\W)/gi, "$1$2")
        .replace(/("SideCache".*)\[.*\]/gi, '$1"DataRemoved"');

      rawRecipes = JSON.parse(text)
    }, "text"),
    
    // OreDict information
    $.get("crafttweaker.log", data => {
      oreAliases = parseCTlog(data);
    })

  ).then( () => {

    // All files are loaded
    var graph = parseRawRecipes(rawRecipes, oreAliases);
    makeGraph(graph);

  });
});