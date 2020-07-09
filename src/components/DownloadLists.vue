<template>
  <div>
    <v-menu transition="slide-y-transition" bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on">
          Download Extra
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

function saveListUU(graph) {
  const rawListUU = [];

  // Prepare list ob object with data
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
  
  // Prepare string array for saving to file
  const listUU_string = [];
  rawListUU.forEach((l) => {
    listUU_string.push(`{uu: ${l.uu.toString().padEnd(9)}, name: "${(l.name + "\"}").padEnd(45)}  // ${l.display}`);
  });

  // Natural sorting
  var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
  listUU_string.sort(collator.compare);

  download(
    `export const listUU = [\n${listUU_string.join("\n")}\n];`,
    "listUU.json",
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
    ],
  }),
};
</script>
