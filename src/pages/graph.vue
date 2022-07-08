<script setup lang="ts">
import * as d3 from 'd3'
import { makeGraphTree } from '~/assets/graph/simulation'
import usePileStore from '~/stores/pile'

const pile = usePileStore()

onMounted(() => updateGraph())

function updateGraph() {
  if (!pile.allItems)
    return

  makeGraphTree(
    d3.select('#viz') as any,
    pile.allItems,
  )
}
</script>

<template>
  <div style="position: relative; height: 100%">
    <!-- <div style="position: absolute" class="ma-4">
      <tree-entry
        v-if="pile.selectedItem"
        :node="pile.selectedItem"
        size="64"
        details="big"
      />
    </div> -->
    <svg id="viz" style="width: 100%; height: 100%" />
  </div>
</template>
