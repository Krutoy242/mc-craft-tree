<template>
  <v-container class="pa-0 text-center outer">
    <v-container
      fill-height
      class="pa-0"
      :style="`position: relative; z-index: 1; left: 0; bottom: 0; right: 0; top: 0px;`"
    >
      <v-flex >
        {{ number || "-" }}
      </v-flex>
    </v-container>

    <v-container :class="'pa-0 inner ' + (inverted ? 'flipped' : '')">
      <curve-text
        :class="(inverted ? 'shifted-flipped smaller' : 'shifted smaller')"
        :width="inverted?45:55"
        :height="inverted?40:50"
        :r="inverted?30:35"
        :color="inverted ? 'teal' : 'green'"
      >
        {{ getArrows(number, 0) }}
      </curve-text>
    </v-container>

    <v-container :class="'pa-0 inner ' + (inverted ? 'flipped' : '')">
      <curve-text
        :class="(inverted ? 'shifted-flipped mediumer' : 'shifted mediumer')"
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
const arrows         = ['⭣','🠯','🠳','🡇','🢃']
const arrowsInverted = ['🠥','🠭','🠱','🡅','🢁']

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
      let arr = []
      const r = this.inverted ? arrowsInverted : arrows

      if ((n > 9 + offset) && (offset===0))arr.unshift(r[4])
      if ( n > 8 + offset) arr.push   (r[4])
      if ( n > 7 + offset) arr.unshift(r[2])
      if ( n > 6 + offset) arr.push   (r[2])
      if ( n > 5 + offset) arr.unshift(r[1])
      if ( n > 4 + offset) arr.push   (r[1])
      if ( n > 3 + offset) arr.unshift(r[0])
      if ( n > 2 + offset) arr.push   (r[0])
      if ( n > 1 + offset) arr.unshift(r[0])
      if ( n > 0 + offset) arr.push   (r[0])
        
      return arr.join('')
    }
  },
}
</script>

<style scoped>
.outer {
    position: relative; /* or absolute */
    width: 60px;
    height: 40px;
}

.flipped {
  transform: rotate(180deg) /* scale(0.6) */;
}

.smaller {
  transform: scale(0.7);
}

.mediumer {
  transform: scale(0.9);
}

.shifted {
  position: relative; left: -50%; top: -70%;
}

.shifted-flipped {
  position: relative; left: 50%; top: 50%;
}

.inner {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
}
</style>