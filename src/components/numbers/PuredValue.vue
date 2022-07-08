<script setup lang="ts">
import tinygradient from 'tinygradient'

const props = defineProps<{ purity: number }>()

const gradient = tinygradient([
  'rgb(255,0,0)',
  'rgb(228,211,43)',
  'rgb(0,145,41)',
  'rgb(0,255,252)',
])

const color = computed(() =>
  props.purity === 1.0
    ? 'rgba(255,255,255,0.5)'
    : gradient.hsvAt(props.purity).setAlpha(0.5).toHslString(),
)
</script>

<template>
  <div class="relative flex justify-content-center align-items-end">
    <slot />
    <div class="black-bar absolute">
      <div
        :style="`background:${color}; height:2px; width:${
          (purity * 100) | 0
        }%;`"
      />
    </div>
  </div>
</template>

<style scoped>
.black-bar {
  background: black;
  height: 3px;
  width: 100%;
  max-width: 50px;
}
</style>
