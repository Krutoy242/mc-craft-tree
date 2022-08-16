<script setup lang="ts">
import { format } from 'd3-format'
import type { Item } from '~/assets/items/Item'

defineProps<{ item: Item; amount?: number }>()

const numFormat = format('.2~s')
</script>

<template>
  <div v-tooltip="item.display" class="text-xs relative">
    <img
      :src="item.href"
    >
    <div
      v-if="amount && amount > 1"
      class="absolute bottom-0 right-0"
    >
      <MCFont :value="numFormat(amount)" />
    </div>
  </div>
</template>

<style scoped>
img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
</style>
