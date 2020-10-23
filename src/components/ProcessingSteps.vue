<template>
  <div style="flex-wrap: nowrap;">
    <span v-if="number > 0 && !smile">{{ number }}</span>
    <span class="text-h6">{{ smily }}</span>
  </div>
</template>

<script>
const faces = ['🌍','🙂','😉','🤨','😐','😒','😢','😰','🥵','🤬','💀']
const faceMultipl = (faces.length - 2) / Math.log(600)


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
      const n = Math.ceil((Math.log(this.number + 1)) * faceMultipl)
      return faces[Math.min(faces.length - 1, n)]
    }
  },
}
</script>

<style scoped>

</style>