<script setup lang="ts">
import { format } from 'd3-format'
import type { Item } from '~/assets/items/Item'
import usePileStore from '~/stores/pile'

const props = defineProps<{
  item: Item | undefined
  amount?: number
  width?: number
  height?: number
}>()
const pile = usePileStore()

const numFormat = format('.2~s')

const w = computed(() => props.width ?? 32)
const h = computed(() => props.height ?? 32)

const scale = Math.max(w.value, h.value) / 16

function getPosition(href: string) {
  const [x, y] = href.split(' ').map(v => -Number(v) * scale) as [number, number]
  return `${x + Math.min(0, w.value / h.value - 1) * w.value}px ${
    y + Math.min(0, h.value / w.value - 1) * h.value}px`
}
</script>

<template>
  <div
    v-if="item"
    v-tooltip="item.display"
    class="ico text-xs border-1 border-round-sm border-primary-900"
    :class="!width ? 'relative' : ''"
    :style="{
      'cursor': `${item?.recipes?.length ? 'pointer' : 'default'}`,
      'width': `${width ?? 32 + 2}px`,
      'height': `${height ?? 32 + 2}px`,
      'background-position': getPosition(item.href),
      'background-size': `${4096 * scale}px ${4096 * scale}px`,
    }"
    @click="item?.recipes ? pile.selectRecipes(item?.recipes.map(([r]) => r), item?.bestRecipe()?.[0]) : undefined"
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
  background-image: url(https://github.com/Krutoy242/mc-icons/raw/9460084e09870dfd3316c6168ac8eadce293815f/i/sprite.png);
  background-repeat: no-repeat;
  image-rendering: pixelated;
  box-sizing: border-box;
}
</style>
