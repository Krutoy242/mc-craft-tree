<script setup lang="ts">
import type { Ref } from 'vue'
import * as d3 from 'd3'
import { storeToRefs } from 'pinia'
import { makeGraphTree } from '~/assets/graph/simulation'
import type { Item } from '~/assets/items/Item'
import usePileStore from '~/stores/pile'

const pile = usePileStore()
const pickedItems = storeToRefs(pile).pickedItems as unknown as Ref<Item[]>

let hoveredItem = $shallowRef<Item>()

onMounted(updateGraph)
watch(pickedItems, updateGraph)

function updateGraph() {
  if (!pickedItems.value)
    return

  makeGraphTree(
    d3.select('#viz') as any,
    pickedItems.value,
    {
      mouseover: d => hoveredItem = d,
      click: (d, isRight) => isRight ? pile.pileFrom(d) : pile.pileTo(d),
    },
  )
}
</script>

<template>
  <div
    class="relative"
  >
    <div v-if="hoveredItem" class="fixed">
      <ItemDetailed :item="hoveredItem" />
      <Recipes v-if="hoveredItem?.bestRecipe()?.[0]" :recipes="[hoveredItem!.bestRecipe()![0]]" />
    </div>
    <svg id="viz" class="w-full h-full" />
  </div>
</template>
