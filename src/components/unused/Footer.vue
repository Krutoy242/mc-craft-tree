<script setup lang="ts">
const recipesStoreCount = ref(0)
const uniqueItems = computed(() => 0)
</script>

<template>
  Unique Items: {{ uniqueItems }} Recipes Registered:
  {{ recipesStoreCount }}
  <Button size="x-small" mx-1 href="https://github.com/Krutoy242/CraftTreeVisualizer">
    GutHub
  </Button>
  <Button size="x-small" mx-1 href="https://github.com/Krutoy242/Enigmatica2Expert-Extended">
    Recipes from E2:E - Extended
  </Button>
</template>
