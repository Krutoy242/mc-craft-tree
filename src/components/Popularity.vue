<template>
  <v-container style="position: relative" class="pa-0 text-center">
    <v-container
      fill-height
      class="pa-0"
      style="
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
      "
    >
      <v-flex class="border-2px">
        {{ number || '-' }}
      </v-flex>
    </v-container>
    <v-icon v-if="number > 0" large :color="color" style="position: relative">
      <slot>mdi-cog</slot>
    </v-icon>
  </v-container>
</template>

<script>
export default {
  props: {
    number: {
      type: Number,
    },
    color: {
      type: String,
      default: '#BF360C',
    },
  },
}
</script>

<style scoped>
.border-2px {
  text-shadow: 1px 1px 0 #1e1e1e, -1px 1px 0 #1e1e1e, 1px -1px 0 #1e1e1e,
    -1px -1px 0 #1e1e1e, 0px 1px 0 #1e1e1e, 0px -1px 0 #1e1e1e,
    -1px 0px 0 #1e1e1e, 1px 0px 0 #1e1e1e, 2px 2px 0 #1e1e1e, -2px 2px 0 #1e1e1e,
    2px -2px 0 #1e1e1e, -2px -2px 0 #1e1e1e, 0px 2px 0 #1e1e1e,
    0px -2px 0 #1e1e1e, -2px 0px 0 #1e1e1e, 2px 0px 0 #1e1e1e, 1px 2px 0 #1e1e1e,
    -1px 2px 0 #1e1e1e, 1px -2px 0 #1e1e1e, -1px -2px 0 #1e1e1e,
    2px 1px 0 #1e1e1e, -2px 1px 0 #1e1e1e, 2px -1px 0 #1e1e1e,
    -2px -1px 0 #1e1e1e;
}
</style>
