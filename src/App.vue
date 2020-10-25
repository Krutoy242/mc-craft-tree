<template>
  <v-app id="inspire">

    <v-app-bar app clipped-left>
      <v-tabs>

        <v-tab link to="graph">
          <v-icon>mdi-graph</v-icon>
          <span class="ma-3">Graph</span>
        </v-tab>
        
        <v-tab link to="table">
          <v-icon>mdi-table</v-icon>
          <span class="ma-3">Table</span>
        </v-tab>
        
      </v-tabs>
      <v-spacer />

      <!-- Debug Button -->
      <v-dialog scrollable max-width="500px">
        
        <template v-slot:activator="{ on, attrs }">
          <v-btn  color="primary" small
            v-bind="attrs"
            v-on="on"
          >
            Debug info
          </v-btn>
        </template>

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
            <v-card>
              <v-card-text>
                <tree-entry
                  v-for="node in sortedNoIcon"
                  :key="node.id"
                  :node="node"
                />
              </v-card-text>
            </v-card>
          </v-tab-item>

          <v-tab-item v-if="pile.info && pile.info.listLoops">
            <v-card>
              <v-card-title v-if="pile.info.listLoops.length === 0">
                No loops found 👍
              </v-card-title>
              <v-card-text>
                <tree-entry
                  v-for="node in pile.info.listLoops"
                  :key="node.id"
                  :node="node"
                />
              </v-card-text>
            </v-card>
          </v-tab-item>

        </v-tabs>

      </v-dialog>


      <!-- Download button -->
      <download-lists :pile="pile"/>
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
        <!-- If using vue-router -->
        <router-view :pile="pile" :key="$route.path"></router-view>
    </v-main>

    <!-- <v-footer app> -->
    <v-system-bar>
      Navigation: 
      <v-icon class="ml-4" small>mdi-mouse</v-icon> LCM Show Inputs
      <v-icon class="ml-4" small>mdi-mouse</v-icon> RCM Show outputs
      <v-icon class="ml-4" small>mdi-graph</v-icon> Return to whole tree
      <v-spacer></v-spacer>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/CraftTreeVisualizer">GutHub</v-btn>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/Enigmatica2Expert-Extended">Recipes from E2:E - Extended</v-btn>
    </v-system-bar>
    <!-- </v-footer> -->
  </v-app>
</template>

<script>
import { parseJECgroups } from './assets/js/jec_parse.js'
import DownloadLists from './components/DownloadLists.vue'
import { setAdditionals, calculate } from './assets/js/constituents.js'
import { mergeJECGroups } from './assets/js/recipes.js'

import default_additionals from './assets/default_additionals.json'
import default_aliases from './assets/default_aliases.json'
import default_jecGroups from './assets/jec_groups.json'

// import groups from './assets/groups.json'
// import parsedData from './assets/parsedData.json'
// import recipes from './assets/recipes.json'

export default {
  components: {
    DownloadLists,
  },
  data: () => ({
    drawer: null,
    pile: Object,
  }),

  created() {
    this.$vuetify.theme.dark = true
  },

  mounted() {
    // this.pile = parseJECgroups(groups, parsedData)
    // constituents.mergeWith('./assets/constituents.json')
    setAdditionals(default_additionals)
    var jec_groups = parseJECgroups(default_jecGroups, default_aliases)
    mergeJECGroups(jec_groups)

    this.pile = calculate('storagedrawers__upgrade_creative__1')
  },
  
  computed: {
    sortedNoIcon(){
      if (this.pile?.info?.noIcon)
        return this.pile.info.noIcon.slice(0).sort(function (a, b) {   
          return ('' + a.name).localeCompare(b.name)
        })
      return undefined
    }
  },
}
</script>
