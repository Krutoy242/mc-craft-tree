<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<template>
  <div class="relative flex justify-content-center">
    <span class="outlined-2px z-1">
      {{ value || '-' }}
    </span>
    <div v-if="value > 0" class="absolute gear i-mdi-cog" />
  </div>
</template>

<style scoped>
.outlined-2px {
  text-shadow: 1px 1px 0 #1e1e1e, -1px 1px 0 #1e1e1e, 1px -1px 0 #1e1e1e,
    -1px -1px 0 #1e1e1e, 0px 1px 0 #1e1e1e, 0px -1px 0 #1e1e1e,
    -1px 0px 0 #1e1e1e, 1px 0px 0 #1e1e1e, 2px 2px 0 #1e1e1e, -2px 2px 0 #1e1e1e,
    2px -2px 0 #1e1e1e, -2px -2px 0 #1e1e1e, 0px 2px 0 #1e1e1e,
    0px -2px 0 #1e1e1e, -2px 0px 0 #1e1e1e, 2px 0px 0 #1e1e1e, 1px 2px 0 #1e1e1e,
    -1px 2px 0 #1e1e1e, 1px -2px 0 #1e1e1e, -1px -2px 0 #1e1e1e,
    2px 1px 0 #1e1e1e, -2px 1px 0 #1e1e1e, 2px -1px 0 #1e1e1e,
    -2px -1px 0 #1e1e1e;
}

.gear {
  color: #BF360C;
  font-size: 2rem;
  top: -30%;
}
</style>
