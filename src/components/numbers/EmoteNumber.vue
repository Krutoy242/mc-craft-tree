<script setup lang="ts">
const props = defineProps({
  number: {
    type: Number,
  },
  smile: {
    type   : Boolean,
    default: false,
  },
})

const faces = [
  ...'🌍🙂😃😄😁😀😉😏😊😙😗😶😐😑🤨😒😬😤😮😯😕🙁😟🤒🤕😓😥😢😰😭🤧😵😣😖😠🤮😱🥵😡🤬💀☠️👹👿🔥💥⚡💣',
]

/* Unused smiles:
🥴😆😅🤣😂🙃😇😚😋🤐🙄🤥😷🤢🥶🤯😲😳🥺😦😧😨😞😩😫😈
*/

// Approximate value evaluated from solving atan(600/x)*x = faces.length - 2
const x = 25.5187041348092
function fnc(n: number) {
  return Math.ceil(Math.atan(n / x) * x)
}

function getFace(number: number) {
  return faces[Math.min(faces.length - 1, fnc(number))]
}

const smily = computed(() => props.number ? getFace(props.number) : '?')
</script>

<template>
  <div style="flex-wrap: nowrap">
    <span v-if="number && number > 0 && !smile">{{ number }}</span>
    <span class="text-h6">{{ smily }}</span>
  </div>
</template>
