import { parseRawRecipes, parseCTlog, parseSpritesheet } from "./parse.js";
import { makeGraph } from "./graph.js";

$(document).ready(function () {

  // Preload spritesheet
  (new Image()).src="./sheet/Spritesheet.png";

  var rawRecipes, oreAliases, graph, spritesheetJson;

  $.when(
    $.when(
      // File with all recipes information
      $.get("groups.json", data => {
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
      // Required files for making graph loaded
      graph = parseRawRecipes(rawRecipes, oreAliases);
      makeGraph(graph);
    }),

    // Image icons information
    d3.json("sheet/Spritesheet.json").then(data => {
      spritesheetJson = data;
    })
  ).then( () => {
    parseSpritesheet(graph, spritesheetJson);

    d3.selectAll(".icon").attr("viewBox", d => d.viewBox || d.super.viewBox);
  });
});