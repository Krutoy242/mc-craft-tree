<template>
  <div>
    <v-menu transition="slide-y-transition" bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" small>
          Extra
        </v-btn>
      </template>
      <v-list>

        <v-list-item v-for="(item, i) in items" :key="i" @click="item.action(graph)">
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>

      </v-list>
    </v-menu>
  </div>
</template>

<script>
const ic2Mult = 0.25;

// ----------------------------
// Temporary save UU values to file
// ----------------------------

import { listUU } from '../assets/js/listUU.js';

function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

function prepareRawListUU(graph) {
  const rawListUU = [];

  // Prepare list ob object with data
  // Filter only "source" nodes
  // and add display name
  graph.nodes.forEach((node) => {
    if (node.steps === 0 && node.complexity !== 1) {
      var obj = listUU.find(x => (x.name === node.name));
      if (obj) {
        obj.uu = node.complexity;
        obj.name = node.name;
      } else {
        obj = {uu: node.complexity, name: node.name};
      }
      obj.display = node.display;
      rawListUU.push(obj);
    }
  });

  // Push presented but unused nodes
  listUU.forEach((l) => {
    if (!rawListUU.find(x => (x.name === l.name))) {
      var node = graph.nodes.find(x => (x.name === l.name));
      rawListUU.push({uu: l.uu, name: l.name, display: node?.display|| ""});
    }
  });
  
  return rawListUU;
}

  // Natural sorting
const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
function naturalSort(array) {
  return array.sort(collator.compare);
}

function saveListUU(graph) {
  
  const listUU_string = [];
  prepareRawListUU(graph).forEach((l) => {
    listUU_string.push(`{uu: ${l.uu.toString().padEnd(9)}, name: "${(l.name + "\"}").padEnd(45)}  // ${l.display}`);
  });

  naturalSort(listUU_string)

  download(
    `export const listUU = [\n${listUU_string.join("\n")}\n];`,
    "listUU.json",
    "text/plain"
  );
}

function saveIC2ini(graph) {

  const listUU_string = [];
  const prepared = prepareRawListUU(graph);
  prepared.sort((a, b) => a.uu - b.uu);
  
  prepared.forEach((l) => {
    const match = l.name.match(/^(([^:]+):[^:]+)(:([^:]+))?/);
    const definition = match[1];
    const source = match[2];
    const meta = match[4];

    if (source === "fluid" ||
        source === "placeholder")
      return;

    const icName = definition + (meta ? "@"+meta : "");
    const display = (l.display && l.display !== "") ? "; "+l.display : "";
    const cost = Math.max(1, (l.uu * ic2Mult) | 0);

    listUU_string.push(`${icName} = ${cost}${display}`);
  });

  // naturalSort(listUU_string);

  download(
    listUU_string.join("\n"),
    "ic2.ini",
    "text/plain"
  );
}

export default {
  name: "download-lists",
  props: {
    graph: {
    },
  },
  data: () => ({
    items: [
      {
        title: "Unmapped UU values",
        action: saveListUU
      },
      {
        title: `IC2.ini [x${ic2Mult}]`,
        action: saveIC2ini
      },
    ],
  }),
};
</script>
