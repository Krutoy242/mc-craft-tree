<template>
  <div>
    <kbd
      ><span :style="{ 'color' : `hsl(${h}, 60%, 40%)` }">{{
        node.name.source
      }}</span
      >:<span class="blue--text text--lighten-3">{{ node.name.entry
      }}</span
      ><span v-if="node.name.meta">:{{ node.name.meta }}</span></kbd
    >
  </div>
</template>

<script>

Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
    let hash = 0, i, chr
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i)
      hash  = ((hash << 5) - hash) + chr
      hash |= 0 // Convert to 32bit integer
    }
    return hash
  }
})

export default {
  props: {
    node: {
      type: Object,
    },
  },
  computed: {
    h() {
      return Math.abs(this.node.name.source.hashCode()) % 256
    },
  },
}
</script>
