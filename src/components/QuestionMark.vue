<script setup lang="ts">
import OverlayPanel from 'primevue/overlaypanel'

const op = $ref<OverlayPanel>()
</script>

<template>
  <div>
    <OverlayPanel ref="op">
      <slot name="help" />
    </OverlayPanel>
    <slot name="body" />
    <sup>
      <i
        class="pi pi-question-circle text-100 hover:text-cyan-500"
        @mouseenter="(e) => op.show(e)"
        @mouseleave="() => op.hide()"
      />
    </sup>
  </div>
</template>
