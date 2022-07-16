<script setup lang="ts">
import type { Item } from '~/assets/items/Item'
defineProps<{ item: Item }>()
</script>

<template>
  <img :src="item.href">
</template>

<style scoped>
img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
</style>
