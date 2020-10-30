<template>
  <div>
    <kbd
      ><span :style="{ 'color' : `hsl(${h}, 60%, 40%)` }">{{
        node.entrySource
      }}</span
      >:<span class="blue--text text--lighten-3">{{ node.entryName
      }}</span
      ><span v-if="node.entryMeta&&node.entryMeta!=0">:{{ node.entryMeta }}</span></kbd
    >
  </div>
</template>

<script>

Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
    var hash = 0, i, chr
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
    h(str) {
      return Math.abs(this.node.entrySource.hashCode()) % 256
    },
  },
}
</script>
