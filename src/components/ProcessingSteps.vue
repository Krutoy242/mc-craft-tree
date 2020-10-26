<template>
  <div style="flex-wrap: nowrap;">
    <span v-if="number > 0 && !smile">{{ number }}</span>
    <span class="text-h6">{{ smily }}</span>
  </div>
</template>

<script>

const faces = [...'🌍🙂😃😄😁😀😉😏😊😙😗😶😐😑🤨😒😬😤😮😯😕🙁😟🤒🤕😓😥😢😰😭🤧😵😣😖😠🤮😱🥵😡🤬💀']

// Approximate value evaluated from solving atan(600/x)*x = faces.length - 2
const x = 25.5187041348092
function fnc(n) {
  return Math.ceil(Math.atan(n/x)*x)
}

function getFace(number) {
  return faces[Math.min(faces.length - 1, fnc(number))]
}



/* Unused smiles:
🥴😆😅🤣😂🙃😇😚😋🤐🙄🤥😷🤢🥶🤯😲😳🥺😦😧😨😞😩😫😈👿
*/

export default {

  props: {
    number: {
      type: Number
    },
    smile : {
      type: Boolean,
      default: false
    }
  },

  computed: {
    smily() {
      return getFace(this.number)
    }
  },
}
</script>

<style scoped>

</style>