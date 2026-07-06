<script setup lang="ts">
defineProps<{ value: string }>()
</script>

<template>
  <MCString class="mcfont" :value="value" />
</template>

<style scoped>
.mcfont {
  font-family: Consolas, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
}
</style>
