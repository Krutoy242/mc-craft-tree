import { parseRawRecipes } from "./parse.js";
import { makeGraph } from "./graph.js";

$(document).ready(function () {

  // Preload spritesheet
  (new Image()).src = "./resources/Spritesheet.png";

  var groups, parsedData;

  $.when(
    // File with all recipes information
    $.getJSON("resources/groups.json", data => {
      console.log('loaded 1 :>> ', data);
      groups = data;
    }),

    // Image icons information
    $.getJSON("resources/parsedData.json").then(data => {
      console.log('loaded 2 :>> ', data);
      parsedData = data;
    })
  ).then(() => {
    $.when(
      (async () => {
        console.log('loaded 1+2 :>> ');
        const graph = parseRawRecipes(groups, parsedData);

        makeGraph(graph, parsedData);
      })()
    ).then(() => {
      $("#progressbar").hide();
      $("#field").show();
    });
  });
});