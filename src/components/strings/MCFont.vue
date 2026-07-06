<script setup lang="ts">
defineProps<{ value: string }>()
</script>

<template>
  <MCString class="mcfont" :value="value" />
</template>

<style scoped>
@font-face {
  font-family: "Minecraft";
  src: url("../../assets/fonts/Monocraft.ttf") format("truetype");
}

.mcfont {
  font-family: Minecraft, Consolas, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
}
</style>
