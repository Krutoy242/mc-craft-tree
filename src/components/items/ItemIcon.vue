<script setup lang="ts">
import { format } from 'd3-format'
import type { Item } from '~/assets/items/Item'
import usePileStore from '~/stores/pile'

defineProps<{
  item: Item | undefined
  amount?: number
  width?: number
  height?: number
}>()
const pile = usePileStore()

const numFormat = format('.2~s')
</script>

<template>
  <div
    v-if="item"
    v-tooltip="item.display"
    class="ico text-xs border-1 border-round-sm border-primary-900"
    :class="!width ? 'relative' : ''"
    :style="{
      'background-image': `url(${item.href})`,
      'width': `${width ?? 32 + 2}px`,
      'height': `${height ?? 32 + 2}px`,
      'cursor': `${item?.recipes?.size ? 'pointer' : 'default'}`,
    }"
    @click="item?.recipes ? pile.selectRecipes([...item?.recipes], item?.mainRecipe) : undefined"
  >
    <div
      v-if="amount && amount !== 1"
      class="absolute bottom-0 right-0"
    >
      <MCFont :value="numFormat(amount)" />
    </div>
  </div>
</template>

<style scoped>
.ico {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  image-rendering: pixelated;
  box-sizing: border-box;
}
</style>
