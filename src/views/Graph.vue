<template>
  <div style="position: relative; height: 100%">
    <div style="position: absolute;" class="ma-4">
      <tree-entry v-if="selectedNode" :node="selectedNode" size="64"/>
    </div>
    <svg id="viz" style="width: 100%; height: 100%"></svg>
    <!-- <v-stage :config="configKonva">
      <v-layer>
        <v-circle :config="configCircle"></v-circle>
      </v-layer>
    </v-stage> -->
  </div>
</template>

<script>

import {init, makeGraph} from "../assets/js/graph.js"

export default {
  name: "Graph",
  data() {
    return {
      selectedNode: undefined,
      selectedDeph: 0,
    }
  },
  props: {
    graph: {
      type: Object,
      required: true
    }
  },

  beforeRouteUpdate (to, from, next) {
    makeGraph(this.graph, this, to.query);
    
    next();
  },

  mounted() {
    if (typeof this.graph == 'object')
      makeGraph(this.graph, this, this.$route.query);
  },
};
</script>