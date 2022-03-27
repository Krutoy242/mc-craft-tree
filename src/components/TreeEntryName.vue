<template>
  <div>
    <kbd>
      <span :style="{ color: `hsl(${h}, 60%, 40%)` }">{{ node.base.source }}</span>
      :
      <span class="blue--text text--lighten-3">{{ node.base.entry }}</span>
      <span v-if="node.base.meta">:{{ node.base.meta }}</span>
    </kbd>
  </div>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
    },
  },
  computed: {
    h() {
      return Math.abs(this.node.base.source.hashCode()) % 256
    },
  },
}
</script>
