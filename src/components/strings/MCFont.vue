<script setup lang="ts">
defineProps<{ value: string }>()
</script>

<template>
  <MCString class="mcfont" :value="value" />
</template>

<style scoped >
@import url(//db.onlinewebfonts.com/c/6ab539c6fc2b21ff0b149b3d06d7f97c?family=Minecraft);
.mcfont {
  /* font-size: 75%; */
  font-family: Minecraft, Consolas, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
}
</style>
