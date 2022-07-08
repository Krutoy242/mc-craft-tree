<!-- Grid with items with different sizes to represent their values -->

<script setup lang="ts">
import * as d3 from 'd3'
import type { Stack } from '~/assets/items/Stack'

interface TreemapDatum {
  stack: Stack
  value: number
}

const props = defineProps<{ stacks: Stack[] }>()

const width = computed(() => Math.min(350, props.stacks.length * 50))
const height = computed(() => ((props.stacks.length / 7 + 1) | 0) * 50)
const rootNode = computed(() => {
  const cuentsAsTreeMap = {
    value   : 0,
    children: props.stacks.map(
      stack =>
        ({
          stack,
          value: Math.log(stack.ingredient.complexity * stack.amount) * 10 + 10,
        }),
    ) as TreemapDatum[],
  }
  return (
    d3
      .treemap<typeof cuentsAsTreeMap>()
      // .tile(d3.treemapBinary)
      .size([width.value, height.value])
      .round(true)
      .padding(2)(
        d3
          .hierarchy(cuentsAsTreeMap)
          .sum(d => d.value)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
      )
  )
})
</script>

<template>
  <div :style="`position:relative; width:${width}px; height:${height}px;`">
    <!-- <tree-entry
      v-for="(cs_node, i) in rootNode.children"
      :key="i"
      :node="cs_node.data.cs.cuent"
      :amount="cs_node.data.cs.amount"
      dense
      :width="cs_node.x1 - cs_node.x0"
      :height="cs_node.y1 - cs_node.y0"
      :style="`position:absolute; top:${cs_node.y0}px; left:${cs_node.x0}px;`"
      details="resized"
    /> -->
  </div>
</template>
