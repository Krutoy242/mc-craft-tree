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
    
    <!-- <v-footer app> -->
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

export default {
  name: 'Graph',
  data() {
    return {
      selectedNode: undefined,
      selectedDeph: 0,
      isScatter: this.$cookies.get('isScatter'),
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
        makeGraph(this.pile, this, toQuery || this.$route.query, this.isScatter)

        function navig(d, isRightClick) {
          vue.$router.push({ path: 'graph', query: { q: d.id, outputs: isRightClick } }).catch(err => {})
        }
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

  watch: {
    isScatter(newValue, oldValue) {
      this.$cookies.set('isScatter',newValue)
      this.updateGraph()
    }
  },
}
</script>