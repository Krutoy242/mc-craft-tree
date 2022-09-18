<!-- Grid with items with different sizes to represent their values -->

<script setup lang="ts">
import * as d3 from 'd3'
import type { Item } from '~/assets/items/Item'
import { useOptions } from '~/composables/options'

interface Stack { amount?: number; item: Item }

const props = defineProps<{ stacks: Stack[] }>()
const options = useOptions()

const width = $computed(() => Math.min(350, props.stacks.length * 50))
const height = $computed(() => ((props.stacks.length / 5 + 1) | 0) * 42)

const nonlinearFn = (n: number) => n ** 0.5 * 10
const stackValue = $computed(() => (stack: Stack) => nonlinearFn(
  stack.item.complexity * (options.recipe.considerAmount ? (stack.amount ?? 1) : 1),
))
const minSize = $computed(() => Math.max(...props.stacks.map(stackValue)))

const rootNode = $computed(() => {
  const cuentsAsTreeMap = {
    value   : 0,
    children: props.stacks.map(
      stack => ({ stack, value: stackValue(stack) + minSize / 5 }),
    ),
  }

  return (
    d3
      .treemap<typeof cuentsAsTreeMap>()
      // .tile(d3.treemapBinary)
      .size([width, height])
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
    <!-- <span
      v-for="(cs_node, i) in rootNode.children"
      :key="i"
    >{{  }}</span> -->
    <ItemIcon
      v-for="(cs_node, i) in (rootNode.children)"
      :key="i"
      :width="cs_node.x1 - cs_node.x0"
      :height="cs_node.y1 - cs_node.y0"
      :style="`position:absolute; top:${cs_node.y0}px; left:${cs_node.x0}px;`"
      :item="((cs_node.data as any).stack as Stack).item"
      :amount="((cs_node.data as any).stack as Stack).amount"
      class="border-1 border-round-sm border-primary-900"
    />
  </div>
</template>
