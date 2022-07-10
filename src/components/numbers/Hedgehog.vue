<script setup lang="ts">
const props = defineProps<{ value: number }>()

const arrows = [
  [...'⭣🠯🠳🡇🢃'],
  [...'🠥🠭🠱🡅🢁'],
]

const number = computed(() => Math.abs(props.value))
const isInverted = computed(() => props.value < 0)

function getArrows(n: number, offset: number) {
  if (isNaN(n))
    return '???'
  const arr = []
  const r = isInverted.value ? arrows[1] : arrows[0]
  const k = n - offset

  if (k > 9 && offset === 0)
    arr.unshift(r[4])
  if (k > 8)
    arr.push(r[4])
  if (k > 7)
    arr.unshift(r[2])
  if (k > 6)
    arr.push(r[2])
  if (k > 5)
    arr.unshift(r[1])
  if (k > 4)
    arr.push(r[1])
  if (k > 3)
    arr.unshift(r[0])
  if (k > 2)
    arr.push(r[0])
  if (k > 1)
    arr.unshift(r[0])
  if (k > 0)
    arr.push(r[0])

  return arr.join('')
}
</script>

<template>
  <div class="relative flex justify-content-center">
    {{ number || '-' }}

    <div
      v-for="v, i in (new Array(number > 10 ? 2 : 1))"
      :key="`${v}_${i}`"
      :class="`absolute ${isInverted ? 'flipped' : 'nonflipped'}`"
    >
      <CurveText
        :class="!i ? 'smaller' : ''"
        :style="`top: ${isInverted ? '-' : ''}50%;`"
        :width="65"
        :height="50"
        :r="35"
        :color="isInverted ? 'teal' : 'green'"
      >
        {{ getArrows(number, i ? 10 : 0) }}
      </CurveText>
    </div>
  </div>
</template>

<style scoped>
.flipped {
  transform: rotate(180deg) /* scale(0.6) */;
  top: -30%;
}
.nonflipped {
  top: -70%;
}

.smaller {
  transform: scale(0.7);
}
</style>
