<template>
  <div style="position: relative; height: 100%">
    <div style="position: absolute;" class="ma-4">
      <tree-entry v-if="selectedNode" :node="selectedNode" size="64"/>
    </div>
    <div style="position: absolute; right: 0;" class="ma-4">
      <v-switch v-model="isScatter" :label="`View as Scatter`"></v-switch>
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
      isScatter: false,
    }
  },
  props: {
    graph: {
      type: Object,
      required: true
    }
  },

  methods: {
    updateGraph(toQuery) {
      if (typeof this.graph == 'object')
        makeGraph(this.graph, this, toQuery || this.$route.query, this.isScatter);
      
    }
  },

  beforeRouteUpdate (to, from, next) {
    this.updateGraph(to.query);
    
    next();
  },

  mounted() {
    this.updateGraph();
  },

  watch: {
    isScatter(newValue, oldValue) {
      this.updateGraph();
    }
  },
};
</script>