<script setup lang="ts">
import mineParse from '~/assets/lib/mineParse'

const props = defineProps<{ value: string }>()

const parsedText = computed(() => mineParse(props.value).raw)
</script>

<template>
  <span v-html="parsedText" />
</template>
