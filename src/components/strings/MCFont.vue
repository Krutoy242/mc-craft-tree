<script setup lang="ts">
defineProps<{ value: string }>()
</script>

<template>
  <MCString class="mcfont" :value="value" />
</template>

<style scoped>
@font-face {
  font-family: "Minecraft";
  src: url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.eot");
  src: url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.woff") format("woff"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.svg#Minecraft") format("svg");
}

.mcfont {
  /* font-size: 75%; */
  font-family: Minecraft, Consolas, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
}
</style>
