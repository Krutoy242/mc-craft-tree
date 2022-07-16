<script setup lang="ts">
import type { Item } from '~/assets/items/Item'
defineProps<{ item: Item; amount?: number }>()
</script>

<template>
  <div class="text-xs relative">
    <img
      v-tooltip="item.display"
      :src="item.href"
    >
    <div
      v-if="amount && amount > 1"
      class="absolute bottom-0 right-0"
    >
      <MCFont :value="String(amount)" />
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
