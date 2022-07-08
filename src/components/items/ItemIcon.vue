<script setup lang="ts">
defineProps<{ id: string }>()

const imagePath = 'https://github.com/Krutoy242/E2E-E-icons/raw/main/x32'

function getImagePath(id: string) {
  return id.includes('{')
    ? ''
    : `${imagePath}/${id.replace(/:/g, '__')}.png`
}
</script>

<template>
  <img :src="getImagePath(id)">
</template>

<style scoped>
img {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
}
</style>
