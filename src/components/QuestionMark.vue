<script setup lang="ts">
import Popover from 'primevue/popover'

const op = ref<Popover>()
</script>

<template>
  <div>
    <Popover ref="op">
      <slot name="help" />
    </Popover>
    <slot name="body" />
    <sup>
      <i
        class="pi pi-question-circle text-100 hover:text-cyan-500"
        @mouseenter="(e) => op.toggle(e)"
        @mouseleave="() => op.hide()"
      />
    </sup>
  </div>
</template>
