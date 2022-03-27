<template>
  <div>
    <slot />
    <div class="back">
      <div :style="`background:${color}; height:2px; width:${(purity * 100) | 0}%;`"></div>
    </div>
  </div>
</template>

<script>
import * as tinygradient from 'tinygradient'
const gradient = tinygradient(['rgb(255,0,0)', 'rgb(228,211,43)', 'rgb(0,145,41)', 'rgb(0,255,252)'])
export default {
  props: {
    purity: { default: 0.0 },
  },
  computed: {
    color() {
      if (this.purity === 1.0) return 'rgba(255,255,255,0.5)'
      return gradient.hsvAt(this.purity).setAlpha(0.5).toHslString()
    },
  },
}
</script>

<style scoped>
.back {
  /* position: absolute;
  bottom: 0px; */
  margin-top: -3px;
  background: black;
  height: 3px;
  width: 100%;
}
</style>
