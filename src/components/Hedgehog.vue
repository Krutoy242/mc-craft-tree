<template>
  <v-container fill-height style="position: relative;" class="pa-0 text-center">
    <v-container
      fill-height
      class="pa-0"
      :style="`position: absolute; z-index: 1; left: 0; bottom: 0; right: 0; top: 3px;`"
    >
      <v-flex >
        {{ number || "-" }}
      </v-flex>
    </v-container>

    <v-container
      class="pa-0"
      :style="'position: absolute; transform: scale(0.50); ' + (inverted ? 'transform: rotate(180deg); bottom: 6px; ' : '')">
      <curve-text
        :width="inverted?45:55"
        :height="inverted?40:50"
        :r="inverted?30:35"
        :color="inverted ? 'teal' : 'green'"
      >
        {{ getArrows(number, 0) }}
      </curve-text>
    </v-container>

    <v-container
      class="pa-0"
      :style="'position: absolute; transform: scale(0.8); ' + (inverted ? 'transform: rotate(180deg); bottom: -3px; ' : '')">
      <curve-text
        v-if="number > 10"
        :width="inverted?55:55"
        :height="inverted?40:50"
        :r="inverted?30:35"
        :color="inverted ? 'teal' : 'green'"
      >
        {{ getArrows(number, 10) }}
      </curve-text>
    </v-container>
  </v-container>
</template>

<script>
const arrows         = ["⭣","🠯","🠳","🡇","🢃"];
const arrowsInverted = ["🠥","🠭","🠱","🡅","🢁"];

export default {

  props: {
    number: {
      type: Number
    },
    inverted: {
      default: false
    }
  },
  
  methods: {
    getArrows(n, offset){
      var arr = [];
      const r = this.inverted ? arrowsInverted : arrows;

      if ((n > 9 + offset) && (offset===0))arr.unshift(r[4]);
      if ( n > 8 + offset) arr.push   (r[4]);
      if ( n > 7 + offset) arr.unshift(r[2]);
      if ( n > 6 + offset) arr.push   (r[2]);
      if ( n > 5 + offset) arr.unshift(r[1]);
      if ( n > 4 + offset) arr.push   (r[1]);
      if ( n > 3 + offset) arr.unshift(r[0]);
      if ( n > 2 + offset) arr.push   (r[0]);
      if ( n > 1 + offset) arr.unshift(r[0]);
      if ( n > 0 + offset) arr.push   (r[0]);
        
      return arr.join('');
    }
  },
}
</script>

<style scoped>

</style>