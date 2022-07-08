<script setup lang="ts">
import usePileStore from '~/stores/pile'

const pile = usePileStore()

const tabs = ref([
  {
    label: 'Graph',
    icon : 'pi pi-fw pi-home',
    to   : '/graph',
  },
  {
    label: 'Table',
    icon : 'pi pi-fw pi-table',
    to   : '/table',
  },
  {
    label: 'History',
    icon : 'pi pi-fw pi-list',
    to   : '/history',
  },
])

onMounted(() => {
  pile.init()
})
</script>

<template>
  <div class="flex flex-column">
    <div flex>
      <TabMenu :model="tabs" />
    </div>
    <div flex mg-y-auto>
      <router-view />
    </div>
    <!-- <div class="absolute bottom-0 bg-gray-900">
      <Footer />
    </div> -->
  </div>
</template>
