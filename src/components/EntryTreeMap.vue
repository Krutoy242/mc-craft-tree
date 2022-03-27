<template>
  <div :style="`position:relative; width:${width}px; height:${height}px;`">
    <tree-entry
      v-for="(cs_node, i) in rootNode.children"
      :key="i"
      :node="cs_node.data.cs.cuent"
      :amount="cs_node.data.cs.amount"
      dense
      :width="cs_node.x1 - cs_node.x0"
      :height="cs_node.y1 - cs_node.y0"
      :style="`position:absolute; top:${cs_node.y0}px; left:${cs_node.x0}px;`"
      details="resized"
    />
  </div>
</template>

<script lang="ts">
import * as d3 from 'd3'
import Vue from 'vue'
import { ConstituentStack } from '../assets/js/cuents/ConstituentStack'

interface TreemapDatum {
  value: number
}

export default Vue.extend({
  name: 'Treemap',

  props: {
    entryList: {
      type: Array as () => Array<ConstituentStack>,
      required: true,
      default: [],
    },
  },

  data() {
    return {
      margin: {
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      },
    }
  },

  computed: {
    listLen() {
      return (this.entryList as Array<ConstituentStack>).length || 0
    },
    width() {
      return Math.min(350, (this as any).listLen * 50)
    },
    height() {
      return (((this as any).listLen / 7 + 1) | 0) * 50
    },
    rootNode() {
      const cuentsAsTreeMap = {
        value: 0,
        children: this.entryList.map(
          (cs) =>
            ({
              cs: cs,
              value: Math.log(cs.cuent.complexity * cs.amount) * 10 + 10,
            } as TreemapDatum)
        ),
      }
      return (
        d3
          .treemap<typeof cuentsAsTreeMap>()
          // .tile(d3.treemapBinary)
          .size([(this as any).width, (this as any).height])
          .round(true)
          .padding(2)(
          d3
            .hierarchy(cuentsAsTreeMap)
            .sum((d) => d.value)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
        )
      )
    },
  },
})
</script>
