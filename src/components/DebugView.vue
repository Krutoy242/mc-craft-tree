<template>
  <v-tabs>

    <v-tab>
      <v-icon left>mdi-border-none-variant</v-icon>
      No icons
    </v-tab>

    <v-tab>
      <v-icon left>mdi-sync</v-icon>
      Recipe Loops
    </v-tab>

    <v-tab-item>
      <!-- <v-card>
        <v-card-text>
          <tree-entry
            v-for="node in sortedNoIcon"
            :key="node.id"
            :node="node"
          />
        </v-card-text>
      </v-card> -->
      <v-data-table
        :headers="[{text: 'Item', value: 'display'}]"
        :items="sortedNoIcon"
        hide-default-header
        class="elevation-1"
      >
        <template #item.display="{ item }"><tree-entry :node="item" class="pa-2" /></template>
      </v-data-table>
    </v-tab-item>

    <v-tab-item v-if="listLoop">
      <!-- <v-card>
        <v-card-title v-if="listLoop.length === 0">
          No loops found 👍
        </v-card-title>
        <v-card-text>
          <tree-entry
            v-for="node in [...listLoop]"
            :key="node.id"
            :node="node"
          />
        </v-card-text>
      </v-card> -->
      <v-data-table
        :headers="[{text: 'Item', value: 'display'}]"
        :items="[...listLoop]"
        hide-default-header
        class="elevation-1"
      >
        <template #item.display="{ item }"><tree-entry :node="item" class="pa-2" /></template>
      </v-data-table>
    </v-tab-item>

  </v-tabs>
</template>

<script>
export default {
  props: {
    debugInfo: {
      type: Object
    },
  },
  
  computed: {
    sortedNoIcon(){
      if (this.debugInfo?.noIcon)
        return this.debugInfo.noIcon.slice(0).sort(function (a, b) {   
          return ('' + a.base.name).localeCompare(b.base.name)
        })
      return undefined
    },
    listLoop() {
      return [...(this.debugInfo?.listLoops.values() ?? [])]
    }
  },

}
</script>

vue