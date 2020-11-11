<template>
  <div style="position: relative; height: 100%">
    <div style="position: absolute;" class="ma-4">
      <tree-entry v-if="selectedNode" :node="selectedNode" size="64"/>
    </div>
    <svg id="viz" style="width: 100%; height: 100%"></svg>
    <v-system-bar
      color="indigo darken-2"
    >
      Navigation: 
      <v-icon class="ml-4" small>mdi-mouse</v-icon> LCM Show Inputs
      <v-icon class="ml-4" small>mdi-mouse</v-icon> RCM Show outputs
      <v-icon class="ml-4" small>mdi-graph</v-icon> Return to whole tree
    </v-system-bar>
  </div>
</template>

<script>

import { initGraph } from '../assets/js/graph.ts'
import { globalTree } from '../assets/js/ConstituentTree.ts'
import { makeGraphTree } from '../assets/js/GraphSimulation.ts'

export default {
  name: 'Graph',
  data() {
    return {
      selectedNode: undefined,
    }
  },
  props: {
    pile: {
      type: Object,
      required: true
    }
  },

  methods: {
    updateGraph(toQuery) {
      if (typeof this.pile == 'object') {
        initGraph(this, (d, isRightClick) => this.$router.push({ path: 'graph', query: { q: d.id, outputs: isRightClick } }).catch(_err => {}))
        
        makeGraphTree(d3.select('#viz'), this)

        // makeGraph(this.pile, this, toQuery || this.$route.query, this.isScatter)
      }
    }
  },

  beforeRouteUpdate (to, from, next) {
    this.updateGraph(to.query)
    
    next()
  },
  
  mounted() {
    this.updateGraph()
  },
}
</script>