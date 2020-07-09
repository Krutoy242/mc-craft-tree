<template>
  <div>
    <span v-if="number>0">{{ number }}</span>
    <span class="text-h6">{{ smily }}</span>
  </div>
</template>

<script>
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}
const faces = ['🌍','🙂','😉','🤨','😐','😒','😢','😰','🥵','🤬','💀'];
const faceMultipl = (faces.length - 2) / Math.log(5000)


export default {

  props: {
    number: {
      type: Number
    }
  },

  computed: {
    smily() {
      const n = Math.ceil((Math.log(this.number + 1)) * faceMultipl);
      return faces[Math.min(faces.length - 1, n)];
    }
  },
}
</script>

<style scoped>

</style>